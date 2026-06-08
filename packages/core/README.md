# @dbz-code/core

> Core Runtime — the orchestration engine of DBZ Code.

Part of the [DBZ Code](../../README.md) monorepo.
Spec: [`docs/architecture/04-core-runtime.md`](../../docs/architecture/04-core-runtime.md)
Founder: Adam Belafia Es Safi

---

## Overview

The Core Runtime coordinates providers, tools, sessions, and events.
It does not implement any of these systems — it only orchestrates them.

One `DBZRuntime` instance = one active conversation session.
Instances are fully isolated.

**v1 Runtime Loop:**
```
UserMessage → Provider → Tool Calls (optional, ordered) → Provider → RuntimeResponse
```

**Out of scope in v1:** streaming, planning, reflection, autonomous agents, subagents.

---

## Installation

```bash
pnpm add @dbz-code/core
```

---

## Usage

```ts
import { DBZRuntime } from "@dbz-code/core";
import { EventBus } from "@dbz-code/events";

// All dependencies injected — Runtime never creates its own
const bus = new EventBus();
const runtime = new DBZRuntime({ bus, provider, toolRegistry });

await runtime.start();

const response = await runtime.sendMessage({
  role: "user",
  content: "List the files in the current directory",
});

console.log(response.message.content);
console.log(response.toolCalls); // all tool calls made this turn

await runtime.stop();
```

---

## API

### `DBZRuntime`

| Method | Description |
|--------|-------------|
| `start()` | Start the runtime. Emits `runtime.started`. |
| `stop()` | Stop the runtime. Emits `runtime.stopped`. |
| `sendMessage(message)` | Execute a full turn. Returns `RuntimeResponse`. |
| `getContext()` | Return the immutable `RuntimeContext`. |
| `getStatus()` | Return the current `RuntimeStatus`. |

### Errors

| Error | When |
|-------|------|
| `RuntimeStateError` | Operation attempted in invalid state |
| `ProviderError` | Provider `generate()` throws |
| `ToolNotFoundError` | Tool name not in registry |
| `ToolExecutionError` | Tool returns `success: false` or throws |

---

## Runtime Events

| Event | When |
|-------|------|
| `runtime.started` | After `start()` |
| `runtime.stopped` | After `stop()` |
| `runtime.failed` | On unrecoverable error |
| `runtime.message.received` | User message received |
| `runtime.response.generated` | Final response ready |
| `model.requested` | Before each provider call |
| `model.completed` | After successful provider call |
| `model.failed` | After provider failure |
| `tool.requested` | Before tool resolution |
| `tool.started` | After tool resolved, before execute |
| `tool.completed` | After successful execution |
| `tool.failed` | After any tool failure |

---

## Dependency Rules

```
✅ @dbz-code/events
✅ @dbz-code/shared

✗ @dbz-code/providers
✗ @dbz-code/tools
✗ @dbz-code/memory
✗ @dbz-code/sessions
```

---

## License

MIT
