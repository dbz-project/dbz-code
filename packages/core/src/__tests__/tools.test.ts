/**
 * Tests — DBZRuntime Tool Orchestration
 *
 * Covers: single tool call, multiple tool calls, ordered execution,
 * tool event emission, tool not found, tool failure, tool throws.
 */

import { describe, expect, it, vi } from "vitest";

import { DBZRuntime } from "../runtime.js";
import { ToolNotFoundError, ToolExecutionError } from "../errors.js";
import { makeMocks, MockTool } from "./helpers.js";

import type { BaseEvent } from "@dbz-code/events";

// ─── Single Tool Call ─────────────────────────────────────────────────────────

describe("DBZRuntime — single tool call", () => {
  it("resolves and executes a tool returned by the provider", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const tool = new MockTool("bash").succeedsWith("output");
    toolRegistry.register(tool);

    provider.respondsWithToolCalls(
      [{ toolName: "bash", input: { command: "ls" } }],
      "done",
    );

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    const response = await runtime.sendMessage({
      role: "user",
      content: "run ls",
    });

    expect(tool.execute).toHaveBeenCalledTimes(1);
    expect(tool.execute).toHaveBeenCalledWith({ command: "ls" });
    expect(response.message.content).toBe("done");
  });

  it("includes the tool call in RuntimeResponse.toolCalls", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const tool = new MockTool("bash").succeedsWith("ok");
    toolRegistry.register(tool);

    provider.respondsWithToolCalls([{ toolName: "bash", input: {} }]);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    const response = await runtime.sendMessage({
      role: "user",
      content: "hi",
    });

    expect(response.toolCalls).toHaveLength(1);
    expect(response.toolCalls[0]?.toolName).toBe("bash");
  });

  it("calls provider a second time with tool result in messages", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const tool = new MockTool("bash").succeedsWith("file.ts");
    toolRegistry.register(tool);

    provider.respondsWithToolCalls([{ toolName: "bash", input: {} }], "final");

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    // Second call includes tool result
    expect(provider.generate).toHaveBeenCalledTimes(2);
    const secondCall = provider.generate.mock.calls[1]?.[0];
    const toolMsg = secondCall?.messages.find((m) => m.role === "tool");
    expect(toolMsg).toBeDefined();
    expect(toolMsg?.role).toBe("tool");
  });
});

// ─── Multiple Tool Calls ──────────────────────────────────────────────────────

describe("DBZRuntime — multiple tool calls", () => {
  it("executes all tool calls in a single turn", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const readFile = new MockTool("read_file").succeedsWith("content");
    const searchFiles = new MockTool("search_files").succeedsWith(["a.ts"]);
    toolRegistry.register(readFile);
    toolRegistry.register(searchFiles);

    provider.respondsWithToolCalls([
      { toolName: "read_file", input: { path: "a.ts" } },
      { toolName: "search_files", input: { query: "*.ts" } },
      { toolName: "read_file", input: { path: "b.ts" } },
    ]);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    const response = await runtime.sendMessage({
      role: "user",
      content: "analyse files",
    });

    expect(readFile.execute).toHaveBeenCalledTimes(2);
    expect(searchFiles.execute).toHaveBeenCalledTimes(1);
    expect(response.toolCalls).toHaveLength(3);
  });

  it("executes multiple tool calls in order", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const order: string[] = [];

    const toolA = new MockTool("tool_a");
    toolA.execute.mockImplementation(async () => {
      order.push("tool_a");
      return { toolName: "tool_a", output: "a", success: true };
    });

    const toolB = new MockTool("tool_b");
    toolB.execute.mockImplementation(async () => {
      order.push("tool_b");
      return { toolName: "tool_b", output: "b", success: true };
    });

    const toolC = new MockTool("tool_c");
    toolC.execute.mockImplementation(async () => {
      order.push("tool_c");
      return { toolName: "tool_c", output: "c", success: true };
    });

    toolRegistry.register(toolA);
    toolRegistry.register(toolB);
    toolRegistry.register(toolC);

    provider.respondsWithToolCalls([
      { toolName: "tool_a", input: {} },
      { toolName: "tool_b", input: {} },
      { toolName: "tool_c", input: {} },
    ]);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "go" });

    expect(order).toEqual(["tool_a", "tool_b", "tool_c"]);
  });
});

// ─── Tool Events ──────────────────────────────────────────────────────────────

