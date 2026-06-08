/**
 * @dbz-code/shared
 *
 * Shared Contracts for DBZ Code.
 *
 * The single source of truth for all interfaces, types, and enums
 * shared across the DBZ Code runtime. No package may redefine
 * equivalent structures locally.
 *
 * Spec: docs/architecture/03-shared-contracts.md
 * Founder: Adam Belafia Es Safi
 *
 * @example
 * ```ts
 * import {
 *   UserMessage,
 *   RuntimeResponse,
 *   ProviderInterface,
 *   ToolInterface,
 * } from "@dbz-code/shared";
 * ```
 *
 * @packageDocumentation
 */

// ─── Common ───────────────────────────────────────────────────────────────────

export type { Identifiable, Timestamped, JSONValue } from "./common/index.js";

// ─── Messages ─────────────────────────────────────────────────────────────────

export type {
  MessageRole,
  BaseMessage,
  UserMessage,
  AssistantMessage,
  SystemMessage,
  ToolMessage,
  AnyMessage,
} from "./messages/index.js";

// ─── Runtime ──────────────────────────────────────────────────────────────────

export { RuntimeStatus } from "./runtime/index.js";

export type {
  RuntimeContext,
  RuntimeResponse,
  Usage,
} from "./runtime/index.js";

// ─── Providers ────────────────────────────────────────────────────────────────

export type {
  GenerateRequest,
  GenerateResponse,
  ProviderInterface,
} from "./providers/index.js";

// ─── Tools ────────────────────────────────────────────────────────────────────

export type {
  ToolDefinition,
  ToolCall,
  ToolResult,
  ToolInterface,
  ToolRegistry,
} from "./tools/index.js";
