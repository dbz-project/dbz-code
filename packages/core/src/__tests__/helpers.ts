/**
 * Core Runtime Tests — Helpers
 *
 * Mock implementations of ProviderInterface, ToolInterface, and ToolRegistry
 * for use in DBZRuntime tests.
 *
 * All mocks satisfy the contracts defined in @dbz-code/shared.
 * No real network calls, file access, or external dependencies.
 */

import { vi } from "vitest";

import { EventBus } from "@dbz-code/events";

import type {
  GenerateRequest,
  GenerateResponse,
  JSONValue,
  ProviderInterface,
  ToolCall,
  ToolDefinition,
  ToolInterface,
  ToolRegistry,
  ToolResult,
} from "@dbz-code/shared";

// ─── Mock Provider ────────────────────────────────────────────────────────────

/**
 * A mock provider that returns a configurable response.
 * Can be configured to return tool calls or throw errors.
 */
export class MockProvider implements ProviderInterface {
  readonly id: string;
  readonly generate = vi.fn<[GenerateRequest], Promise<GenerateResponse>>();

  constructor(id = "mock-provider") {
    this.id = id;
  }

  /**
   * Configure the provider to return a plain text response.
   */
  respondsWith(content: string): this {
    this.generate.mockResolvedValue({
      message: { role: "assistant", content },
    });
    return this;
  }

  /**
   * Configure the provider to return tool calls on first call,
   * then a plain text response on the second call.
   */
  respondsWithToolCalls(toolCalls: ToolCall[], finalContent = "done"): this {
    this.generate
      .mockResolvedValueOnce({
        message: { role: "assistant", content: "" },
        toolCalls,
      })
      .mockResolvedValueOnce({
        message: { role: "assistant", content: finalContent },
      });
    return this;
  }

  /**
   * Configure the provider to throw on the next call.
   */
  throws(message = "provider error"): this {
    this.generate.mockRejectedValueOnce(new Error(message));
    return this;
  }
}

// ─── Mock Tool ────────────────────────────────────────────────────────────────

/**
 * A mock tool that returns a configurable result.
 */
export class MockTool implements ToolInterface {
  readonly definition: ToolDefinition;
  readonly execute = vi.fn<[JSONValue], Promise<ToolResult>>();

  constructor(name: string, description = `Mock tool: ${name}`) {
    this.definition = { name, description };
  }

  /**
   * Configure the tool to return a successful result.
   */
  succeedsWith(output: JSONValue = "ok"): this {
    this.execute.mockResolvedValue({
      toolName: this.definition.name,
      output,
      success: true,
    });
    return this;
  }

  /**
   * Configure the tool to return a failure result (success: false).
   */
  failsWith(output: JSONValue = "tool error"): this {
    this.execute.mockResolvedValue({
      toolName: this.definition.name,
      output,
      success: false,
    });
    return this;
  }

  /**
   * Configure the tool to throw on the next call.
   */
  throws(message = "tool threw"): this {
    this.execute.mockRejectedValueOnce(new Error(message));
    return this;
  }
}

// ─── Mock Tool Registry ───────────────────────────────────────────────────────

/**
 * A minimal in-memory ToolRegistry for tests.
 */
export class MockToolRegistry implements ToolRegistry {
  private readonly _tools = new Map<string, ToolInterface>();

  register(tool: ToolInterface): void {
    this._tools.set(tool.definition.name, tool);
  }

  get(name: string): ToolInterface | undefined {
    return this._tools.get(name);
  }

  list(): ToolInterface[] {
    return [...this._tools.values()];
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Build a ready-to-use set of mocks for a single test.
 */
export function makeMocks(providerId = "mock-provider") {
  const bus = new EventBus();
  const provider = new MockProvider(providerId);
  const toolRegistry = new MockToolRegistry();

  return { bus, provider, toolRegistry };
}
