/**
 * Event System — Utilities
 *
 * Helpers for creating spec-compliant BaseEvent fields.
 *
 * @packageDocumentation
 */

import { randomUUID } from "node:crypto";

/**
 * Generate a unique event ID.
 * Uses the Node.js built-in `crypto.randomUUID()` — no external dependency.
 */
export function createEventId(): string {
  return randomUUID();
}

/**
 * Generate an ISO 8601 timestamp for the current moment.
 */
export function createTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Build the base fields for a new event.
 * Consumers should spread this into their event objects.
 *
 * @example
 * ```ts
 * const event: ToolCompletedEvent = {
 *   ...createBaseEventFields("tool.completed", "bash-tool"),
 *   toolName: "bash",
 *   durationMs: 42,
 *   success: true,
 * };
 * ```
 */
export function createBaseEventFields(
  type: string,
  source: string,
): { id: string; type: string; timestamp: string; source: string } {
  return {
    id: createEventId(),
    type,
    timestamp: createTimestamp(),
    source,
  };
}

/**
 * Returns true if the subscription pattern matches the given event type.
 *
 * Supported patterns:
 * - `"*"` — matches everything
 * - `"domain.*"` — matches all events whose type starts with `"domain."`
 * - `"tool.completed"` — exact match only
 */
export function matchesPattern(pattern: string, eventType: string): boolean {
  if (pattern === "*") {
    return true;
  }

  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -2); // strip trailing ".*"
    return eventType === prefix || eventType.startsWith(`${prefix}.`);
  }

  return pattern === eventType;
}
