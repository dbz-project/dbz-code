/**
 * Tests — DBZRuntime Lifecycle
 *
 * Covers: start(), stop(), getStatus(), getContext(), state transitions,
 * lifecycle event emission, and invalid state errors.
 */

import { describe, expect, it, vi } from "vitest";

import { RuntimeStatus } from "@dbz-code/shared";

import { DBZRuntime } from "../runtime.js";
import { RuntimeStateError } from "../errors.js";
import { makeMocks } from "./helpers.js";

import type { BaseEvent } from "@dbz-code/events";

// ─── Construction ─────────────────────────────────────────────────────────────

describe("DBZRuntime — construction", () => {
  it("starts in Idle state", () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    expect(runtime.getStatus()).toBe(RuntimeStatus.Idle);
  });

  it("getContext() returns correct provider and model ids", () => {
    const { bus, provider, toolRegistry } = makeMocks("my-provider");
    const runtime = new DBZRuntime({
      bus,
      provider,
      toolRegistry,
      sessionId: "sess-1",
      modelId: "llama3",
    });

    const ctx = runtime.getContext();
    expect(ctx.providerId).toBe("my-provider");
    expect(ctx.modelId).toBe("llama3");
    expect(ctx.sessionId).toBe("sess-1");
    expect(typeof ctx.runtimeId).toBe("string");
  });

  it("generates a runtimeId if not provided", () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    expect(runtime.getContext().runtimeId.length).toBeGreaterThan(0);
  });

  it("generates a sessionId if not provided", () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    expect(runtime.getContext().sessionId.length).toBeGreaterThan(0);
  });

  it("each instance has an independent runtimeId", () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const a = new DBZRuntime({ bus, provider, toolRegistry });
    const b = new DBZRuntime({ bus, provider, toolRegistry });
    expect(a.getContext().runtimeId).not.toBe(b.getContext().runtimeId);
  });
});

// ─── start() ─────────────────────────────────────────────────────────────────

describe("DBZRuntime — start()", () => {
  it("transitions from Idle to Running", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    expect(runtime.getStatus()).toBe(RuntimeStatus.Running);
  });

  it("emits runtime.started", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    const handler = vi.fn();

    bus.on("runtime.started", handler);
    await runtime.start();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as BaseEvent;
    expect(event.type).toBe("runtime.started");
    expect(event.source).toBe("core-runtime");
  });

  it("throws RuntimeStateError if called when already Running", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    await expect(runtime.start()).rejects.toThrow(RuntimeStateError);
  });

  it("throws RuntimeStateError if called when Stopped", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    await runtime.stop();
    await expect(runtime.start()).rejects.toThrow(RuntimeStateError);
  });
});

// ─── stop() ──────────────────────────────────────────────────────────────────

describe("DBZRuntime — stop()", () => {
  it("transitions from Running to Stopped", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    await runtime.stop();
    expect(runtime.getStatus()).toBe(RuntimeStatus.Stopped);
  });

  it("emits runtime.stopped", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    const handler = vi.fn();

    bus.on("runtime.stopped", handler);
    await runtime.start();
    await runtime.stop();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as BaseEvent;
    expect(event.type).toBe("runtime.stopped");
  });

  it("throws RuntimeStateError if called when already Stopped", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    await runtime.stop();
    await expect(runtime.stop()).rejects.toThrow(RuntimeStateError);
  });

  it("throws RuntimeStateError if called when Failed", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    provider.throws();
    await runtime.start();

    await runtime
      .sendMessage({ role: "user", content: "hi" })
      .catch(() => {});

    await expect(runtime.stop()).rejects.toThrow(RuntimeStateError);
  });
});
