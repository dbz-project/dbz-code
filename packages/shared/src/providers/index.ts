/**
 * Shared Contracts — Provider Interfaces
 *
 * The canonical interface all model providers must implement.
 * Core Runtime depends only on this interface — never on concrete providers.
 *
 * Spec: docs/architecture/03-shared-contracts.md § Provider Contracts
 *
 * @packageDocumentation
 */

import type { AnyMessage, AssistantMessage } from "../messages/index.js";
import type { ToolCall } from "../tools/index.js";
import type { Usage } from "../runtime/index.js";

// ─── GenerateRequest ──────────────────────────────────────────────────────────

/**
 * The input to a provider's `generate()` call.
 *
 * Contains the full conversation history in order.
 * The provider must not assume anything about the message count or order
 * beyond what the Runtime explicitly passes.
 */
export interface GenerateRequest {
  messages: AnyMessage[];
}

// ─── GenerateResponse ─────────────────────────────────────────────────────────

/**
 * The output from a provider's `generate()` call.
 *
 * If the model requested tool calls, they are included in `toolCalls`.
 * The Runtime is responsible for executing them and calling `generate()`
 * again with the results appended to the message history.
 */
export interface GenerateResponse {
  /** The assistant message produced by the model. */
  message: AssistantMessage;

  /** Tool calls requested by the model, if any. */
  toolCalls?: ToolCall[];

  /** Token usage reported by the provider, if available. */
  usage?: Usage;
}

// ─── ProviderInterface ────────────────────────────────────────────────────────

/**
 * The contract every model provider must satisfy.
 *
 * Core Runtime depends exclusively on this interface.
 * Concrete implementations live in `@dbz-code/providers` and are
 * injected into the Runtime at construction time.
 *
 * @example
 * ```ts
 * class OllamaProvider implements ProviderInterface {
 *   readonly id = "ollama";
 *   async generate(request: GenerateRequest): Promise<GenerateResponse> { ... }
 * }
 * ```
 */
export interface ProviderInterface {
  /** Unique identifier for this provider instance (e.g. `"ollama"`, `"openai"`). */
  id: string;

  /**
   * Generate a response for the given conversation history.
   *
   * The provider must return at minimum an `AssistantMessage`.
   * If the model requests tool calls, they must be included in `toolCalls`.
   */
  generate(request: GenerateRequest): Promise<GenerateResponse>;
}
