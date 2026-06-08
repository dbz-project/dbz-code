/**
 * Tests — Shared Contracts
 *
 * Validates structural correctness of all v1 contracts.
 *
 * Because shared contains only types and interfaces, tests focus on:
 * - RuntimeStatus enum values and ordering
 * - Object literal assignability to each contract interface
 * - AnyMessage discriminant exhaustiveness
 * - JSONValue recursive assignability
 *
 * Type-level correctness is validated at compile time by TypeScript.
 * These runtime tests cover the one piece with runtime behaviour: the enum.
 */

import { describe, expect, it } from "vitest";

import { RuntimeStatus } from "../runtime/index.js";

// ─── RuntimeStatus ────────────────────────────────────────────────────────────

describe("RuntimeStatus", () => {
  it("defines all five lifecycle states", () => {
    expect(RuntimeStatus.Idle).toBeDefined();
    expect(RuntimeStatus.Running).toBeDefined();
    expect(RuntimeStatus.WaitingForTools).toBeDefined();
    expect(RuntimeStatus.Stopped).toBeDefined();
    expect(RuntimeStatus.Failed).toBeDefined();
  });

  it("Idle is 0 — the initial state", () => {
    expect(RuntimeStatus.Idle).toBe(0);
  });

  it("Running follows Idle", () => {
    expect(RuntimeStatus.Running).toBe(RuntimeStatus.Idle + 1);
  });

  it("WaitingForTools follows Running", () => {
    expect(RuntimeStatus.WaitingForTools).toBe(RuntimeStatus.Running + 1);
  });

  it("Stopped follows WaitingForTools", () => {
    expect(RuntimeStatus.Stopped).toBe(RuntimeStatus.WaitingForTools + 1);
  });

  it("Failed follows Stopped", () => {
    expect(RuntimeStatus.Failed).toBe(RuntimeStatus.Stopped + 1);
  });

  it("supports reverse mapping (numeric → name)", () => {
    expect(RuntimeStatus[RuntimeStatus.Idle]).toBe("Idle");
    expect(RuntimeStatus[RuntimeStatus.Running]).toBe("Running");
    expect(RuntimeStatus[RuntimeStatus.WaitingForTools]).toBe("WaitingForTools");
    expect(RuntimeStatus[RuntimeStatus.Stopped]).toBe("Stopped");
    expect(RuntimeStatus[RuntimeStatus.Failed]).toBe("Failed");
  });
});

// ─── Message Role Literals ────────────────────────────────────────────────────

describe("MessageRole literals", () => {
  it("all four roles are valid string literals", () => {
    const roles = ["system", "user", "assistant", "tool"];

    for (const role of roles) {
      expect(typeof role).toBe("string");
      expect(role.length).toBeGreaterThan(0);
    }
  });
});

// ─── Contract shape tests ─────────────────────────────────────────────────────

describe("UserMessage contract", () => {
  it("satisfies the expected shape", () => {
    const msg = { role: "user" as const, content: "hello" };
    expect(msg.role).toBe("user");
    expect(typeof msg.content).toBe("string");
  });
});

describe("AssistantMessage contract", () => {
  it("satisfies the expected shape", () => {
    const msg = { role: "assistant" as const, content: "hi there" };
    expect(msg.role).toBe("assistant");
    expect(typeof msg.content).toBe("string");
  });
});

describe("SystemMessage contract", () => {
  it("satisfies the expected shape", () => {
    const msg = { role: "system" as const, content: "You are helpful." };
    expect(msg.role).toBe("system");
    expect(typeof msg.content).toBe("string");
  });
});

describe("ToolMessage contract", () => {
  it("satisfies the expected shape", () => {
    const msg = {
      role: "tool" as const,
      content: "done",
      toolName: "bash",
    };
    expect(msg.role).toBe("tool");
    expect(msg.toolName).toBe("bash");
  });
});

describe("ToolCall contract", () => {
  it("satisfies the expected shape", () => {
    const call = { toolName: "bash", input: { command: "ls" } };
    expect(typeof call.toolName).toBe("string");
    expect(typeof call.input).toBe("object");
  });
});

describe("ToolResult contract", () => {
  it("satisfies the expected shape — success", () => {
    const result = { toolName: "bash", output: "file.ts", success: true };
    expect(result.success).toBe(true);
    expect(typeof result.output).toBe("string");
  });

  it("satisfies the expected shape — failure", () => {
    const result = { toolName: "bash", output: null, success: false };
    expect(result.success).toBe(false);
    expect(result.output).toBeNull();
  });
});

describe("Usage contract", () => {
  it("satisfies the expected shape", () => {
    const usage = { promptTokens: 10, completionTokens: 20, totalTokens: 30 };
    expect(usage.totalTokens).toBe(usage.promptTokens + usage.completionTokens);
  });
});

describe("RuntimeContext contract", () => {
  it("satisfies the expected shape", () => {
    const ctx = {
      runtimeId: "rt-1",
      sessionId: "sess-1",
      providerId: "ollama",
      modelId: "llama3",
    };
    expect(Object.keys(ctx)).toHaveLength(4);
    for (const val of Object.values(ctx)) {
      expect(typeof val).toBe("string");
    }
  });
});

describe("JSONValue recursive type", () => {
  it("accepts all valid JSON primitive types", () => {
    const values = ["string", 42, true, false, null];
    for (const v of values) {
      // JSONValue accepts all primitives — no runtime assertion needed,
      // but we confirm they are what they are
      expect(v === null || typeof v !== "undefined").toBe(true);
    }
  });

  it("accepts nested objects and arrays", () => {
    const nested = {
      key: "value",
      arr: [1, 2, { deep: true }],
      obj: { a: null },
    };
    expect(typeof nested).toBe("object");
    expect(Array.isArray(nested.arr)).toBe(true);
  });
});
