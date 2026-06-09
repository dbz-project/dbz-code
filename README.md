# DBZ Code

> A fully open-source AI coding agent runtime.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9%2B-orange?logo=pnpm)](https://pnpm.io/)
[![CI](https://github.com/dbz-project/dbz-code/actions/workflows/ci.yml/badge.svg)](https://github.com/dbz-project/dbz-code/actions/workflows/ci.yml)

---

**Founded by [Adam Belafia Es Safi](https://github.com/dbz-project)**

---

## Overview

DBZ Code is a local-first, model-agnostic AI coding agent runtime. It supports local models (via Ollama), API models (OpenAI, Anthropic, Gemini, and more), a CLI, a desktop UI, skills, memory, MCP, subagents, and tool execution — all designed around an event-driven, transparent, and modular architecture.

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| **Local First** | All user data remains on-device by default |
| **Model Agnostic** | Works with Ollama, OpenAI, Anthropic, Gemini, OpenRouter, and more |
| **Event Driven** | Every subsystem emits observable events |
| **Transparent** | Inspect models, context, tools, skills, memory, and events at any time |
| **Modular** | Every major subsystem is independently replaceable |

---

## Repository Structure

```
dbz-code/
├── apps/
│   ├── cli/          # Command-line interface
│   └── studio/       # Desktop UI (Tauri + React)
├── packages/
│   ├── core/         # Core runtime and orchestration
│   ├── events/       # Event bus and event types
│   ├── providers/    # Model provider adapters
│   ├── tools/        # Tool definitions and execution
│   ├── memory/       # Memory subsystem
│   ├── context/      # Context management
│   ├── skills/       # Skill loading and execution
│   ├── agents/       # Agent definitions and subagent support
│   ├── permissions/  # Permission system
│   ├── sessions/     # Session management
│   ├── mcp/          # Model Context Protocol integration
│   └── shared/       # Shared contracts and types
└── docs/
    ├── architecture/ # Architecture decision records
    ├── decisions/    # General decisions log
    ├── ai-context/   # AI session context files
    ├── progress/     # Progress tracking
    └── rfc/          # Request for comments
```

---

## Package Status

| Package | Version | Status |
|---------|---------|--------|
| `@dbz-code/events` | 0.1.0 | 🔒 Frozen v1 |
| `@dbz-code/shared` | 0.1.0 | 🔒 Frozen v1 |
| `@dbz-code/core` | 0.1.0 | 🔒 Frozen v1 |
| `@dbz-code/providers` | — | ⏳ In design |
| `@dbz-code/tools` | — | ⏳ Pending |
| `@dbz-code/memory` | — | ⏳ Pending |
| `@dbz-code/sessions` | — | ⏳ Pending |
| `@dbz-code/agents` | — | ⏳ Pending |
| `@dbz-code/skills` | — | ⏳ Pending |
| `@dbz-code/permissions` | — | ⏳ Pending |
| `@dbz-code/mcp` | — | ⏳ Pending |
| `@dbz-code/context` | — | ⏳ Pending |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9

### Installation

```bash
git clone https://github.com/dbz-project/dbz-code.git
cd dbz-code
pnpm install
pnpm build
```

### Development

```bash
pnpm dev        # watch mode
pnpm lint       # lint
pnpm typecheck  # type check
pnpm test       # run all tests
pnpm format     # format
```

---

## Tech Stack

- **Language**: TypeScript 5.5+
- **Runtime**: Node.js 20+
- **Package Manager**: pnpm Workspaces
- **Desktop**: Tauri (Rust + WebView)
- **UI**: React
- **Database**: SQLite + sqlite-vec
- **Event System**: Custom typed event bus

---

## Architecture

See [`docs/architecture/`](docs/architecture/) for all architecture documents.

| Document | Description |
|----------|-------------|
| [02-event-system.md](docs/architecture/02-event-system.md) | Event bus, typed registry, replay |
| [03-shared-contracts.md](docs/architecture/03-shared-contracts.md) | Shared interfaces and types |
| [04-core-runtime.md](docs/architecture/04-core-runtime.md) | Core orchestration engine |

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

---

## License

[MIT](LICENSE) — DBZ Code is free and open-source software.

---

## Founder

DBZ Code was founded by **Adam Belafia Es Safi**.
