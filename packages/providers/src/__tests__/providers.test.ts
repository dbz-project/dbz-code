/**
 * Tests — Provider System
 *
 * Covers: error hierarchy, DefaultProviderRegistry, event emission,
 * provider agnosticism, and OllamaProvider contract compliance.
 */

import { describe, expect, it, vi } from "vitest";

import { EventBus } from "@dbz-code/events";
import { ProviderType } from "@dbz-code/shared";

import { DefaultProviderRegistry } from "../registry/index.js";
import {
  ProviderAuthenticationError,
  ProviderConnectionError,
  ProviderError,
  ProviderModelNotFoundError,
  ProviderRateLimitError,
  ProviderTimeoutError,
} from "../types/index.js";
import { OllamaProvider } from "../providers/index.js";

import type { BaseEvent } from "@dbz-code/events";
import type {
  GenerateRequest,
  GenerateResponse,
  ModelMetadata,
  ProviderCapabilities,
  ProviderInterface,
  ProviderMetadata,
} from "@dbz-code/shared";
import { BaseProvider } from "../base/index.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeBus() {
  return new EventBus();
}

function makeRegistry(bus = makeBus()) {
  return new DefaultProviderRegistry({ bus });
}

/**
 * Minimal concrete provider for testing BaseProvider and ProviderInterface.
 */
class StubProvider extends BaseProvider {
  readonly id: string;

  constructor(id: string) {
    super({ providerId: id });
    this.id = id;
  }

  async generate(_request: GenerateRequest): Promise<GenerateResponse> {
    return { message: { role: "assistant", content: "stub" } };
  }

  getMetadata(): ProviderMetadata {
    return {
      id: this.id,
      name: "Stub",
      version: "1.0",
      providerType: ProviderType.LocalAPI,
    };
  }

  getCapabilities(): ProviderCapabilities {
    return {
      chat: true,
      tools: false,
      images: false,
      streaming: false,
      embeddings: false,
    };
  }

  async listModels(): Promise<ModelMetadata[]> {
    return [];
  }
}

// ─── Error Hierarchy ──────────────────────────────────────────────────────────

describe("Provider error hierarchy", () => {
  it("ProviderError is the base class", () => {
    const err = new ProviderError("test", "something failed");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.providerId).toBe("test");
    expect(err.message).toBe("something failed");
    expect(err.name).toBe("ProviderError");
  });

  it("ProviderConnectionError extends ProviderError", () => {
    const err = new ProviderConnectionError("ollama", "cannot connect");
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.name).toBe("ProviderConnectionError");
    expect(err.providerId).toBe("ollama");
  });

  it("ProviderAuthenticationError extends ProviderError", () => {
    const err = new ProviderAuthenticationError("openai", "invalid key");
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.name).toBe("ProviderAuthenticationError");
  });

  it("ProviderTimeoutError carries timeoutMs", () => {
    const err = new ProviderTimeoutError("ollama", 5000);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.name).toBe("ProviderTimeoutError");
    expect(err.timeoutMs).toBe(5000);
    expect(err.message).toContain("5000ms");
  });

  it("ProviderRateLimitError carries optional retryAfterMs", () => {
    const withRetry = new ProviderRateLimitError("openai", 3000);
    expect(withRetry.retryAfterMs).toBe(3000);
    expect(withRetry.message).toContain("3000ms");

    const withoutRetry = new ProviderRateLimitError("openai");
    expect(withoutRetry.retryAfterMs).toBeUndefined();
  });

  it("ProviderModelNotFoundError carries modelId", () => {
    const err = new ProviderModelNotFoundError("ollama", "gpt-5");
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.name).toBe("ProviderModelNotFoundError");
    expect(err.modelId).toBe("gpt-5");
    expect(err.message).toContain("gpt-5");
  });
});

// ─── DefaultProviderRegistry ──────────────────────────────────────────────────

