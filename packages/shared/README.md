# @dbz-code/shared

> Shared contracts — the canonical interfaces, types, and enums for DBZ Code.

Part of the [DBZ Code](../../README.md) monorepo.
Spec: [`docs/architecture/03-shared-contracts.md`](../../docs/architecture/03-shared-contracts.md)
Founder: Adam Belafia Es Safi

---

## Rules

- **Type-only** — no runtime logic, no network calls, no file access
- **Dependency-free** — depends on nothing else in the monorepo
- **No duplication** — no other package may redefine equivalent structures

---

## Installation

```bash
pnpm add @dbz-code/shared
```

## Usage

```ts
import {
  UserMessage,
  AssistantMessage,
  RuntimeResponse,
  RuntimeStatus,
  ProviderInterface,
  ToolInterface,
  ToolRegistry,
} from "@dbz-code/shared";
```

---

## Contracts

### Common
| Export | Description |
|--------|-------------|
| `Identifiable` | Any entity with a string `id` |
| `Timestamped` | Any entity with an ISO 8601 `timestamp` |
| `JSONValue` | Recursively JSON-serialisable value |

### Messages
| Export | Description |
|--------|-------------|
| `MessageRole` | `"system" \| "user" \| "assistant" \| "tool"` |
| `BaseMessage` | Base shape for all messages |
| `UserMessage` | User-authored message |
| `AssistantMessage` | Model-generated message |
| `SystemMessage` | System instruction |
| `ToolMessage` | Tool execution result returned to the model |
| `AnyMessage` | Discriminated union of all message types |

### Runtime
| Export | Description |
|--------|-------------|
| `RuntimeStatus` | Enum: `Idle \| Running \| WaitingForTools \| Stopped \| Failed` |
| `RuntimeContext` | Identity context for a Runtime instance |
| `RuntimeResponse` | Return value of `Runtime.sendMessage()` |
| `Usage` | Token usage reported by a provider |

### Providers
| Export | Description |
|--------|-------------|
| `GenerateRequest` | Input to `ProviderInterface.generate()` |
| `GenerateResponse` | Output from `ProviderInterface.generate()` |
| `ProviderInterface` | Contract all providers must implement |

### Tools
| Export | Description |
|--------|-------------|
| `ToolDefinition` | Tool metadata exposed to the model |
| `ToolCall` | A tool invocation requested by the model |
| `ToolResult` | Result of executing a tool |
| `ToolInterface` | Contract all tools must implement |
| `ToolRegistry` | Contract the tool registry must implement |

---

## License

MIT
