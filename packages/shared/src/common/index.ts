/**
 * Shared Contracts — Common Types
 *
 * Foundational types used across all DBZ Code packages.
 *
 * Spec: docs/architecture/03-shared-contracts.md § Common Types
 *
 * @packageDocumentation
 */

// ─── Identifiable ─────────────────────────────────────────────────────────────

/**
 * Any entity that carries a unique string identifier.
 */
export interface Identifiable {
  id: string;
}

// ─── Timestamped ──────────────────────────────────────────────────────────────

/**
 * Any entity that carries an ISO 8601 creation timestamp.
 */
export interface Timestamped {
  timestamp: string;
}

// ─── JSONValue ────────────────────────────────────────────────────────────────

/**
 * A value that is safely serialisable to and from JSON.
 *
 * Used as the canonical input/output type for tool execution so that
 * tool results can be stored, replayed, and transmitted without loss.
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };
