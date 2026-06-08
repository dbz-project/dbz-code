# DBZ Code Architecture

## 03 - Shared Contracts

Version: 1.0

Status: Accepted

Founder: Adam Belafia Es Safi

---

# Purpose

The Shared Contracts package defines the canonical language used across DBZ Code.

It contains:

* Shared interfaces
* Shared types
* Shared message formats
* Shared runtime contracts

All packages must use these contracts.

No package may redefine equivalent structures locally.

---

# Goals

## Primary Goals

* Single source of truth
* Strong typing
* Zero runtime dependencies
* Reusable contracts
* Stable public API

## Non Goals

* Business logic
* Runtime execution
* Event processing
* Persistence
* Provider implementations

---

# Package Rules

Package:

```text
packages/shared
```

Must contain only:

```text
Types
Interfaces
Enums
Utility type aliases
```

Must NOT contain:

```text
Runtime logic
Network calls
File access
Database access
Provider code
Tool code
```

---

# Directory Structure

```text
packages/shared/src/

common/
messages/
runtime/
providers/
tools/

index.ts
```

---

# Common Types

## Identifiable

```ts
export interface Identifiable {
  id: string;
}
```

---

## Timestamped

```ts
export interface Timestamped {
  timestamp: string;
}
```

---

## JSONValue

```ts
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };
```

---

# Message Contracts

## MessageRole

```ts
export type MessageRole =
  | "system"
  | "user"
  | "assistant"
  | "tool";
```

---

## BaseMessage

```ts
export interface BaseMessage {
  role: MessageRole;
  content: string;
}
```

---

## UserMessage

```ts
export interface UserMessage extends BaseMessage {
  role: "user";
}
```

---

## AssistantMessage

```ts
export interface AssistantMessage extends BaseMessage {
  role: "assistant";
}
```

---

## SystemMessage

```ts
export interface SystemMessage extends BaseMessage {
  role: "system";
}
```

---

## ToolMessage

```ts
export interface ToolMessage extends BaseMessage {
  role: "tool";

  toolName: string;
}
```

---

## AnyMessage

```ts
export type AnyMessage =
  | UserMessage
  | AssistantMessage
  | SystemMessage
  | ToolMessage;
```

---

# Runtime Contracts

## RuntimeStatus

```ts
export enum RuntimeStatus {
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
export interface RuntimeContext {
  runtimeId: string;

  sessionId: string;

  providerId: string;

  modelId: string;
}
```

---

## RuntimeResponse

```ts
export interface RuntimeResponse {
  message: AssistantMessage;

  toolCalls: ToolCall[];

  usage?: Usage;
}
```

---

## Usage

```ts
export interface Usage {
  promptTokens: number;

  completionTokens: number;

  totalTokens: number;
}
```

---

# Provider Contracts

## GenerateRequest

```ts
export interface GenerateRequest {
  messages: AnyMessage[];
}
```

---

## GenerateResponse

```ts
export interface GenerateResponse {
  message: AssistantMessage;

  toolCalls?: ToolCall[];

  usage?: Usage;
}
```

---

## ProviderInterface

```ts
export interface ProviderInterface {
  id: string;

  generate(
    request: GenerateRequest
  ): Promise<GenerateResponse>;
}
```

---

# Tool Contracts

## ToolDefinition

```ts
export interface ToolDefinition {
  name: string;

  description: string;
}
```

---

## ToolCall

```ts
export interface ToolCall {
  toolName: string;

  input: JSONValue;
}
```

---

## ToolResult

```ts
export interface ToolResult {
  toolName: string;

  output: JSONValue;

  success: boolean;
}
```

---

## ToolInterface

```ts
export interface ToolInterface {
  definition: ToolDefinition;

  execute(
    input: JSONValue
  ): Promise<ToolResult>;
}
```

---

## ToolRegistry

```ts
export interface ToolRegistry {
  register(
    tool: ToolInterface
  ): void;

  get(
    name: string
  ): ToolInterface | undefined;

  list(): ToolInterface[];
}
```

---

# Dependency Rules

Allowed:

```text
shared
```

Forbidden:

```text
shared -> core
shared -> providers
shared -> tools
shared -> memory
shared -> sessions
shared -> agents
shared -> skills
```

Shared must remain dependency-free.

---

# Public API

All contracts must be re-exported from:

```ts
packages/shared/src/index.ts
```

Consumers must be able to write:

```ts
import {
  UserMessage,
  RuntimeResponse,
  ProviderInterface,
  ToolInterface
} from "@dbz-code/shared";
```

---

# Acceptance Criteria

Implementation is complete when:

* All contracts exist.
* All contracts are exported.
* No runtime logic exists.
* No circular dependencies exist.
* All packages can depend on shared safely.

---

# Decision Summary

Approved:

* Shared is type-only.
* Shared is dependency-free.
* Shared defines canonical contracts.
* Runtime, Providers and Tools consume contracts from Shared.
* Contract duplication is forbidden.

These decisions are frozen for Shared Contracts v1.
