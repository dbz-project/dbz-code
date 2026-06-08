/**
 * Tests — DBZRuntime Provider Orchestration
 *
 * Covers: provider invocation, model event emission, provider errors,
 * and provider agnosticism.
 */

import { describe, expect, it, vi } from "vitest";

import { RuntimeStatus } from "@dbz-code/shared";

import { DBZRuntime } from "../runtime.js";
import { ProviderError } from "../errors.js";
import { makeMocks } from "./helpers.js";

import type { BaseEvent } from "@dbz-code/events";

// ─── Provider Invocation ──────────────────────────────────────────────────────

describe("DBZRuntime — provider invocation", () => {
  it("calls provider.generate() with the user message", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.respondsWith("hello back");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hello" });

    expect(provider.generate).toHaveBeenCalledTimes(1);
    const req = provider.generate.mock.calls[0]?.[0];
    expect(req?.messages[0]).toMatchObject({ role: "user", content: "hello" });
  });

  it("returns the provider's assistant message in RuntimeResponse", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.respondsWith("I am the response");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    const response = await runtime.sendMessage({
      role: "user",
      content: "hi",
    });

    expect(response.message.role).toBe("assistant");
    expect(response.message.content).toBe("I am the response");
  });

  it("returns empty toolCalls array when provider returns no tool calls", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.respondsWith("plain response");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    const response = await runtime.sendMessage({
      role: "user",
      content: "hi",
    });

    expect(response.toolCalls).toEqual([]);
  });

  it("forwards usage from provider to RuntimeResponse", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.generate.mockResolvedValue({
      message: { role: "assistant", content: "ok" },
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    const response = await runtime.sendMessage({
      role: "user",
      content: "hi",
    });

    expect(response.usage).toEqual({
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    });
  });
});

// ─── Model Events ─────────────────────────────────────────────────────────────

describe("DBZRuntime — model events", () => {
  it("emits runtime.message.received before provider call", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.respondsWith("ok");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    const order: string[] = [];
    bus.on("runtime.message.received", () => { order.push("received"); });
    bus.on("model.requested", () => { order.push("model.requested"); });

    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    expect(order[0]).toBe("received");
    expect(order[1]).toBe("model.requested");
  });

  it("emits model.requested before provider call", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.respondsWith("ok");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    const handler = vi.fn();

    bus.on("model.requested", handler);
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as BaseEvent & { provider: string; model: string };
    expect(event.type).toBe("model.requested");
    expect(event.provider).toBe("mock-provider");
  });

  it("emits model.completed after successful provider call", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.respondsWith("ok");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    const handler = vi.fn();

    bus.on("model.completed", handler);
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as BaseEvent & { durationMs: number };
    expect(event.type).toBe("model.completed");
    expect(typeof event.durationMs).toBe("number");
  });

  it("emits runtime.response.generated as final event", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.respondsWith("ok");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    const last = vi.fn();
    bus.on("runtime.response.generated", last);
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    expect(last).toHaveBeenCalledTimes(1);
  });
});

// ─── Provider Errors ─────────────────────────────────────────────────────────

describe("DBZRuntime — provider errors", () => {
  it("emits model.failed when provider throws", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.throws("network error");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    const handler = vi.fn();

    bus.on("model.failed", handler);
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" }).catch(() => {});

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as BaseEvent & { error: string };
    expect(event.type).toBe("model.failed");
    expect(event.error).toBe("network error");
  });

  it("emits runtime.failed when provider throws", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.throws("network error");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    const handler = vi.fn();

    bus.on("runtime.failed", handler);
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" }).catch(() => {});

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("throws ProviderError when provider fails", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.throws("boom");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    await expect(
      runtime.sendMessage({ role: "user", content: "hi" }),
    ).rejects.toThrow(ProviderError);
  });

  it("transitions to Failed state when provider throws", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.throws();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" }).catch(() => {});

    expect(runtime.getStatus()).toBe(RuntimeStatus.Failed);
  });
});
