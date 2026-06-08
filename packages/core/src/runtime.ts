/**
 * Core Runtime — DBZRuntime
 *
 * The orchestration engine of DBZ Code.
 *
 * Coordinates providers, tools, sessions, and events.
 * Does not implement any of these systems — only orchestrates them.
 *
 * Spec: docs/architecture/04-core-runtime.md
 * Founder: Adam Belafia Es Safi
 *
 * @packageDocumentation
 */

import { randomUUID } from "node:crypto";

import { createBaseEventFields } from "@dbz-code/events";
import {
  RuntimeStatus,
} from "@dbz-code/shared";

import {
  ProviderError,
  RuntimeStateError,
  ToolExecutionError,
  ToolNotFoundError,
} from "./errors.js";

import type { EventBus } from "@dbz-code/events";
import type {
  ProviderInterface,
  RuntimeContext,
  RuntimeResponse,
  ToolCall,
  ToolRegistry,
  ToolResult,
  UserMessage,
} from "@dbz-code/shared";

// ─── Construction ─────────────────────────────────────────────────────────────

/**
 * Dependencies injected into DBZRuntime at construction time.
 *
 * The Runtime never instantiates its own dependencies.
 */
export interface DBZRuntimeOptions {
  /** The EventBus instance for this runtime. Must be externally created. */
  bus: EventBus;

  /** The model provider to use for generation. */
  provider: ProviderInterface;

  /**
   * The tool registry. May be empty if no tools are available.
   */
  toolRegistry: ToolRegistry;

  /**
   * The session ID this Runtime instance is bound to.
   * If not provided, a new UUID is generated.
   */
  sessionId?: string;

  /**
   * The model ID to record in context.
   * If not provided, defaults to "unknown".
   */
  modelId?: string;
}

// ─── DBZRuntime ───────────────────────────────────────────────────────────────

/**
 * The Core Runtime of DBZ Code.
 *
 * One instance per active conversation session.
 * Instances are isolated — state is never shared between runtimes.
 *
 * @example
 * ```ts
 * const runtime = new DBZRuntime({ bus, provider, toolRegistry });
 *
 * await runtime.start();
 * const response = await runtime.sendMessage({ role: "user", content: "Hello" });
 * await runtime.stop();
 * ```
 */
export class DBZRuntime {
  private readonly _context: RuntimeContext;
  private readonly _bus: EventBus;
  private readonly _provider: ProviderInterface;
  private readonly _toolRegistry: ToolRegistry;

  private _status: RuntimeStatus = RuntimeStatus.Idle;

