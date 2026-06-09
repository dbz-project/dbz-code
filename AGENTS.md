# AGENTS.md — DBZ Code

This file provides context for AI coding agents (Claude, Codex, Copilot, etc.) working in this repository.

---

## Project

DBZ Code is a fully open-source AI coding agent runtime. See `docs/ai-context/project-state.md` for the full project state.

## Before You Start

**Always read these files first:**

1. `docs/ai-context/project-state.md` — mission, principles, frozen decisions
2. `docs/ai-context/handoff.md` — current phase and next milestones
3. `docs/ai-context/active-sprint.md` — current sprint tasks and status

## Architecture

See `docs/architecture/overview.md` for the full architecture overview.

See `docs/decisions/` for all Architecture Decision Records.

## Monorepo Structure

```
apps/cli        — Command-line interface
apps/studio     — Desktop UI (Tauri + React)
packages/       — Shared packages (see architecture overview)
docs/           — All project documentation
.github/        — GitHub configuration (CI, templates, CODEOWNERS)
```

## Coding Rules

- TypeScript strict mode is mandatory. No `any`. No non-null assertions.
- All public APIs must have JSDoc comments.
- All code must pass `pnpm lint` and `pnpm typecheck` before committing.
- Follow Conventional Commits for commit messages.
- Do not add runtime dependencies to root `package.json`.
- Do not implement AI features, agents, or tools until specified in a sprint.
- Do not break existing package boundaries — check `docs/architecture/overview.md` before adding cross-package dependencies.

## Running the Workspace

```bash
pnpm install       # install all dependencies
pnpm build         # build all packages
pnpm typecheck     # type check all packages
pnpm lint          # lint all packages
pnpm test          # run all tests
```

## Maintainer Notes

- The `User` role owns GitHub, testing, integration, and project management.
- The `Claude` role owns implementation, refactoring, tests, and the build system.
- The `ChatGPT` role owns architecture, specifications, technical reviews, and the roadmap.

---

## Frozen Packages (do not modify without architecture update)

| Package | Frozen at |
|---------|-----------|
| `packages/events` | v1 — Event System spec (02-event-system.md) |
| `packages/shared` | v1 — Shared Contracts spec (03-shared-contracts.md) |
| `packages/core` | v1 — Core Runtime spec (04-core-runtime.md) |

## Note: RuntimeStatus.WaitingForTools

`RuntimeStatus.WaitingForTools` is defined but **not used in v1**.
Reserved for future streaming or async tool execution models.
Do not implement transitions to this state without an architecture update.
