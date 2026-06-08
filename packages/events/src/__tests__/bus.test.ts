/**
 * Tests — EventBus
 *
 * Covers all acceptance criteria from the spec:
 * - Ordered delivery
 * - Async delivery
 * - Wildcard subscriptions (exact, domain.*, *)
 * - Handler failure isolation
 * - event.handler_failed emission
 * - Replay
 * - on / off / subscriptionCount
 */

import { describe, expect, it, vi } from "vitest";

import { EventBus } from "../bus.js";
import { createBaseEventFields } from "../utils.js";

import type { BaseEvent, ToolCompletedEvent } from "../types.js";
import type { AnyDBZEvent } from "../registry.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(type: string, source = "test"): AnyDBZEvent {
  // Cast is intentional: test helpers produce minimal valid events.
  // Production code must use the typed event constructors.
  return { ...createBaseEventFields(type, source) } as AnyDBZEvent;
}

function makeToolCompleted(toolName = "bash"): ToolCompletedEvent {
  return {
    ...createBaseEventFields("tool.completed", "test"),
    toolName,
    durationMs: 10,
    success: true,
  };
}

// ─── Construction ─────────────────────────────────────────────────────────────

describe("EventBus — construction", () => {
  it("creates a new instance with zero subscriptions", () => {
    const bus = new EventBus();
    expect(bus.subscriptionCount).toBe(0);
  });

  it("each instance is independent", () => {
    const busA = new EventBus();
    const busB = new EventBus();

    busA.on("tool.completed", vi.fn());
    expect(busA.subscriptionCount).toBe(1);
    expect(busB.subscriptionCount).toBe(0);
  });
});

// ─── Subscription — on / off ──────────────────────────────────────────────────

describe("EventBus — on / off", () => {
  it("registers a subscription and returns an unsubscribe function", () => {
    const bus = new EventBus();
    const unsub = bus.on("tool.completed", vi.fn());

    expect(bus.subscriptionCount).toBe(1);

    unsub();
    expect(bus.subscriptionCount).toBe(0);
  });

  it("off() removes the subscription", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("tool.completed", handler);
    expect(bus.subscriptionCount).toBe(1);

    bus.off("tool.completed", handler);
    expect(bus.subscriptionCount).toBe(0);
  });

  it("off() only removes the first matching occurrence", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("tool.completed", handler);
    bus.on("tool.completed", handler);
    expect(bus.subscriptionCount).toBe(2);

    bus.off("tool.completed", handler);
    expect(bus.subscriptionCount).toBe(1);
  });

  it("off() with unknown handler is a no-op", () => {
    const bus = new EventBus();
    bus.on("tool.completed", vi.fn());

    expect(() => bus.off("tool.completed", vi.fn())).not.toThrow();
    expect(bus.subscriptionCount).toBe(1);
  });

  it("allows multiple subscriptions to the same pattern", () => {
    const bus = new EventBus();
    bus.on("tool.completed", vi.fn());
    bus.on("tool.completed", vi.fn());
    bus.on("tool.completed", vi.fn());

    expect(bus.subscriptionCount).toBe(3);
  });
});

// ─── Exact Subscriptions ──────────────────────────────────────────────────────

describe("EventBus — exact subscriptions", () => {
  it("delivers an event to an exact subscriber", async () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("tool.completed", handler);
    await bus.emit(makeToolCompleted());

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not deliver to a non-matching exact subscriber", async () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("tool.started", handler);
    await bus.emit(makeToolCompleted());

    expect(handler).not.toHaveBeenCalled();
  });

  it("delivers the event payload unmodified", async () => {
    const bus = new EventBus();
    let received: BaseEvent | undefined;

    bus.on("tool.completed", async (e) => {
      received = e;
    });

    const event = makeToolCompleted("my-tool");
    await bus.emit(event);

    expect(received).toBe(event);
  });
});

// ─── Wildcard Subscriptions ───────────────────────────────────────────────────

