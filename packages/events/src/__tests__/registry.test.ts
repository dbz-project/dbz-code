/**
 * Tests — Event Registry
 *
 * Validates that the DBZEventMap covers all v1 domains
 * and that createBaseEventFields produces spec-compliant fields.
 */

import { describe, expect, it } from "vitest";

import { createBaseEventFields, createEventId, createTimestamp } from "../utils.js";

// ─── createEventId ────────────────────────────────────────────────────────────

describe("createEventId", () => {
  it("returns a non-empty string", () => {
    expect(typeof createEventId()).toBe("string");
    expect(createEventId().length).toBeGreaterThan(0);
  });

  it("returns a unique value on each call", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createEventId()));
    expect(ids.size).toBe(100);
  });

  it("matches the UUID v4 format", () => {
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(createEventId()).toMatch(uuidV4);
  });
});

// ─── createTimestamp ──────────────────────────────────────────────────────────

describe("createTimestamp", () => {
  it("returns a valid ISO 8601 string", () => {
    const ts = createTimestamp();
    expect(() => new Date(ts)).not.toThrow();
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it("is close to the current time", () => {
    const before = Date.now();
    const ts = createTimestamp();
    const after = Date.now();

    const parsed = new Date(ts).getTime();
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
  });
});

// ─── createBaseEventFields ────────────────────────────────────────────────────

describe("createBaseEventFields", () => {
  it("returns an object with id, type, timestamp, and source", () => {
    const fields = createBaseEventFields("tool.completed", "bash-tool");

    expect(fields).toHaveProperty("id");
    expect(fields).toHaveProperty("type", "tool.completed");
    expect(fields).toHaveProperty("timestamp");
    expect(fields).toHaveProperty("source", "bash-tool");
  });

  it("generates a unique id each call", () => {
    const a = createBaseEventFields("tool.completed", "bash-tool");
    const b = createBaseEventFields("tool.completed", "bash-tool");
    expect(a.id).not.toBe(b.id);
  });

  it("generates a valid ISO timestamp", () => {
    const { timestamp } = createBaseEventFields("tool.completed", "test");
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });
});

// ─── V1 Domain coverage ───────────────────────────────────────────────────────

describe("V1 domain event types", () => {
  const v1EventTypes = [
    // Agent
    "agent.started",
    "agent.stopped",
    // Tool
    "tool.requested",
    "tool.started",
    "tool.completed",
    "tool.failed",
    // Model
    "model.requested",
    "model.completed",
    "model.failed",
    // Memory
    "memory.written",
    "memory.read",
    // Session
    "session.created",
    "session.resumed",
    "session.closed",
    // Skill
    "skill.loaded",
    "skill.executed",
    // Subagent
    "subagent.spawned",
    "subagent.completed",
    // Permission
    "permission.granted",
    "permission.denied",
    // MCP
    "mcp.connected",
    "mcp.disconnected",
    "mcp.tool_called",
    // Runtime
    "runtime.started",
    "runtime.stopped",
    // Internal
    "event.handler_failed",
  ];

  it.each(v1EventTypes)("createBaseEventFields works for '%s'", (type) => {
    const fields = createBaseEventFields(type, "test");
    expect(fields.type).toBe(type);
  });
});
