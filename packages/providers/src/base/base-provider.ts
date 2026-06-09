/**
 * Provider System — BaseProvider
 *
 * Abstract base class that all concrete providers extend.
 * Provides metadata, capabilities, and enforces the ProviderInterface contract.
 *
 * Spec: docs/architecture/05-provider-system.md § Provider Interface
 * Founder: Adam Belafia Es Safi
 *
 * @packageDocumentation
 */

import type {
  GenerateRequest,
  GenerateResponse,
  ModelMetadata,
  ProviderCapabilities,
  ProviderConfig,
  ProviderInterface,
  ProviderMetadata,
  ProviderType,
} from "@dbz-code/shared";

// ─── BaseProvider ─────────────────────────────────────────────────────────────

/**
 * Abstract base all concrete providers must extend.
 *
 * Subclasses must implement:
 * - `generate()` — the core generation method
 * - `getMetadata()` — provider identity and type
 * - `getCapabilities()` — what this provider supports
 * - `listModels()` — models available via this provider
 *
 * The Runtime only calls `generate()` via `ProviderInterface`.
 * The additional methods are for the Provider Registry and
 * Observatory to use.
 */
export abstract class BaseProvider implements ProviderInterface {
  /**
   * Unique identifier for this provider instance.
   * Must match `getMetadata().id`.
   */
  abstract readonly id: string;

  protected readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Generate a response for the given conversation history.
   * Implemented by each concrete provider.
   */
  abstract generate(request: GenerateRequest): Promise<GenerateResponse>;

  /**
   * Return descriptive metadata about this provider.
   */
  abstract getMetadata(): ProviderMetadata;

  /**
   * Return the capability flags for this provider.
   */
  abstract getCapabilities(): ProviderCapabilities;

  /**
   * Return all models available via this provider.
   */
  abstract listModels(): Promise<ModelMetadata[]>;

  /**
   * The `ProviderType` for this provider.
   * Convenience accessor — same as `getMetadata().providerType`.
   */
  get providerType(): ProviderType {
    return this.getMetadata().providerType;
  }
}
