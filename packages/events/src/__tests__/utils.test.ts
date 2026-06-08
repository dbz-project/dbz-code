/**
 * Tests — matchesPattern utility
 */

import { describe, expect, it } from "vitest";

import { matchesPattern } from "../utils.js";

describe("matchesPattern", () => {
  describe("exact match", () => {
    it("matches identical event types", () => {
      expect(matchesPattern("tool.completed", "tool.completed")).toBe(true);
    });

    it("does not match different event types", () => {
      expect(matchesPattern("tool.completed", "tool.started")).toBe(false);
    });

    it("does not match a prefix without wildcard", () => {
      expect(matchesPattern("tool", "tool.completed")).toBe(false);
    });
  });

  describe("global wildcard *", () => {
    it("matches any event type", () => {
      expect(matchesPattern("*", "tool.completed")).toBe(true);
      expect(matchesPattern("*", "agent.started")).toBe(true);
      expect(matchesPattern("*", "runtime.stopped")).toBe(true);
      expect(matchesPattern("*", "event.handler_failed")).toBe(true);
    });
  });

  describe("namespace wildcard domain.*", () => {
    it("matches events in the same domain", () => {
      expect(matchesPattern("tool.*", "tool.requested")).toBe(true);
      expect(matchesPattern("tool.*", "tool.started")).toBe(true);
      expect(matchesPattern("tool.*", "tool.completed")).toBe(true);
      expect(matchesPattern("tool.*", "tool.failed")).toBe(true);
    });

    it("does not match events in a different domain", () => {
      expect(matchesPattern("tool.*", "agent.started")).toBe(false);
      expect(matchesPattern("tool.*", "model.completed")).toBe(false);
    });

    it("does not match a sibling domain that shares a prefix", () => {
      expect(matchesPattern("tool.*", "tooling.started")).toBe(false);
    });

    it("matches the bare domain name exactly", () => {
      expect(matchesPattern("tool.*", "tool")).toBe(false);
    });

    it("works for all v1 domains", () => {
      const domains = [
        "agent",
        "tool",
        "model",
        "memory",
        "session",
        "skill",
        "subagent",
        "permission",
        "mcp",
        "runtime",
      ];

      for (const domain of domains) {
        expect(matchesPattern(`${domain}.*`, `${domain}.started`)).toBe(true);
        expect(matchesPattern(`${domain}.*`, `other.event`)).toBe(false);
      }
    });
  });
});
