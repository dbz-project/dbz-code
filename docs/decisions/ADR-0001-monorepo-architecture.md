# ADR-0001: Monorepo Architecture with pnpm Workspaces

## Status

Accepted

## Date

2026-06-07

## Context

DBZ Code is composed of multiple distinct subsystems (events, core runtime, providers, tools, memory, sessions, MCP, etc.) and two delivery surfaces (CLI and desktop Studio). These components need to share types and utilities while remaining independently versioned and releasable.

We need a repository structure that:

- Supports multiple packages with shared internal dependencies
- Enables per-package builds, tests, and releases
- Is compatible with our Node.js + TypeScript + pnpm stack
- Scales to a large open-source project over time

## Decision

Use a **monorepo** structure with **pnpm Workspaces** as the package manager.

All packages live under `packages/` and all applications live under `apps/`. A root `pnpm-workspace.yaml` declares both as workspace paths.

## Consequences

### Positive

- Atomic cross-package changes in a single commit and PR
- Shared tooling (TypeScript, ESLint, Prettier) configured once at the root
- Internal packages referenced as `workspace:*` dependencies — no publishing needed during development
- TypeScript Project References enable incremental builds

### Negative

- A misconfigured package can affect the entire workspace
- First-time contributors must install pnpm (not npm or yarn)

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Multiple separate repositories | Too much overhead for a tightly coupled system |
| Turborepo | Adds complexity without significant benefit at current scale; can be adopted later |
| npm/yarn workspaces | pnpm is faster, stricter, and better at hoisting isolation |
