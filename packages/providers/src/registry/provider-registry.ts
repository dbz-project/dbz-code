/**
 * Provider System — DefaultProviderRegistry
 *
 * Central provider discovery and management.
 *
 * Spec: docs/architecture/05-provider-system.md § Provider Registry
 * Founder: Adam Belafia Es Safi
 *
 * @packageDocumentation
 */

import { createBaseEventFields } from "@dbz-code/events";

import type { EventBus } from "@dbz-code/events";
import type { ProviderInterface, ProviderRegistry } from "@dbz-code/shared";

// ─── DefaultProviderRegistry ──────────────────────────────────────────────────

/**
 * The default implementation of `ProviderRegistry`.
 *
 * Manages provider registration and discovery.
 * Emits `provider.registered` and `provider.unregistered` events
 * via the injected EventBus.
 *
 * @example
 * ```ts
 * const registry = new DefaultProviderRegistry({ bus });
 * registry.register(new OllamaProvider(config));
 * const provider = registry.get("ollama");
 * ```
 */
export class DefaultProviderRegistry implements ProviderRegistry {
  private readonly _providers = new Map<string, ProviderInterface>();
  private readonly _bus: EventBus;

  constructor(options: { bus: EventBus }) {
    this._bus = options.bus;
  }

  /**
   * Register a provider.
   *
   * If a provider with the same id is already registered it is replaced.
   * Emits `provider.registered`.
   */
  register(provider: ProviderInterface): void {
    this._providers.set(provider.id, provider);

    void this._bus.emit({
      ...createBaseEventFields("provider.registered", "provider-registry"),
      providerId: provider.id,
    });
  }

  /**
   * Unregister a provider by id.
   *
   * No-op if the provider is not registered.
   * Emits `provider.unregistered` if the provider existed.
   */
  unregister(providerId: string): void {
    if (!this._providers.has(providerId)) return;

    this._providers.delete(providerId);

    void this._bus.emit({
      ...createBaseEventFields("provider.unregistered", "provider-registry"),
      providerId,
    });
  }

  /**
   * Retrieve a provider by id.
   * Returns `undefined` if not registered.
   */
  get(providerId: string): ProviderInterface | undefined {
    return this._providers.get(providerId);
  }

  /**
   * Return all registered providers.
   */
  list(): ProviderInterface[] {
    return [...this._providers.values()];
  }

  /**
   * Number of registered providers.
   */
  get size(): number {
    return this._providers.size;
  }
}
