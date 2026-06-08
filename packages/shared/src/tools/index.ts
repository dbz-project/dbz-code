/**
 * Shared Contracts — Tool Interfaces
 *
 * The canonical interfaces all tools and the tool registry must implement.
 * Core Runtime depends only on these interfaces — never on concrete tools.
 *
 * Spec: docs/architecture/03-shared-contracts.md § Tool Contracts
 *
 * @packageDocumentation
 */

import type { JSONValue } from "../common/index.js";

// ─── ToolDefinition ───────────────────────────────────────────────────────────

/**
 * Describes a tool to a model provider so the model knows when and how
 * to request it.
 */
export interface ToolDefinition {
  /** The unique name the model uses to request this tool. */
  name: string;

  /** Human-readable description of what the tool does. */
  description: string;
}

// ─── ToolCall ─────────────────────────────────────────────────────────────────

/**
 * A tool invocation requested by the model during a generation turn.
 *
 * Produced inside `GenerateResponse.toolCalls` and consumed by the Runtime
 * to drive tool execution.
 */
export interface ToolCall {
  /** The name of the tool to execute. */
  toolName: string;

  /** The input arguments provided by the model. */
  input: JSONValue;
}

// ─── ToolResult ───────────────────────────────────────────────────────────────

/**
 * The result of executing a tool.
 *
 * Returned by `ToolInterface.execute()` and appended to the conversation
 * history as a `ToolMessage` before the follow-up generation call.
 */
export interface ToolResult {
  /** The name of the tool that produced this result. */
  toolName: string;

  /** The output value from the tool execution. */
  output: JSONValue;

  /** Whether the execution succeeded. */
  success: boolean;
}

// ─── ToolInterface ────────────────────────────────────────────────────────────

/**
 * The contract every tool must satisfy.
 *
 * Core Runtime depends exclusively on this interface.
 * Concrete implementations live in `@dbz-code/tools` and are registered
 * into a `ToolRegistry` that is injected into the Runtime at construction time.
 *
 * @example
 * ```ts
 * class BashTool implements ToolInterface {
 *   readonly definition = { name: "bash", description: "Run a bash command" };
 *   async execute(input: JSONValue): Promise<ToolResult> { ... }
 * }
 * ```
 */
export interface ToolInterface {
  /** Metadata describing this tool to the model. */
  definition: ToolDefinition;

  /**
   * Execute the tool with the given input.
   *
   * Must never throw — return `success: false` with an error description
   * in `output` instead. The Runtime will emit `tool.failed` based on
   * the `success` field.
   */
  execute(input: JSONValue): Promise<ToolResult>;
}

// ─── ToolRegistry ────────────────────────────────────────────────────────────

/**
 * The contract the tool registry must satisfy.
 *
 * Injected into Core Runtime at construction time.
 * The Runtime resolves all tools exclusively through this interface.
 *
 * @example
 * ```ts
 * const registry: ToolRegistry = new DefaultToolRegistry();
 * registry.register(new BashTool());
 * const tool = registry.get("bash");
 * ```
 */
export interface ToolRegistry {
  /**
   * Register a tool. If a tool with the same name is already registered,
   * the behaviour is implementation-defined (replace or throw).
   */
  register(tool: ToolInterface): void;

  /**
   * Retrieve a tool by name.
   * Returns `undefined` if no tool with that name is registered.
   */
  get(name: string): ToolInterface | undefined;

  /**
   * Return all registered tools.
   * Order is implementation-defined.
   */
  list(): ToolInterface[];
}
