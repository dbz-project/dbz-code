# DBZ Code Architecture

## 04 - Core Runtime

Version: 1.0

Status: Accepted

Founder: Adam Belafia Es Safi

---

# Purpose

The Core Runtime is the orchestration engine of DBZ Code.

The Runtime coordinates:

* Providers
* Tools
* Sessions
* Events

The Runtime does not implement any of these systems.

The Runtime only orchestrates them.

---

# Goals

## Primary Goals

* Provider agnostic
* Tool agnostic
* Event driven
* Session aware
* Deterministic behavior

## Non Goals

* Autonomous agents
* Planning
* Reflection
* Multi-agent coordination
* Streaming
* Memory management
* Session persistence

---

# Runtime Lifecycle

Each Runtime instance represents one active conversation session.

Example:

Runtime A
→ Session A

Runtime B
→ Session B

Runtime C
→ Session C

Runtime instances are isolated.

---

# Runtime Construction

The Runtime must use dependency injection.

Example:

```ts
const runtime = new DBZRuntime({
  bus,
  provider,
  toolRegistry
});
```

The Runtime must never instantiate its own dependencies.

---

# Required Dependencies

## EventBus

Source:

```text
@dbz-code/events
```

Used for:

* lifecycle events
* provider events
* tool events
* failure events

---

## ProviderInterface

Source:

```text
@dbz-code/shared
```

Used for:

* model interaction

---

## ToolRegistry

Source:

```text
@dbz-code/shared
```

Used for:

* tool lookup
* tool execution

---

# Runtime State

## RuntimeStatus

```ts
enum RuntimeStatus {
  Idle,
  Running,
  WaitingForTools,
  Stopped,
  Failed
}
```

---

## RuntimeContext

```ts
interface RuntimeContext {
  runtimeId: string;
  sessionId: string;
  providerId: string;
  modelId: string;
}
```

---

# Public API

```ts
interface Runtime {
  start(): Promise<void>;

  stop(): Promise<void>;

  sendMessage(
    message: UserMessage
  ): Promise<RuntimeResponse>;

  getContext(): RuntimeContext;

  getStatus(): RuntimeStatus;
}
```

---

# Runtime Events

## Lifecycle

```text
runtime.started
runtime.stopped
runtime.failed
```

---

## Messages

```text
runtime.message.received
runtime.response.generated
```

---

## Model

```text
model.requested
model.completed
model.failed
```

---

## Tools

```text
tool.requested
tool.started
tool.completed
tool.failed
```

---

# Runtime Loop

## Phase 1

Receive User Message

```text
UserMessage
```

Emit:

```text
runtime.message.received
```

---

## Phase 2

Call Provider

Emit:

```text
model.requested
```

Call:

```ts
provider.generate(...)
```

---

## Phase 3

Inspect Response

Two possibilities:

### No Tool Calls

Emit:

```text
model.completed
runtime.response.generated
```

Return RuntimeResponse

---

### Tool Calls Present

Continue to Phase 4

---

## Phase 4

Execute Tool Calls

For each ToolCall:

Emit:

```text
tool.requested
```

Resolve tool:

```ts
toolRegistry.get(toolName)
```

Emit:

```text
tool.started
```

Execute:

```ts
tool.execute(...)
```

Emit:

```text
tool.completed
```

or

```text
tool.failed
```

---

## Phase 5

Call Provider Again

Provider receives:

* original conversation
* tool results

Emit:

```text
model.requested
```

Call:

```ts
provider.generate(...)
```

Emit:

```text
model.completed
```

---

## Phase 6

Return Response

Emit:

```text
runtime.response.generated
```

Return RuntimeResponse

---

# Tool Execution Rules

Runtime supports multiple tool calls per turn.

Example:

ReadFile
SearchFiles
ReadFile

All tool calls must be executed in order.

Order is guaranteed.

---

# Error Handling

Rule:

Emit event first.

Throw error second.

Example:

tool.failed
↓
throw error

The Runtime must never silently swallow failures.

---

# Session Rules

Runtime owns session lifecycle.

Runtime does NOT persist sessions.

Persistence belongs to future Session System.

Flow:

Runtime
↓
EventBus
↓
Session System

---

# Dependency Rules

Allowed:

@dbz-code/events
@dbz-code/shared

Forbidden:

@dbz-code/providers
@dbz-code/tools
@dbz-code/memory
@dbz-code/sessions

The Runtime must depend on abstractions only.

---

# Testing Requirements

Must test:

* lifecycle transitions
* provider invocation
* tool invocation
* multiple tool calls
* event emission
* error propagation

Coverage target:

80%+

---

# Acceptance Criteria

Implementation is complete when:

* Runtime starts and stops correctly
* Runtime executes provider requests
* Runtime executes tool calls
* Runtime emits required events
* Runtime handles multiple tools
* Runtime propagates failures
* Runtime remains provider agnostic
* Runtime remains tool agnostic

---

# Decision Summary

Approved:

* Dependency Injection
* Event Driven Runtime
* Multiple Tool Calls
* Ordered Execution
* No Streaming
* No Autonomous Agents
* No Planning
* No Reflection
* No Subagents

These decisions are frozen for Core Runtime v1.
