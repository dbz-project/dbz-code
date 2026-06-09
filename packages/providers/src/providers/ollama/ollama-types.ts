/**
 * Ollama Provider — Internal API Types
 *
 * Shapes for the Ollama REST API (v1 chat completions endpoint).
 * These are internal to the Ollama provider — never exported publicly.
 *
 * @packageDocumentation
 */

// ─── Ollama API Request ───────────────────────────────────────────────────────

export interface OllamaMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface OllamaTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
  };
}

export interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  tools?: OllamaTool[];
  stream: false; // v1 — no streaming
  options?: {
    temperature?: number;
    num_ctx?: number;
  };
}

// ─── Ollama API Response ──────────────────────────────────────────────────────

export interface OllamaChatResponse {
  model: string;
  message: {
    role: "assistant";
    content: string;
    tool_calls?: OllamaToolCall[];
  };
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

// ─── Ollama Models Response ───────────────────────────────────────────────────

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}
