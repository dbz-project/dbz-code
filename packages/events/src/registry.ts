/**
 * Event System — Typed Event Registry
 *
 * DBZEventMap is the single source of truth for all event types.
 * All subscriptions and emissions are resolved through this map.
 *
 * Spec: docs/architecture/02-event-system.md § Event Registry
 *
 * @packageDocumentation
 */

import type {
  AgentStartedEvent,
  AgentStoppedEvent,
  BaseEvent,
  EventHandlerFailedEvent,
  McpConnectedEvent,
  McpDisconnectedEvent,
  McpToolCalledEvent,
  MemoryReadEvent,
  MemoryWrittenEvent,
  ModelCompletedEvent,
  ModelFailedEvent,
  ModelRequestedEvent,
  PermissionDeniedEvent,
  PermissionGrantedEvent,
  RuntimeFailedEvent,
  RuntimeMessageReceivedEvent,
  RuntimeResponseGeneratedEvent,
  RuntimeStartedEvent,
  RuntimeStoppedEvent,
  SessionClosedEvent,
  SessionCreatedEvent,
  SessionResumedEvent,
  SkillExecutedEvent,
  SkillLoadedEvent,
  SubagentCompletedEvent,
  SubagentSpawnedEvent,
  ToolCompletedEvent,
  ToolFailedEvent,
  ToolRequestedEvent,
  ToolStartedEvent,
} from "./types.js";

// ─── Event Map ────────────────────────────────────────────────────────────────

/**
 * The complete typed registry of all DBZ Code events.
 *
 * Keys are dot-notation event types. Values are the corresponding event
 * interface types.
 *
 * Adding a new event requires:
 * 1. Define the interface in `types.ts`
 * 2. Add the entry here
 *
 * All EventBus operations are resolved through this map for type safety.
 */
export type DBZEventMap = {
  // Agent
  "agent.started": AgentStartedEvent;
  "agent.stopped": AgentStoppedEvent;

  // Tool
  "tool.requested": ToolRequestedEvent;
  "tool.started": ToolStartedEvent;
  "tool.completed": ToolCompletedEvent;
  "tool.failed": ToolFailedEvent;

  // Model
  "model.requested": ModelRequestedEvent;
  "model.completed": ModelCompletedEvent;
  "model.failed": ModelFailedEvent;

  // Memory
  "memory.written": MemoryWrittenEvent;
  "memory.read": MemoryReadEvent;

  // Session
  "session.created": SessionCreatedEvent;
  "session.resumed": SessionResumedEvent;
  "session.closed": SessionClosedEvent;

  // Skill
  "skill.loaded": SkillLoadedEvent;
  "skill.executed": SkillExecutedEvent;

  // Subagent
  "subagent.spawned": SubagentSpawnedEvent;
  "subagent.completed": SubagentCompletedEvent;

  // Permission
  "permission.granted": PermissionGrantedEvent;
  "permission.denied": PermissionDeniedEvent;

  // MCP
  "mcp.connected": McpConnectedEvent;
  "mcp.disconnected": McpDisconnectedEvent;
  "mcp.tool_called": McpToolCalledEvent;

  // Runtime
  "runtime.started": RuntimeStartedEvent;
  "runtime.stopped": RuntimeStoppedEvent;
  "runtime.failed": RuntimeFailedEvent;
  "runtime.message.received": RuntimeMessageReceivedEvent;
  "runtime.response.generated": RuntimeResponseGeneratedEvent;

  // Internal
  "event.handler_failed": EventHandlerFailedEvent;
};

// ─── Registry Utility Types ───────────────────────────────────────────────────

/** All known event type strings. */
export type DBZEventType = keyof DBZEventMap;

/** Resolve an event interface from its type string. */
export type DBZEvent<T extends DBZEventType> = DBZEventMap[T];

/** Union of all possible event payloads. */
export type AnyDBZEvent = DBZEventMap[DBZEventType];

// ─── Handler Types ────────────────────────────────────────────────────────────

/**
 * A typed event handler for a specific event type.
 */
export type EventHandler<T extends BaseEvent = BaseEvent> = (
  event: T,
) => Promise<void> | void;

/**
 * A function that removes a subscription when called.
 */
export type UnsubscribeFn = () => void;

// ─── Wildcard Pattern Types ───────────────────────────────────────────────────

/**
 * A wildcard subscription pattern.
 *
 * Supported patterns:
 * - `"*"` — matches all events
 * - `"domain.*"` — matches all events in a domain (e.g. `"tool.*"`)
 */
export type WildcardPattern = "*" | `${string}.*`;

/**
 * Any valid subscription key: a known event type or a wildcard pattern.
 */
export type SubscriptionKey = DBZEventType | WildcardPattern;