describe("EventBus — wildcard subscriptions", () => {
  it("domain.* receives all events in that domain", async () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("tool.*", handler);

    await bus.emit(makeEvent("tool.requested"));
    await bus.emit(makeEvent("tool.started"));
    await bus.emit(makeEvent("tool.completed"));
    await bus.emit(makeEvent("agent.started")); // should not match

    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("* receives every event", async () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("*", handler);

    await bus.emit(makeEvent("tool.completed"));
    await bus.emit(makeEvent("agent.started"));
    await bus.emit(makeEvent("session.created"));

    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("domain.* does not match events in a sibling domain sharing a prefix", async () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("tool.*", handler);
    await bus.emit(makeEvent("tooling.started"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("exact and wildcard subscriptions can coexist for the same event", async () => {
    const bus = new EventBus();
    const exactHandler = vi.fn();
    const namespaceHandler = vi.fn();
    const globalHandler = vi.fn();

    bus.on("tool.completed", exactHandler);
    bus.on("tool.*", namespaceHandler);
    bus.on("*", globalHandler);

    await bus.emit(makeToolCompleted());

    expect(exactHandler).toHaveBeenCalledTimes(1);
    expect(namespaceHandler).toHaveBeenCalledTimes(1);
    expect(globalHandler).toHaveBeenCalledTimes(1);
  });
});

// ─── Ordered Delivery ─────────────────────────────────────────────────────────

describe("EventBus — ordered delivery", () => {
  it("delivers events in emission order", async () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.on("tool.*", async (e) => {
      received.push(e.type);
    });

    await bus.emit(makeEvent("tool.requested"));
    await bus.emit(makeEvent("tool.started"));
    await bus.emit(makeEvent("tool.completed"));

    expect(received).toEqual(["tool.requested", "tool.started", "tool.completed"]);
  });

  it("preserves order when emits are concurrent", async () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.on("tool.*", async (e) => {
      received.push(e.type);
    });

    // Fire all three without awaiting — queue must still serialize them
    const p1 = bus.emit(makeEvent("tool.requested"));
    const p2 = bus.emit(makeEvent("tool.started"));
    const p3 = bus.emit(makeEvent("tool.completed"));

    await Promise.all([p1, p2, p3]);

    expect(received).toEqual(["tool.requested", "tool.started", "tool.completed"]);
  });

  it("calls multiple handlers for the same event in registration order", async () => {
    const bus = new EventBus();
    const order: number[] = [];

    bus.on("tool.completed", async () => { order.push(1); });
    bus.on("tool.completed", async () => { order.push(2); });
    bus.on("tool.completed", async () => { order.push(3); });

    await bus.emit(makeToolCompleted());

    expect(order).toEqual([1, 2, 3]);
  });
});

// ─── Async Delivery ───────────────────────────────────────────────────────────

describe("EventBus — async delivery", () => {
  it("awaits async handlers before moving to the next", async () => {
    const bus = new EventBus();
    const log: string[] = [];

    bus.on("tool.completed", async () => {
      await new Promise((r) => setTimeout(r, 10));
      log.push("handler-1-done");
    });

    bus.on("tool.completed", async () => {
      log.push("handler-2-done");
    });

    await bus.emit(makeToolCompleted());

    expect(log).toEqual(["handler-1-done", "handler-2-done"]);
  });

  it("emit() returns a promise that resolves after all handlers settle", async () => {
    const bus = new EventBus();
    let settled = false;

    bus.on("tool.completed", async () => {
      await new Promise((r) => setTimeout(r, 20));
      settled = true;
    });

    await bus.emit(makeToolCompleted());
    expect(settled).toBe(true);
  });
});

// ─── Error Isolation ──────────────────────────────────────────────────────────

describe("EventBus — handler failure isolation", () => {
  it("does not crash when a handler throws", async () => {
    const bus = new EventBus();

    bus.on("tool.completed", async () => {
      throw new Error("boom");
    });

    await expect(bus.emit(makeToolCompleted())).resolves.toBeUndefined();
  });

  it("continues delivering to subsequent handlers after a failure", async () => {
    const bus = new EventBus();
    const afterFailure = vi.fn();

    bus.on("tool.completed", async () => {
      throw new Error("boom");
    });
    bus.on("tool.completed", afterFailure);

    await bus.emit(makeToolCompleted());

    expect(afterFailure).toHaveBeenCalledTimes(1);
  });

  it("emits event.handler_failed when a handler throws", async () => {
    const bus = new EventBus();
    const failureHandler = vi.fn();

    bus.on("tool.completed", async () => {
      throw new Error("handler error");
    });
    bus.on("event.handler_failed", failureHandler);

    await bus.emit(makeToolCompleted());

    expect(failureHandler).toHaveBeenCalledTimes(1);
    const failureEvent = failureHandler.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(failureEvent["type"]).toBe("event.handler_failed");
    expect(failureEvent["failedEventType"]).toBe("tool.completed");
    expect(failureEvent["error"]).toBe("handler error");
  });

  it("event.handler_failed is caught by global * subscriber", async () => {
    const bus = new EventBus();
    const globalHandler = vi.fn();

    bus.on("tool.completed", async () => {
      throw new Error("boom");
    });
    bus.on("*", globalHandler);

    await bus.emit(makeToolCompleted());

    const types = globalHandler.mock.calls.map(
      (c) => (c[0] as BaseEvent).type,
    );
    expect(types).toContain("tool.completed");
    expect(types).toContain("event.handler_failed");
  });

  it("does not recurse infinitely when event.handler_failed handler throws", async () => {
    const bus = new EventBus();

    bus.on("tool.completed", async () => {
      throw new Error("primary error");
    });

    // This handler also throws — must not cause infinite recursion
    bus.on("event.handler_failed", async () => {
      throw new Error("secondary error");
    });

    await expect(bus.emit(makeToolCompleted())).resolves.toBeUndefined();
  });
});

// ─── Replay ───────────────────────────────────────────────────────────────────

describe("EventBus — replay", () => {
  it("delivers all replayed events to subscribers", async () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("*", handler);

    const events: AnyDBZEvent[] = [
      makeEvent("tool.requested"),
      makeEvent("tool.started"),
      makeEvent("tool.completed"),
    ];

    await bus.replay(events);

    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("preserves the original event id and timestamp during replay", async () => {
    const bus = new EventBus();
    const received: AnyDBZEvent[] = [];

    bus.on("*", async (e) => {
      received.push(e);
    });

    const original = makeEvent("tool.completed");
    await bus.replay([original]);

    expect(received[0]?.id).toBe(original.id);
    expect(received[0]?.timestamp).toBe(original.timestamp);
  });

  it("delivers replayed events in order", async () => {
    const bus = new EventBus();
    const types: string[] = [];

    bus.on("*", async (e) => {
      types.push(e.type);
    });

    await bus.replay([
      makeEvent("session.created"),
      makeEvent("tool.requested"),
      makeEvent("tool.completed"),
    ]);

    expect(types).toEqual(["session.created", "tool.requested", "tool.completed"]);
  });

  it("replay and live emit interleave correctly in the queue", async () => {
    const bus = new EventBus();
    const types: string[] = [];

    bus.on("*", async (e) => {
      types.push(e.type);
    });

    const replayPromise = bus.replay([
      makeEvent("session.created"),
      makeEvent("tool.requested"),
    ]);

    // Emit a live event while replay is in flight
    const livePromise = bus.emit(makeEvent("agent.started"));

    await Promise.all([replayPromise, livePromise]);

    // Order must be deterministic: replay events first, then live
    expect(types).toEqual([
      "session.created",
      "tool.requested",
      "agent.started",
    ]);
  });

  it("replay with empty array is a no-op", async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("*", handler);

    await bus.replay([]);

    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── Unsubscribe during delivery ──────────────────────────────────────────────

describe("EventBus — unsubscribe during delivery", () => {
  it("a handler that unsubscribes itself does not affect other handlers", async () => {
    const bus = new EventBus();
    const afterHandler = vi.fn();
    let unsub: (() => void) | undefined;

    unsub = bus.on("tool.completed", async () => {
      unsub?.();
    });
    bus.on("tool.completed", afterHandler);

    await bus.emit(makeToolCompleted());

    expect(afterHandler).toHaveBeenCalledTimes(1);
    expect(bus.subscriptionCount).toBe(1);
  });
});
