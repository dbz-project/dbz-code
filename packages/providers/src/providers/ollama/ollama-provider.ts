/**
 * Provider System — OllamaProvider
 *
 * Local-first provider for Ollama inference server.
 * Connects to a locally running Ollama instance with zero cloud dependency.
 *
 * Spec: docs/architecture/05-provider-system.md § Ollama Provider
 * Founder: Adam Belafia Es Safi
 *
 * @packageDocumentation
 */

import { ProviderType } from "@dbz-code/shared";

import { BaseProvider } from "../../base/index.js";
import {
  ProviderConnectionError,
  ProviderModelNotFoundError,
  ProviderTimeoutError,
} from "../../types/index.js";

import type {
  GenerateRequest,
  GenerateResponse,
  ModelMetadata,
  ProviderCapabilities,
  ProviderConfig,
  ProviderMetadata,
} from "@dbz-code/shared";
import type {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaModelsResponse,
} from "./ollama-types.js";

// ─── OllamaProviderConfig ─────────────────────────────────────────────────────

export interface OllamaProviderConfig extends ProviderConfig {
  /**
   * The model to use for generation.
   * Must match an installed Ollama model name (e.g. "llama3", "mistral").
   */
  modelId: string;

  /**
   * Base URL of the Ollama server.
   * Defaults to "http://localhost:11434".
   */
  endpoint?: string;

  /**
   * Request timeout in milliseconds.
   * Defaults to 120_000 (2 minutes) — local models can be slow on first load.
   */
  timeoutMs?: number;
}

// ─── OllamaProvider ───────────────────────────────────────────────────────────

/**
 * Provider for locally running Ollama inference server.
 *
 * Ollama is a first-class citizen in DBZ Code — it enables fully local,
 * zero-cloud operation.
 *
 * @example
 * ```ts
 * const provider = new OllamaProvider({
 *   providerId: "ollama",
 *   modelId: "llama3",
 *   endpoint: "http://localhost:11434",
 * });
 *
 * const response = await provider.generate({
 *   messages: [{ role: "user", content: "Hello" }],
 * });
 * ```
 */
export class OllamaProvider extends BaseProvider {
  readonly id: string;

  private readonly _modelId: string;
  private readonly _endpoint: string;
  private readonly _timeoutMs: number;

  constructor(config: OllamaProviderConfig) {
    super(config);
    this.id = config.providerId;
    this._modelId = config.modelId;
    this._endpoint = config.endpoint ?? "http://localhost:11434";
    this._timeoutMs = config.timeoutMs ?? 120_000;
  }

  // ─── ProviderInterface ───────────────────────────────────────────────────────

  /**
   * Generate a response using the local Ollama model.
   *
   * Maps DBZ Code message format to Ollama API format and back.
   * Supports tool calling if the loaded model supports it.
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const body: OllamaChatRequest = {
      model: this._modelId,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
    };

    const raw = await this._post<OllamaChatResponse>("/api/chat", body);

    const toolCalls = raw.message.tool_calls?.map((tc) => ({
      toolName: tc.function.name,
      input: tc.function.arguments as Record<string, unknown>,
    }));

    return {
      message: {
        role: "assistant",
        content: raw.message.content,
      },
      toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      usage:
        raw.prompt_eval_count !== undefined && raw.eval_count !== undefined
          ? {
              promptTokens: raw.prompt_eval_count,
              completionTokens: raw.eval_count,
              totalTokens: raw.prompt_eval_count + raw.eval_count,
            }
          : undefined,
    };
  }

  // ─── BaseProvider ─────────────────────────────────────────────────────────────

  getMetadata(): ProviderMetadata {
    return {
      id: this.id,
      name: "Ollama",
      version: "1.0",
      providerType: ProviderType.LocalAPI,
    };
  }

  getCapabilities(): ProviderCapabilities {
    return {
      chat: true,
      tools: true,
      images: false,   // v1 — not implemented
      streaming: false, // v1 — not implemented
      embeddings: false, // v1 — not implemented
    };
  }

  /**
   * List all models currently installed in the local Ollama server.
   */
  async listModels(): Promise<ModelMetadata[]> {
    const raw = await this._get<OllamaModelsResponse>("/api/tags");

    return raw.models.map((m) => ({
      id: m.model,
      name: m.name,
      contextWindow: 4096,       // Ollama does not expose this via tags API — safe default
      maxOutputTokens: 4096,     // same
      supportsTools: true,       // assume true — model dependent, correctable at runtime
      supportsImages: false,
      supportsStreaming: false,   // v1
      supportsSystemMessages: true,
    }));
  }

  // ─── HTTP ────────────────────────────────────────────────────────────────────

  private async _post<T>(path: string, body: unknown): Promise<T> {
    return this._request<T>("POST", path, body);
  }

  private async _get<T>(path: string): Promise<T> {
    return this._request<T>("GET", path);
  }

  private async _request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this._endpoint}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeoutMs);

    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);

      if (error instanceof Error && error.name === "AbortError") {
        throw new ProviderTimeoutError(this.id, this._timeoutMs);
      }

      throw new ProviderConnectionError(
        this.id,
        `Cannot reach Ollama at ${this._endpoint}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    clearTimeout(timer);

    if (response.status === 404) {
      throw new ProviderModelNotFoundError(this.id, this._modelId);
    }

    if (!response.ok) {
      throw new ProviderConnectionError(
        this.id,
        `Ollama returned HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }
}
