/**
 * Core Runtime — Errors
 *
 * Typed error classes for all failure modes in the Core Runtime.
 *
 * Spec: docs/architecture/04-core-runtime.md § Error Handling
 *
 * @packageDocumentation
 */

// ─── Base ─────────────────────────────────────────────────────────────────────

/**
 * Base class for all DBZRuntime errors.
 */
export class DBZRuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DBZRuntimeError";
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Thrown when an operation is attempted on a Runtime that is not in a
 * valid state for that operation.
 */
export class RuntimeStateError extends DBZRuntimeError {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeStateError";
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Thrown when the provider fails to generate a response.
 * Always preceded by a `model.failed` event.
 */
export class ProviderError extends DBZRuntimeError {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

// ─── Tool ─────────────────────────────────────────────────────────────────────

/**
 * Thrown when a requested tool is not found in the ToolRegistry.
 * Always preceded by a `tool.failed` event.
 */
export class ToolNotFoundError extends DBZRuntimeError {
  readonly toolName: string;

  constructor(toolName: string) {
    super(`Tool not found: "${toolName}"`);
    this.name = "ToolNotFoundError";
    this.toolName = toolName;
  }
}

/**
 * Thrown when a tool execution fails.
 * Always preceded by a `tool.failed` event.
 */
export class ToolExecutionError extends DBZRuntimeError {
  readonly toolName: string;

  constructor(toolName: string, message: string) {
    super(`Tool "${toolName}" failed: ${message}`);
    this.name = "ToolExecutionError";
    this.toolName = toolName;
  }
}
