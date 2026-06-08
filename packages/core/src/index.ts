/**
 * @dbz-code/core
 *
 * Core Runtime — the orchestration engine of DBZ Code.
 *
 * Coordinates providers, tools, sessions, and events.
 * Depends only on abstractions — never on concrete implementations.
 *
 * Spec: docs/architecture/04-core-runtime.md
 * Founder: Adam Belafia Es Safi
 *
 * @example
 * ```ts
 * import { DBZRuntime } from "@dbz-code/core";
 * import { EventBus } from "@dbz-code/events";
 *
 * const bus = new EventBus();
 * const runtime = new DBZRuntime({ bus, provider, toolRegistry });
 *
 * await runtime.start();
 * const response = await runtime.sendMessage({ role: "user", content: "Hello" });
 * await runtime.stop();
 * ```
 *
 * @packageDocumentation
 */

// Runtime
export { DBZRuntime } from "./runtime.js";
export type { DBZRuntimeOptions } from "./runtime.js";

// Errors
export {
  DBZRuntimeError,
  RuntimeStateError,
  ProviderError,
  ToolNotFoundError,
  ToolExecutionError,
} from "./errors.js";