  constructor(options: DBZRuntimeOptions) {
    this._bus = options.bus;
    this._provider = options.provider;
    this._toolRegistry = options.toolRegistry;

    this._context = {
      runtimeId: randomUUID(),
      sessionId: options.sessionId ?? randomUUID(),
      providerId: options.provider.id,
      modelId: options.modelId ?? "unknown",
    };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Start the Runtime.
   *
   * Transitions: Idle → Running
   * Emits: `runtime.started`
   *
   * @throws {RuntimeStateError} if not in Idle state.
   */
  async start(): Promise<void> {
    if (this._status !== RuntimeStatus.Idle) {
      throw new RuntimeStateError(
        `Cannot start runtime — current status: ${RuntimeStatus[this._status]}`,
      );
    }

    this._status = RuntimeStatus.Running;

    await this._bus.emit({
      ...createBaseEventFields("runtime.started", "core-runtime"),
      version: "1.0",
    });
  }

  /**
   * Stop the Runtime.
   *
   * Transitions: Running | Idle → Stopped
   * Emits: `runtime.stopped`
   *
   * @throws {RuntimeStateError} if already Stopped or Failed.
   */
  async stop(): Promise<void> {
    if (
      this._status === RuntimeStatus.Stopped ||
      this._status === RuntimeStatus.Failed
    ) {
      throw new RuntimeStateError(
        `Cannot stop runtime — current status: ${RuntimeStatus[this._status]}`,
      );
    }

    this._status = RuntimeStatus.Stopped;

    await this._bus.emit({
      ...createBaseEventFields("runtime.stopped", "core-runtime"),
      reason: "stop() called",
    });
  }

  /**
   * Send a user message and receive a response.
   *
   * Executes the full v1 runtime loop:
   * UserMessage → Provider → Tool Calls (optional, ordered) → Provider → Response
   *
   * Emits all required events at each phase.
   *
   * @throws {RuntimeStateError} if not in Running state.
   * @throws {ProviderError} if the provider fails.
   * @throws {ToolNotFoundError} if a requested tool is not registered.
   * @throws {ToolExecutionError} if a tool execution fails.
   */
  async sendMessage(message: UserMessage): Promise<RuntimeResponse> {
    if (this._status !== RuntimeStatus.Running) {
      throw new RuntimeStateError(
        `Cannot send message — current status: ${RuntimeStatus[this._status]}`,
      );
    }

    try {
      return await this._executeTurn(message);
    } catch (error) {
      await this._handleRuntimeFailure(error);
      throw error;
    }
  }

  /**
   * Return the immutable identity context for this Runtime instance.
   */
  getContext(): RuntimeContext {
    return this._context;
  }

  /**
   * Return the current lifecycle status.
   */
  getStatus(): RuntimeStatus {
    return this._status;
  }

  // ─── Runtime Loop ────────────────────────────────────────────────────────────

  /**
   * Execute a full conversation turn.
   *
   * Phase 1 — Receive message
   * Phase 2 — Call provider
   * Phase 3 — Inspect response
   * Phase 4 — Execute tool calls (if present)
   * Phase 5 — Call provider again (with tool results)
   * Phase 6 — Return response
   */
  private async _executeTurn(message: UserMessage): Promise<RuntimeResponse> {
    const { runtimeId, sessionId } = this._context;

    // ── Phase 1: Receive user message ────────────────────────────────────────

    await this._bus.emit({
      ...createBaseEventFields("runtime.message.received", "core-runtime"),
      runtimeId,
      sessionId,
    });

    // Conversation history starts with the user message
    const messages = [message];
    const allToolCalls: ToolCall[] = [];

    // ── Phase 2: Call provider ────────────────────────────────────────────────

    const firstResponse = await this._callProvider(messages);

    // ── Phase 3: Inspect response ─────────────────────────────────────────────

    const toolCalls = firstResponse.toolCalls ?? [];

    if (toolCalls.length === 0) {
      // No tool calls — emit response and return
      await this._bus.emit({
        ...createBaseEventFields("runtime.response.generated", "core-runtime"),
        runtimeId,
        sessionId,
      });

      return {
        message: firstResponse.message,
        toolCalls: [],
        usage: firstResponse.usage,
      };
    }

    // ── Phase 4: Execute tool calls ───────────────────────────────────────────

    // Append assistant message to history before executing tools
    messages.push(firstResponse.message);

    const toolResults = await this._executeToolCalls(toolCalls);
    allToolCalls.push(...toolCalls);

    // Append tool results to conversation history as ToolMessages
    for (const result of toolResults) {
      messages.push({
        role: "tool",
        content: JSON.stringify(result.output),
        toolName: result.toolName,
      });
    }

    // ── Phase 5: Call provider again with tool results ────────────────────────

    const finalResponse = await this._callProvider(messages);

    // ── Phase 6: Return response ──────────────────────────────────────────────

    await this._bus.emit({
      ...createBaseEventFields("runtime.response.generated", "core-runtime"),
      runtimeId,
      sessionId,
    });

    return {
      message: finalResponse.message,
      toolCalls: allToolCalls,
      usage: finalResponse.usage,
    };
  }

  // ─── Provider ────────────────────────────────────────────────────────────────

  /**
   * Call the provider and emit model events.
   * Emits `model.requested` before, `model.completed` after, `model.failed` on error.
   */
  private async _callProvider(
    messages: Parameters<typeof this._provider.generate>[0]["messages"],
  ): ReturnType<typeof this._provider.generate> {
    await this._bus.emit({
      ...createBaseEventFields("model.requested", "core-runtime"),
      provider: this._context.providerId,
      model: this._context.modelId,
    });

    const start = Date.now();

    let response: Awaited<ReturnType<typeof this._provider.generate>>;

    try {
      response = await this._provider.generate({ messages });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await this._bus.emit({
        ...createBaseEventFields("model.failed", "core-runtime"),
        provider: this._context.providerId,
        model: this._context.modelId,
        error: message,
      });

      throw new ProviderError(message);
    }

    await this._bus.emit({
      ...createBaseEventFields("model.completed", "core-runtime"),
      provider: this._context.providerId,
      model: this._context.modelId,
      durationMs: Date.now() - start,
      inputTokens: response.usage?.promptTokens,
      outputTokens: response.usage?.completionTokens,
    });

    return response;
  }

  // ─── Tools ───────────────────────────────────────────────────────────────────

  /**
   * Execute all tool calls in order.
   *
   * Per spec: multiple tool calls per turn are supported.
   * Order is guaranteed — tools execute sequentially, not concurrently.
   */
  private async _executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this._executeToolCall(toolCall);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a single tool call.
   *
   * Emits `tool.requested` → `tool.started` → `tool.completed` | `tool.failed`.
   * On failure: emits `tool.failed` then throws.
   */
  private async _executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    const { toolName, input } = toolCall;

    // tool.requested
    await this._bus.emit({
      ...createBaseEventFields("tool.requested", "core-runtime"),
      toolName,
      input,
    });

    // Resolve tool from registry
    const tool = this._toolRegistry.get(toolName);

    if (tool === undefined) {
      await this._bus.emit({
        ...createBaseEventFields("tool.failed", "core-runtime"),
        toolName,
        durationMs: 0,
        error: `Tool not found: "${toolName}"`,
      });

      throw new ToolNotFoundError(toolName);
    }

    // tool.started
    await this._bus.emit({
      ...createBaseEventFields("tool.started", "core-runtime"),
      toolName,
    });

    const start = Date.now();
    let result: ToolResult;

    try {
      result = await tool.execute(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const durationMs = Date.now() - start;

      await this._bus.emit({
        ...createBaseEventFields("tool.failed", "core-runtime"),
        toolName,
        durationMs,
        error: message,
      });

      throw new ToolExecutionError(toolName, message);
    }

    const durationMs = Date.now() - start;

    if (!result.success) {
      await this._bus.emit({
        ...createBaseEventFields("tool.failed", "core-runtime"),
        toolName,
        durationMs,
        error: String(result.output),
      });

      throw new ToolExecutionError(toolName, String(result.output));
    }

    // tool.completed
    await this._bus.emit({
      ...createBaseEventFields("tool.completed", "core-runtime"),
      toolName,
      durationMs,
      success: true,
      output: result.output,
    });

    return result;
  }

  // ─── Failure Handling ─────────────────────────────────────────────────────────

  /**
   * Handle an unrecoverable runtime failure.
   *
   * Emits `runtime.failed`, transitions to Failed state.
   * Per spec: emit first, then throw (caller throws after this returns).
   */
  private async _handleRuntimeFailure(error: unknown): Promise<void> {
    this._status = RuntimeStatus.Failed;

    const message = error instanceof Error ? error.message : String(error);

    await this._bus.emit({
      ...createBaseEventFields("runtime.failed", "core-runtime"),
      runtimeId: this._context.runtimeId,
      sessionId: this._context.sessionId,
      error: message,
    });
  }
}
