/**
 * Shared Contracts — Message Types
 *
 * Canonical message format used across all DBZ Code packages.
 * All providers, the runtime, and the context system consume these types.
 *
 * Spec: docs/architecture/03-shared-contracts.md § Message Contracts
 *
 * @packageDocumentation
 */

// ─── MessageRole ──────────────────────────────────────────────────────────────

/**
 * All valid roles a message may carry in a conversation.
 */
export type MessageRole = "system" | "user" | "assistant" | "tool";

// ─── BaseMessage ──────────────────────────────────────────────────────────────

/**
 * The minimum shape shared by every message type.
 * Concrete message types narrow the `role` discriminant.
 */
export interface BaseMessage {
  role: MessageRole;
  content: string;
}

// ─── Concrete Message Types ───────────────────────────────────────────────────

/**
 * A message authored by the end user.
 */
export interface UserMessage extends BaseMessage {
  role: "user";
}

/**
 * A message authored by the assistant (model output).
 */
export interface AssistantMessage extends BaseMessage {
  role: "assistant";
}

/**
 * A system-level instruction prepended to the conversation.
 */
export interface SystemMessage extends BaseMessage {
  role: "system";
}

/**
 * The result of a tool execution, returned to the model.
 */
export interface ToolMessage extends BaseMessage {
  role: "tool";

  /** The name of the tool that produced this result. */
  toolName: string;
}

// ─── AnyMessage ───────────────────────────────────────────────────────────────

/**
 * Discriminated union of all message types.
 *
 * Use `switch (message.role)` to narrow to a concrete type.
 */
export type AnyMessage =
  | UserMessage
  | AssistantMessage
  | SystemMessage
  | ToolMessage;
