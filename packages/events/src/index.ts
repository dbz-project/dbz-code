/**
 * @dbz-code/events
 *
 * The Event System for DBZ Code.
 *
 * The EventBus is the central nervous system of the runtime.
 * Every subsystem communicates through events.
 *
 * Spec: docs/architecture/02-event-system.md
 *
 * @example
 * ```ts
 * import { EventBus, createBaseEventFields } from "@dbz-code/events";
 *
 * const bus = new EventBus();
 *
 * bus.on("tool.*", async (event) => {
 *   console.log(event.type, event.source);
 * });
 *
 * await bus.emit({
 *   ...createBaseEventFields("tool.completed", "bash-tool"),
 *   toolName: "bash",
 *   durationMs: 42,
 *   success: true,
 * });
 * ```
 *
 * @packageDocumentation
 */

// Core class
export { EventBus } from "./bus.js";

// All event interfaces
export type {
  BaseEvent,
  AgentStartedEvent,
  AgentStoppedEvent,
  ToolRequestedEvent,
  ToolStartedEvent,
  ToolCompletedEvent,
  ToolFailedEvent,
  ModelRequestedEvent,
  ModelCompletedEvent,
  ModelFailedEvent,
  MemoryWrittenEvent,
  MemoryReadEvent,
  SessionCreatedEvent,
  SessionResumedEvent,
  SessionClosedEvent,
  SkillLoadedEvent,
  SkillExecutedEvent,
  SubagentSpawnedEvent,
  SubagentCompletedEvent,
  PermissionGrantedEvent,
  PermissionDeniedEvent,
  McpConnectedEvent,
  McpDisconnectedEvent,
  McpToolCalledEvent,
  ProviderRegisteredEvent,
  ProviderUnregisteredEvent,
  ProviderConnectedEvent,
  ProviderDisconnectedEvent,
  ProviderFailedEvent,
  RuntimeStartedEvent,
  RuntimeStoppedEvent,
  RuntimeFailedEvent,
  RuntimeMessageReceivedEvent,
  RuntimeResponseGeneratedEvent,
  EventHandlerFailedEvent,
} from "./types.js";

// Registry and handler types
export type {
  DBZEventMap,
  DBZEventType,
  DBZEvent,
  AnyDBZEvent,
  EventHandler,
  UnsubscribeFn,
  WildcardPattern,
  SubscriptionKey,
} from "./registry.js";

// Utilities
export {
  createEventId,
  createTimestamp,
  createBaseEventFields,
  matchesPattern,
} from "./utils.js";
