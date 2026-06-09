/**
 * @dbz-code/providers
 *
 * Provider System for DBZ Code.
 *
 * Connects DBZ Code to language models — remote APIs, local APIs,
 * and embedded runtimes. All providers implement ProviderInterface
 * from @dbz-code/shared so the Runtime never knows how a provider works.
 *
 * Spec: docs/architecture/05-provider-system.md
 * Founder: Adam Belafia Es Safi
 *
 * @example
 * ```ts
 * import { OllamaProvider, DefaultProviderRegistry } from "@dbz-code/providers";
 * import { EventBus } from "@dbz-code/events";
 *
 * const bus = new EventBus();
 * const registry = new DefaultProviderRegistry({ bus });
 *
 * const provider = new OllamaProvider({
 *   providerId: "ollama",
 *   modelId: "llama3",
 * });
 *
 * registry.register(provider);
 * ```
 *
 * @packageDocumentation
 */

// Base
export { BaseProvider } from "./base/index.js";

// Registry
export { DefaultProviderRegistry } from "./registry/index.js";

// Providers
export { OllamaProvider } from "./providers/index.js";
export type { OllamaProviderConfig } from "./providers/index.js";

// Errors
export {
  ProviderError,
  ProviderConnectionError,
  ProviderAuthenticationError,
  ProviderTimeoutError,
  ProviderRateLimitError,
  ProviderModelNotFoundError,
} from "./types/index.js";