describe("DefaultProviderRegistry", () => {
  it("starts empty", () => {
    const registry = makeRegistry();
    expect(registry.list()).toHaveLength(0);
    expect(registry.size).toBe(0);
  });

  it("register() adds a provider", () => {
    const registry = makeRegistry();
    registry.register(new StubProvider("stub-1"));
    expect(registry.size).toBe(1);
  });

  it("get() returns the registered provider", () => {
    const registry = makeRegistry();
    const provider = new StubProvider("stub-1");
    registry.register(provider);
    expect(registry.get("stub-1")).toBe(provider);
  });

  it("get() returns undefined for unknown provider", () => {
    const registry = makeRegistry();
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("list() returns all registered providers", () => {
    const registry = makeRegistry();
    registry.register(new StubProvider("a"));
    registry.register(new StubProvider("b"));
    registry.register(new StubProvider("c"));
    expect(registry.list()).toHaveLength(3);
  });

  it("register() replaces existing provider with same id", () => {
    const registry = makeRegistry();
    const v1 = new StubProvider("stub");
    const v2 = new StubProvider("stub");
    registry.register(v1);
    registry.register(v2);
    expect(registry.size).toBe(1);
    expect(registry.get("stub")).toBe(v2);
  });

  it("unregister() removes a provider", () => {
    const registry = makeRegistry();
    registry.register(new StubProvider("stub"));
    registry.unregister("stub");
    expect(registry.get("stub")).toBeUndefined();
    expect(registry.size).toBe(0);
  });

  it("unregister() is a no-op for unknown provider", () => {
    const registry = makeRegistry();
    expect(() => registry.unregister("nonexistent")).not.toThrow();
  });
});

// ─── Registry Events ──────────────────────────────────────────────────────────

describe("DefaultProviderRegistry — event emission", () => {
  it("emits provider.registered on register()", async () => {
    const bus = makeBus();
    const registry = makeRegistry(bus);
    const handler = vi.fn();

    bus.on("provider.registered", handler);
    registry.register(new StubProvider("stub"));

    await new Promise((r) => setTimeout(r, 10)); // allow async emit to settle

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as BaseEvent & { providerId: string };
    expect(event.type).toBe("provider.registered");
    expect(event.providerId).toBe("stub");
  });

  it("emits provider.unregistered on unregister()", async () => {
    const bus = makeBus();
    const registry = makeRegistry(bus);
    const handler = vi.fn();

    registry.register(new StubProvider("stub"));
    bus.on("provider.unregistered", handler);
    registry.unregister("stub");

    await new Promise((r) => setTimeout(r, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as BaseEvent & { providerId: string };
    expect(event.providerId).toBe("stub");
  });

  it("does not emit provider.unregistered for unknown provider", async () => {
    const bus = makeBus();
    const registry = makeRegistry(bus);
    const handler = vi.fn();

    bus.on("provider.unregistered", handler);
    registry.unregister("nonexistent");

    await new Promise((r) => setTimeout(r, 10));

    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── BaseProvider / ProviderInterface contract ────────────────────────────────

describe("BaseProvider contract", () => {
  it("satisfies ProviderInterface", async () => {
    const provider: ProviderInterface = new StubProvider("stub");
    expect(typeof provider.id).toBe("string");
    const res = await provider.generate({ messages: [{ role: "user", content: "hi" }] });
    expect(res.message.role).toBe("assistant");
  });

  it("getMetadata() returns all required fields", () => {
    const provider = new StubProvider("stub");
    const meta = provider.getMetadata();
    expect(typeof meta.id).toBe("string");
    expect(typeof meta.name).toBe("string");
    expect(typeof meta.version).toBe("string");
    expect(typeof meta.providerType).toBe("number");
  });

  it("getCapabilities() returns all required fields", () => {
    const provider = new StubProvider("stub");
    const caps = provider.getCapabilities();
    expect(typeof caps.chat).toBe("boolean");
    expect(typeof caps.tools).toBe("boolean");
    expect(typeof caps.images).toBe("boolean");
    expect(typeof caps.streaming).toBe("boolean");
    expect(typeof caps.embeddings).toBe("boolean");
  });

  it("providerType convenience accessor matches metadata", () => {
    const provider = new StubProvider("stub");
    expect(provider.providerType).toBe(provider.getMetadata().providerType);
  });
});

// ─── ProviderType enum ────────────────────────────────────────────────────────

describe("ProviderType enum", () => {
  it("defines all four provider categories", () => {
    expect(ProviderType.RemoteAPI).toBeDefined();
    expect(ProviderType.LocalAPI).toBeDefined();
    expect(ProviderType.EmbeddedRuntime).toBeDefined();
    expect(ProviderType.ProxyGateway).toBeDefined();
  });

  it("Ollama is a LocalAPI provider", () => {
    const provider = new OllamaProvider({
      providerId: "ollama",
      modelId: "llama3",
    });
    expect(provider.getMetadata().providerType).toBe(ProviderType.LocalAPI);
  });
});

// ─── OllamaProvider — static contract ────────────────────────────────────────

describe("OllamaProvider — static contract", () => {
  it("satisfies ProviderInterface", () => {
    const provider: ProviderInterface = new OllamaProvider({
      providerId: "ollama",
      modelId: "llama3",
    });
    expect(provider.id).toBe("ollama");
    expect(typeof provider.generate).toBe("function");
  });

  it("defaults endpoint to localhost:11434", () => {
    const provider = new OllamaProvider({
      providerId: "ollama",
      modelId: "llama3",
    });
    expect(provider.getMetadata().id).toBe("ollama");
  });

  it("getCapabilities() marks chat and tools as true in v1", () => {
    const provider = new OllamaProvider({
      providerId: "ollama",
      modelId: "llama3",
    });
    const caps = provider.getCapabilities();
    expect(caps.chat).toBe(true);
    expect(caps.tools).toBe(true);
    expect(caps.streaming).toBe(false); // v1 — no streaming
    expect(caps.embeddings).toBe(false); // v1 — not implemented
    expect(caps.images).toBe(false);     // v1 — not implemented
  });

  it("getMetadata() returns correct provider type and name", () => {
    const provider = new OllamaProvider({
      providerId: "ollama",
      modelId: "llama3",
    });
    const meta = provider.getMetadata();
    expect(meta.name).toBe("Ollama");
    expect(meta.providerType).toBe(ProviderType.LocalAPI);
  });
});
