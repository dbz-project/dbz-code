/**
 * Event System — EventBus
 *
 * The central nervous system of DBZ Code.
 *
 * Spec: docs/architecture/02-event-system.md
 *
 * Contract:
 * - Instantiable (not singleton)
 * - Async ordered delivery
 * - Wildcard subscriptions ("*", "domain.*")
 * - Handler failures are isolated — bus never crashes
 * - Replay preserves original order
 *
 * @packageDocumentation
 */

import { createBaseEventFields, matchesPattern } from "./utils.js";

import type {
  AnyDBZEvent,
  EventHandler,
  SubscriptionKey,
  UnsubscribeFn,
} from "./registry.js";

// ─── Internal Types ───────────────────────────────────────────────────────────

interface Subscription {
  readonly pattern: string;
  readonly handler: EventHandler;
}

// ─── EventBus ────────────────────────────────────────────────────────────────

/**
 * The DBZ Code EventBus.
 *
 * Every major subsystem communicates through an EventBus instance.
 * Each session, subagent, and test creates its own instance.
 *
 * @example
 * ```ts
 * const bus = new EventBus({ source: "my-subsystem" });
 *
 * const unsub = bus.on("tool.completed", async (event) => {
 *   console.log(event.toolName, event.durationMs);
 * });
 *
 * await bus.emit({ ...createBaseEventFields("tool.completed", "bash-tool"), toolName: "bash", durationMs: 10, success: true });
 *
 * unsub(); // remove subscription
 * ```
 */
export class EventBus {
  /**
   * Internal ordered list of subscriptions.
   * Iteration order is insertion order — matches subscription registration order.
   */
  private readonly subscriptions: Subscription[] = [];

  /**
   * Queue used to enforce ordered, sequential delivery.
   *
   * When `emit()` is called while another emit is in flight, the new event
   * is enqueued and processed after the current one completes. This guarantees
   * FIFO delivery regardless of how many concurrent callers invoke `emit()`.
   */
  private emitQueue: Promise<void> = Promise.resolve();

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Emit an event to all matching subscribers.
   *
   * Only events registered in `DBZEventMap` are accepted. Passing an
   * arbitrary object that does not satisfy a known event interface is a
   * compile-time error. This keeps the registry as the single source of
   * truth for all events that flow through the runtime.
   *
   * Delivery is:
   * - **Ordered** — events are delivered in the order `emit()` is called.
   * - **Sequential** — handlers for a single event are called one after another,
   *   not concurrently.
   * - **Isolated** — if a handler throws, an `event.handler_failed` event is
   *   emitted and processing continues with the next handler.
   *
   * ---
   * **Future: typed handler inference (v2)**
   *
   * Today `on()` accepts `EventHandler<BaseEvent>` for all patterns. A future
   * revision will infer the concrete event type from the subscription key so
   * that handlers receive a fully-narrowed payload without a manual cast:
   *
   * ```ts
   * // v2 target — not yet implemented
   * bus.on("tool.completed", async (event) => {
   *   //                                 ^? ToolCompletedEvent — inferred
   *   console.log(event.toolName);
   * });
   * ```
   *
   * Wildcard patterns will infer a union of all matching event types:
   *
   * ```ts
   * bus.on("tool.*", async (event) => {
   *   //                     ^? ToolRequestedEvent | ToolStartedEvent | ToolCompletedEvent | ToolFailedEvent
   * });
   * ```
   *
   * This requires a conditional/mapped type on `SubscriptionKey` that is
   * deferred to avoid complexity before the type system design is finalised.
   * ---
   *
   * @returns A promise that resolves when all handlers for this event have settled.
   */
  emit(event: AnyDBZEvent): Promise<void> {
    // Chain onto the queue so events are always delivered in emission order.
    this.emitQueue = this.emitQueue.then(() => this.deliver(event));
    return this.emitQueue;
  }

  /**
   * Subscribe to events matching `pattern`.
   *
   * Supported patterns:
   * - `"tool.completed"` — exact match
   * - `"tool.*"` — all events in the `tool` domain
   * - `"*"` — every event
   *
   * @returns An unsubscribe function. Call it to remove the subscription.
   */
  on(pattern: SubscriptionKey, handler: EventHandler): UnsubscribeFn {
    const subscription: Subscription = { pattern, handler };
    this.subscriptions.push(subscription);

    return () => {
      this.off(pattern, handler);
    };
  }

  /**
   * Remove a subscription.
   *
   * If the same handler was registered multiple times under the same pattern,
   * only the first occurrence is removed.
   */
  off(pattern: SubscriptionKey, handler: EventHandler): void {
    const index = this.subscriptions.findIndex(
      (s) => s.pattern === pattern && s.handler === handler,
    );

    if (index !== -1) {
      this.subscriptions.splice(index, 1);
    }
  }

  /**
   * Replay a sequence of events in order.
   *
   * Only events registered in `DBZEventMap` are accepted, consistent with
   * `emit()`. Events are delivered through the same ordered queue, so replay
   * and live events interleave correctly if called concurrently.
   *
   * Original event `id` and `timestamp` values are preserved.
   *
   * @example
   * ```ts
   * await bus.replay(sessionEvents);
   * ```
   */
  async replay(events: AnyDBZEvent[]): Promise<void> {
    for (const event of events) {
      await this.emit(event);
    }
  }

  /**
   * Returns the number of active subscriptions.
   * Useful for testing and diagnostics.
   */
  get subscriptionCount(): number {
    return this.subscriptions.length;
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  /**
   * Deliver a single event to all matching subscribers sequentially.
   * Handler errors are caught, isolated, and re-emitted as `event.handler_failed`.
   */
  private async deliver(event: AnyDBZEvent): Promise<void> {
    // Snapshot subscriptions at delivery time so that handlers adding/removing
    // subscriptions during delivery do not affect the current round.
    const snapshot = [...this.subscriptions];

    for (const { pattern, handler } of snapshot) {
      if (!matchesPattern(pattern, event.type)) {
        continue;
      }

      try {
        await handler(event);
      } catch (error) {
        await this.emitHandlerFailure(event.type, error);
      }
    }
  }

  /**
   * Emit an `event.handler_failed` event when a handler throws.
   *
   * This bypasses the queue to avoid deadlock (we are already inside `deliver`).
   * Handler failures on `event.handler_failed` itself are silently swallowed
   * to prevent infinite error loops.
   */
  private async emitHandlerFailure(
    failedEventType: string,
    error: unknown,
  ): Promise<void> {
    const failureEvent = {
      ...createBaseEventFields("event.handler_failed", "event-bus"),
      failedEventType,
      error: error instanceof Error ? error.message : String(error),
    };

    const snapshot = [...this.subscriptions];

    for (const { pattern, handler } of snapshot) {
      if (!matchesPattern(pattern, "event.handler_failed")) {
        continue;
      }

      try {
        await handler(failureEvent);
      } catch {
        // Silently swallow — must not recurse.
      }
    }
  }
}
