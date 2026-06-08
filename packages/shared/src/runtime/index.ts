/**
 * Shared Contracts — Runtime Types
 *
 * Canonical runtime state, context, and response types.
 * Consumed by Core Runtime and observable by all subsystems via events.
 *
 * Spec: docs/architecture/03-shared-contracts.md § Runtime Contracts
 *
 * @packageDocumentation
 */

import type { AssistantMessage } from "../messages/index.js";
import type { ToolCall } from "../tools/index.js";

// ─── RuntimeStatus ────────────────────────────────────────────────────────────

/**
 * The lifecycle state of a Runtime instance.
 *
 * Transitions:
 *   Idle → Running → WaitingForTools → Running → Idle
 *   Running → Failed
 *   Running | Idle → Stopped
 */
export enum RuntimeStatus {
  Idle,
  Running,
  WaitingForTools,
  Stopped,
  Failed,
}

// ─── RuntimeContext ───────────────────────────────────────────────────────────

/**
 * Immutable identity context for a running Runtime instance.
 *
 * Carried on emitted events so that all subscribers can correlate
 * events back to the originating runtime and session.
 */
export interface RuntimeContext {
  /** Unique identifier for this Runtime instance. */
  runtimeId: string;

  /** The active session this Runtime is operating within. */
  sessionId: string;

  /** The identifier of the active provider. */
  providerId: string;

  /** The identifier of the active model. */
  modelId: string;
}

// ─── Usage ────────────────────────────────────────────────────────────────────

/**
 * Token usage reported by a model provider after generation.
 */
export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ─── RuntimeResponse ─────────────────────────────────────────────────────────

/**
 * The result returned by `Runtime.sendMessage()`.
 *
 * Contains the final assistant message, any tool calls that were made
 * during the turn, and optional token usage reported by the provider.
 */
export interface RuntimeResponse {
  /** The final assistant message after all tool calls are resolved. */
  message: AssistantMessage;

  /** All tool calls made during this turn, in order. */
  toolCalls: ToolCall[];

  /** Token usage for the turn, if reported by the provider. */
  usage?: Usage;
}
