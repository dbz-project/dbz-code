# DBZ Code

> A fully open-source AI coding agent runtime.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9%2B-orange?logo=pnpm)](https://pnpm.io/)
[![CI](https://github.com/dbz-code/dbz-code/actions/workflows/ci.yml/badge.svg)](https://github.com/dbz-code/dbz-code/actions/workflows/ci.yml)

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
│   └── shared/       # Shared utilities and types
└── docs/
    ├── architecture/ # Architecture decision records
    ├── decisions/    # General decisions log
    ├── ai-context/   # AI session context files
    ├── progress/     # Progress tracking
    └── rfc/          # Request for comments
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9

### Installation

```bash
# Clone the repository
git clone https://github.com/dbz-code/dbz-code.git
cd dbz-code

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Run all packages in watch mode
pnpm dev

# Lint
pnpm lint

# Type check
pnpm typecheck

# Format
pnpm format
```

---

## Tech Stack

- **Language**: TypeScript 5.5+
- **Runtime**: Node.js 20+
- **Package Manager**: pnpm Workspaces
- **Desktop**: Tauri (Rust + WebView)
- **UI**: React
- **Database**: SQLite + sqlite-vec
- **Event System**: Custom event bus

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

---

## License

[MIT](LICENSE) — DBZ Code is free and open-source software.
