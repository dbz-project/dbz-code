# DBZ Code — Architecture Overview

> This document describes the high-level architecture of DBZ Code.
> For detailed per-component decisions, see the [ADRs](../decisions/).

---

## Guiding Philosophy

DBZ Code is designed around five non-negotiable principles:

1. **Local First** — data never leaves the machine without explicit user action
2. **Model Agnostic** — no hardcoded assumption about any provider
3. **Event Driven** — every action is observable via the event bus
4. **Transparent** — users can inspect everything at any time
5. **Modular** — every subsystem can be replaced without touching others

---

## Package Dependency Graph

```
apps/cli ─────────────────────────────────────────────┐
apps/studio ──────────────────────────────────────────┤
                                                       ↓
                                                  packages/core
                                                       │
              ┌──────────┬──────────┬──────────────────┤
              ↓          ↓          ↓                  ↓
          providers   sessions  permissions          events
              │                                        │
          ┌───┴───┐                           (all packages depend
          │       │                            on events for emit)
        tools   memory
              │
           context
              │
            skills
              │
           agents
              │
             mcp

All packages also depend on: shared (utilities + types)
```

---

## Package Responsibilities

| Package | Responsibility |
|---------|---------------|
| `shared` | Common types, utilities, and constants shared across all packages |
| `events` | Typed event bus — all subsystems emit and subscribe here |
| `core` | Orchestrates the runtime — coordinates all subsystems |
| `providers` | Model provider adapters (Ollama, OpenAI, Anthropic, Gemini, OpenRouter) |
| `tools` | Tool schemas, validation, and execution sandboxing |
| `memory` | Long-term memory via SQLite + sqlite-vec |
| `context` | Context window construction and management |
| `skills` | Skill loading, resolution, and execution |
| `agents` | Agent definitions, lifecycle, and subagent spawning |
| `permissions` | Capability gating and permission enforcement |
| `sessions` | Session lifecycle — create, resume, persist, close |
| `mcp` | Model Context Protocol client — connect to external MCP servers |

---

## Data Flow (High Level)

```
User Input
    │
    ▼
sessions (create / resume session)
    │
    ▼
core (orchestrate turn)
    │
    ├──→ context (build context window)
    │         │
    │         └──→ memory (retrieve relevant history)
    │
    ├──→ providers (call model)
    │         │
    │         └──→ (stream response)
    │
    ├──→ tools (execute tool calls if requested)
    │
    └──→ events (emit everything along the way)
              │
              └──→ apps/cli / apps/studio (observe and display)
```

---

## Runtime Targets

| Target | Stack |
|--------|-------|
| CLI | Node.js + `@dbz-code/cli` |
| Desktop | Tauri (Rust shell) + React frontend (`apps/studio`) |

---

## Storage

| Store | Technology | Used By |
|-------|-----------|---------|
| Sessions + history | SQLite | `sessions`, `core` |
| Vector memory | sqlite-vec | `memory` |
| Configuration | JSON file (local) | `core` |