describe("DBZRuntime — tool events", () => {
  it("emits tool.requested before resolving the tool", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const tool = new MockTool("bash").succeedsWith("ok");
    toolRegistry.register(tool);
    provider.respondsWithToolCalls([{ toolName: "bash", input: {} }]);

    const handler = vi.fn();
    bus.on("tool.requested", handler);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as BaseEvent & { toolName: string };
    expect(event.type).toBe("tool.requested");
    expect(event.toolName).toBe("bash");
  });

  it("emits tool.started after resolving the tool", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const tool = new MockTool("bash").succeedsWith("ok");
    toolRegistry.register(tool);
    provider.respondsWithToolCalls([{ toolName: "bash", input: {} }]);

    const handler = vi.fn();
    bus.on("tool.started", handler);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("emits tool.completed after successful execution", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const tool = new MockTool("bash").succeedsWith("result");
    toolRegistry.register(tool);
    provider.respondsWithToolCalls([{ toolName: "bash", input: {} }]);

    const handler = vi.fn();
    bus.on("tool.completed", handler);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as BaseEvent & {
      toolName: string;
      success: boolean;
      durationMs: number;
    };
    expect(event.type).toBe("tool.completed");
    expect(event.toolName).toBe("bash");
    expect(event.success).toBe(true);
    expect(typeof event.durationMs).toBe("number");
  });

  it("emits tool events in correct order per tool", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const tool = new MockTool("bash").succeedsWith("ok");
    toolRegistry.register(tool);
    provider.respondsWithToolCalls([{ toolName: "bash", input: {} }]);

    const order: string[] = [];
    bus.on("tool.requested", () => order.push("tool.requested"));
    bus.on("tool.started", () => order.push("tool.started"));
    bus.on("tool.completed", () => order.push("tool.completed"));

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    expect(order).toEqual(["tool.requested", "tool.started", "tool.completed"]);
  });

  it("emits tool events for each tool in multi-tool turns", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const toolA = new MockTool("tool_a").succeedsWith("a");
    const toolB = new MockTool("tool_b").succeedsWith("b");
    toolRegistry.register(toolA);
    toolRegistry.register(toolB);

    provider.respondsWithToolCalls([
      { toolName: "tool_a", input: {} },
      { toolName: "tool_b", input: {} },
    ]);

    const completed = vi.fn();
    bus.on("tool.completed", completed);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" });

    expect(completed).toHaveBeenCalledTimes(2);
  });
});

// ─── Tool Errors ──────────────────────────────────────────────────────────────

describe("DBZRuntime — tool errors", () => {
  it("emits tool.failed and throws ToolNotFoundError for unknown tool", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    // No tool registered
    provider.respondsWithToolCalls([{ toolName: "unknown_tool", input: {} }]);

    const failedHandler = vi.fn();
    bus.on("tool.failed", failedHandler);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();

    await expect(
      runtime.sendMessage({ role: "user", content: "hi" }),
    ).rejects.toThrow(ToolNotFoundError);

    expect(failedHandler).toHaveBeenCalledTimes(1);
  });

  it("emits tool.failed and throws ToolExecutionError when tool returns success:false", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const tool = new MockTool("bash").failsWith("permission denied");
    toolRegistry.register(tool);
    provider.respondsWithToolCalls([{ toolName: "bash", input: {} }]);

    const failedHandler = vi.fn();
    bus.on("tool.failed", failedHandler);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();

    await expect(
      runtime.sendMessage({ role: "user", content: "hi" }),
    ).rejects.toThrow(ToolExecutionError);

    expect(failedHandler).toHaveBeenCalledTimes(1);
  });

  it("emits tool.failed and throws ToolExecutionError when tool throws", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const tool = new MockTool("bash").throws("unexpected crash");
    toolRegistry.register(tool);
    provider.respondsWithToolCalls([{ toolName: "bash", input: {} }]);

    const failedHandler = vi.fn();
    bus.on("tool.failed", failedHandler);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();

    await expect(
      runtime.sendMessage({ role: "user", content: "hi" }),
    ).rejects.toThrow(ToolExecutionError);

    expect(failedHandler).toHaveBeenCalledTimes(1);
  });

  it("emits runtime.failed when a tool error propagates", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    provider.respondsWithToolCalls([{ toolName: "missing", input: {} }]);

    const runtimeFailed = vi.fn();
    bus.on("runtime.failed", runtimeFailed);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" }).catch(() => {});

    expect(runtimeFailed).toHaveBeenCalledTimes(1);
  });

  it("stops executing subsequent tools after first failure", async () => {
    const { bus, provider, toolRegistry } = makeMocks();
    const toolA = new MockTool("tool_a").failsWith("error");
    const toolB = new MockTool("tool_b").succeedsWith("ok");
    toolRegistry.register(toolA);
    toolRegistry.register(toolB);

    provider.respondsWithToolCalls([
      { toolName: "tool_a", input: {} },
      { toolName: "tool_b", input: {} },
    ]);

    const runtime = new DBZRuntime({ bus, provider, toolRegistry });
    await runtime.start();
    await runtime.sendMessage({ role: "user", content: "hi" }).catch(() => {});

    expect(toolB.execute).not.toHaveBeenCalled();
  });
});
