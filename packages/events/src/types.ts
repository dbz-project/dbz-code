/**
 * Event System — Type Definitions
 *
 * All event types for DBZ Code v1.
 * Spec: docs/architecture/02-event-system.md
 *
 * @packageDocumentation
 */

// ─── Base Event ──────────────────────────────────────────────────────────────

/**
 * Every event in DBZ Code extends this interface.
 *
 * Fields are immutable after emission — do not mutate events in handlers.
 */
export interface BaseEvent {
  /** Unique identifier for this event instance. */
  readonly id: string;

  /** Dot-notation event type. Format: `domain.action` */
  readonly type: string;

  /** ISO 8601 timestamp of when the event was created. */
  readonly timestamp: string;

  /** Identifier of the subsystem that emitted the event. */
  readonly source: string;
}

// ─── Agent Domain ─────────────────────────────────────────────────────────────

export interface AgentStartedEvent extends BaseEvent {
  readonly type: "agent.started";
  readonly agentId: string;
  readonly sessionId: string;
}

export interface AgentStoppedEvent extends BaseEvent {
  readonly type: "agent.stopped";
  readonly agentId: string;
  readonly sessionId: string;
  readonly reason: string;
}

// ─── Tool Domain ──────────────────────────────────────────────────────────────

export interface ToolRequestedEvent extends BaseEvent {
  readonly type: "tool.requested";
  readonly toolName: string;
  readonly input: unknown;
}

export interface ToolStartedEvent extends BaseEvent {
  readonly type: "tool.started";
  readonly toolName: string;
}

export interface ToolCompletedEvent extends BaseEvent {
  readonly type: "tool.completed";
  readonly toolName: string;
  readonly durationMs: number;
  readonly success: boolean;
  readonly output?: unknown;
}

export interface ToolFailedEvent extends BaseEvent {
  readonly type: "tool.failed";
  readonly toolName: string;
  readonly durationMs: number;
  readonly error: string;
}

// ─── Model Domain ─────────────────────────────────────────────────────────────

export interface ModelRequestedEvent extends BaseEvent {
  readonly type: "model.requested";
  readonly provider: string;
  readonly model: string;
}

export interface ModelCompletedEvent extends BaseEvent {
  readonly type: "model.completed";
  readonly provider: string;
  readonly model: string;
  readonly durationMs: number;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}

export interface ModelFailedEvent extends BaseEvent {
  readonly type: "model.failed";
  readonly provider: string;
  readonly model: string;
  readonly error: string;
}

// ─── Memory Domain ────────────────────────────────────────────────────────────

export interface MemoryWrittenEvent extends BaseEvent {
  readonly type: "memory.written";
  readonly key: string;
  readonly sessionId: string;
}

export interface MemoryReadEvent extends BaseEvent {
  readonly type: "memory.read";
  readonly key: string;
  readonly sessionId: string;
  readonly found: boolean;
}

// ─── Session Domain ───────────────────────────────────────────────────────────

export interface SessionCreatedEvent extends BaseEvent {
  readonly type: "session.created";
  readonly sessionId: string;
}

export interface SessionResumedEvent extends BaseEvent {
  readonly type: "session.resumed";
  readonly sessionId: string;
}

export interface SessionClosedEvent extends BaseEvent {
  readonly type: "session.closed";
  readonly sessionId: string;
}

// ─── Skill Domain ─────────────────────────────────────────────────────────────

export interface SkillLoadedEvent extends BaseEvent {
  readonly type: "skill.loaded";
  readonly skillId: string;
  readonly skillName: string;
}

export interface SkillExecutedEvent extends BaseEvent {
  readonly type: "skill.executed";
  readonly skillId: string;
  readonly durationMs: number;
  readonly success: boolean;
}

// ─── Subagent Domain ──────────────────────────────────────────────────────────

export interface SubagentSpawnedEvent extends BaseEvent {
  readonly type: "subagent.spawned";
  readonly subagentId: string;
  readonly parentAgentId: string;
}

export interface SubagentCompletedEvent extends BaseEvent {
  readonly type: "subagent.completed";
  readonly subagentId: string;
  readonly parentAgentId: string;
  readonly success: boolean;
}

// ─── Permission Domain ────────────────────────────────────────────────────────

export interface PermissionGrantedEvent extends BaseEvent {
  readonly type: "permission.granted";
  readonly capability: string;
  readonly agentId: string;
}

export interface PermissionDeniedEvent extends BaseEvent {
  readonly type: "permission.denied";
  readonly capability: string;
  readonly agentId: string;
  readonly reason: string;
}

// ─── MCP Domain ───────────────────────────────────────────────────────────────

export interface McpConnectedEvent extends BaseEvent {
  readonly type: "mcp.connected";
  readonly serverId: string;
  readonly serverName: string;
}

export interface McpDisconnectedEvent extends BaseEvent {
  readonly type: "mcp.disconnected";
  readonly serverId: string;
  readonly reason?: string;
}

export interface McpToolCalledEvent extends BaseEvent {
  readonly type: "mcp.tool_called";
  readonly serverId: string;
  readonly toolName: string;
}

// ─── Runtime Domain ───────────────────────────────────────────────────────────

export interface RuntimeStartedEvent extends BaseEvent {
  readonly type: "runtime.started";
  readonly version: string;
}

export interface RuntimeStoppedEvent extends BaseEvent {
  readonly type: "runtime.stopped";
  readonly reason?: string;
}

// ─── Event Bus Internal ───────────────────────────────────────────────────────

/**
 * Emitted when an event handler throws an error.
 * The bus continues processing after emitting this event.
 */
export interface EventHandlerFailedEvent extends BaseEvent {
  readonly type: "event.handler_failed";
  readonly failedEventType: string;
  readonly error: string;
}
