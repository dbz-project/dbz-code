/**
 * Provider System — Error Hierarchy
 *
 * All typed errors for provider failures.
 *
 * Spec: docs/architecture/05-provider-system.md § Error Types
 * Founder: Adam Belafia Es Safi
 *
 * @packageDocumentation
 */

// ─── Base ─────────────────────────────────────────────────────────────────────

/**
 * Base class for all provider errors.
 */
export class ProviderError extends Error {
  readonly providerId: string;

  constructor(providerId: string, message: string) {
    super(message);
    this.name = "ProviderError";
    this.providerId = providerId;
  }
}

// ─── Specific Error Types ─────────────────────────────────────────────────────

/**
 * Thrown when the provider cannot be reached (network failure, server down).
 */
export class ProviderConnectionError extends ProviderError {
  constructor(providerId: string, message: string) {
    super(providerId, message);
    this.name = "ProviderConnectionError";
  }
}

/**
 * Thrown when the provider rejects the request due to invalid credentials.
 */
export class ProviderAuthenticationError extends ProviderError {
  constructor(providerId: string, message: string) {
    super(providerId, message);
    this.name = "ProviderAuthenticationError";
  }
}

/**
 * Thrown when the provider does not respond within the configured timeout.
 */
export class ProviderTimeoutError extends ProviderError {
  readonly timeoutMs: number;

  constructor(providerId: string, timeoutMs: number) {
    super(providerId, `Provider "${providerId}" timed out after ${timeoutMs}ms`);
    this.name = "ProviderTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Thrown when the provider returns a rate limit response.
 */
export class ProviderRateLimitError extends ProviderError {
  readonly retryAfterMs?: number;

  constructor(providerId: string, retryAfterMs?: number) {
    super(
      providerId,
      retryAfterMs
        ? `Provider "${providerId}" rate limited — retry after ${retryAfterMs}ms`
        : `Provider "${providerId}" rate limited`,
    );
    this.name = "ProviderRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Thrown when the requested model does not exist or is unavailable.
 */
export class ProviderModelNotFoundError extends ProviderError {
  readonly modelId: string;

  constructor(providerId: string, modelId: string) {
    super(providerId, `Model "${modelId}" not found on provider "${providerId}"`);
    this.name = "ProviderModelNotFoundError";
    this.modelId = modelId;
  }
}
