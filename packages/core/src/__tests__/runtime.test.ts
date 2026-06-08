/**
 * Tests — DBZRuntime Full Loop & Event Emission
 *
 * Covers: end-to-end turn without tools, end-to-end turn with tools,
 * full event sequence verification, sendMessage state guard.
 */

import { describe, expect, it, vi } from "vitest";

import { RuntimeStatus } from "@dbz-code/shared";

import { DBZRuntime } from "../runtime.js";
import { RuntimeStateError } from "../errors.js";
import { makeMocks, MockTool } from "./helpers.js";

import type { BaseEvent } from "@dbz-code/events";

// ─── Full Loop — No Tools ─────────────────────────────────────────────────────

describe("DBZRuntime — full loop (no tools)", () => {
  it("emits events in correct order for a plain turn", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.respondsWith("hello back");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    const emitted: string[] = [];
    bus.on("*", async (e) => { emitted.push(e.type); });

    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hello" });

    expect(emitted).toEqual([
      "runtime.started",
      "runtime.message.received",
      "model.requested",
      "model.completed",
      "runtime.response.generated",
    ]);
  });
});

// ─── Full Loop — With Tools ───────────────────────────────────────────────────

describe("DBZRuntime — full loop (with tools)", () => {
  it("emits events in correct order for a tool turn", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const tool = new MockTool("bash").succeedsWith("ok");
    toolRegistry.register(tool);

    provider.respondsWithToolCalls(
      [{ toolName: "bash", input: { command: "ls" } }],
      "files listed",
    );

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    const emitted: string[] = [];
    bus.on("*", async (e) => { emitted.push(e.type); });

    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "list files" });

    expect(emitted).toEqual([
      "runtime.started",
      "runtime.message.received",
      "model.requested",
      "model.completed",
      "tool.requested",
      "tool.started",
      "tool.completed",
      "model.requested",
      "model.completed",
      "runtime.response.generated",
    ]);
  });

  it("emits correct event sequence for multiple tools", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const toolA = new MockTool("tool_a").succeedsWith("a");
    const toolB = new MockTool("tool_b").succeedsWith("b");
    toolRegistry.register(toolA);
    toolRegistry.register(toolB);

    provider.respondsWithToolCalls([
      { toolName: "tool_a", input: {} },
      { toolName: "tool_b", input: {} },
    ]);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    const emitted: string[] = [];
    bus.on("*", async (e) => { emitted.push(e.type); });

    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "go" });

    expect(emitted).toEqual([
      "runtime.started",
      "runtime.message.received",
      "model.requested",
      "model.completed",
      "tool.requested",
      "tool.started",
      "tool.completed",
      "tool.requested",
      "tool.started",
      "tool.completed",
      "model.requested",
      "model.completed",
      "runtime.response.generated",
    ]);
  });
});

// ─── sendMessage state guard ──────────────────────────────────────────────────

describe("DBZRuntime — sendMessage state guard", () => {
  it("throws RuntimeStateError if called before start()", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await expect(
      runtime.sendMessage({ role: "user", content: "hi" }),
    ).rejects.toThrow(RuntimeStateError);
  });

  it("throws RuntimeStateError if called after stop()", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    await runtime.stop();

    await expect(
      runtime.sendMessage({ role: "user", content: "hi" }),
    ).rejects.toThrow(RuntimeStateError);
  });

  it("throws RuntimeStateError if called after failure", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.throws();
    const runtime = new DBZRuntime({ bus, provider, toolRegistry });

    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" }).catch(() => {});

    expect(runtime.getStatus()).toBe(RuntimeStatus.Failed);

    await expect(
      runtime.sendMessage({ role: "user", content: "hi again" }),
    ).rejects.toThrow(RuntimeStateError);
  });
});

// ─── Runtime isolation ────────────────────────────────────────────────────────

describe("DBZRuntime — instance isolation", () => {
  it("two runtimes do not share event subscriptions", async () => {
    const { bus: busA, provider: providerA, toolRegistry: regA } = makeMocks();
    const { bus: busB, provider: providerB, toolRegistry: regB } = makeMocks();

    providerA.respondsWith("from A");
    providerB.respondsWith("from B");

    const handlerA = vi.fn();
    const handlerB = vi.fn();
    busA.on("runtime.response.generated", handlerA);
    busB.on("runtime.response.generated", handlerB);

    const runtimeA = new DBZRuntime({ bus: busA, provider: providerA, toolRegistry: regA });
    const runtimeB = new DBZRuntime({ bus: busB, provider: providerB, toolRegistry: regB });

    await runtimeA.start();
    await runtimeB.start();

    await runtimeA.sendMessage({ role: "user", content: "hi" });

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenCalledTimes(0);
  });

  it("two runtimes have different runtimeIds", () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const a = new DBZRuntime({ bus, provider, toolRegistry });
    const b = new DBZRuntime({ bus, provider, toolRegistry });
    expect(a.getContext().runtimeId).not.toBe(b.getContext().runtimeId);
  });

  it("emitted events carry the correct runtimeId and sessionId", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.respondsWith("ok");
    const runtime = new DBZRuntime({ bus, provider, toolRegistry, sessionId: "sess-42" });

    const received: (BaseEvent & Record<string, unknown>)[] = [];
    bus.on("runtime.message.received", async (e) => { received.push(e as typeof received[0]); });

    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    expect(received[0]?.["sessionId"]).toBe("sess-42");
    expect(received[0]?.["runtimeId"]).toBe(runtime.getContext().runtimeId);
  });
});
