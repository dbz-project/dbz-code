# DBZ Code - Project State

## Project

DBZ Code

## Mission

Build a fully open-source AI coding agent runtime inspired by modern coding agents.

DBZ Code must support:

- Local models
- API models
- CLI
- Desktop UI
- Skills
- Memory
- MCP
- Subagents
- Tool execution
- Local-first architecture

## Core Principles

### Local First

All user data should remain on the user's machine by default.

### Model Agnostic

DBZ Code must work with:

- Ollama
- OpenAI
- Anthropic
- Gemini
- OpenRouter
- Future providers

### Event Driven

Everything should emit events.

### Transparent

Users should be able to inspect:

- Models
- Context
- Tools
- Skills
- Memory
- Events

### Modular

Every major subsystem must be replaceable.

## Frozen Technical Decisions

- TypeScript
- Node.js
- pnpm Workspaces
- Monorepo Architecture
- React
- Tauri
- SQLite
- sqlite-vec
- AGENTS.md support
- Event Bus Architecture

## Roles

### ChatGPT

Chief Architect

Responsibilities:

- Architecture
- Specifications
- Technical Reviews
- Roadmap

### Claude

Lead Engineer

Responsibilities:

- Implementation
- Refactoring
- Tests
- Build System

### User

Maintainer and Integrator

Responsibilities:

- GitHub
- Testing
- Integration
- Project Management

## Current Status

Repository foundation in progress. Sprint 1 underway.

## Current Objective

Create a professional repository foundation before implementing any runtime features.
