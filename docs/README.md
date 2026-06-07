# Documentation

This folder contains all project documentation for DBZ Code.

## Structure

| Folder | Purpose |
|--------|---------|
| [`architecture/`](architecture/) | System architecture diagrams and explanations |
| [`decisions/`](decisions/) | Architecture Decision Records (ADRs) |
| [`ai-context/`](ai-context/) | AI session context files — source of truth for AI collaborators |
| [`progress/`](progress/) | Sprint tracking and milestone progress |
| [`rfc/`](rfc/) | Requests for Comments — proposals for significant changes |

---

## AI Context

The `ai-context/` folder is the **source of truth** for all AI collaborators.
Always read these files at the start of each session:

- [`ai-context/project-state.md`](ai-context/project-state.md) — mission, principles, decisions
- [`ai-context/handoff.md`](ai-context/handoff.md) — current phase and next milestones
- [`ai-context/active-sprint.md`](ai-context/active-sprint.md) — current sprint tasks

---

## ADR Format

Architecture Decision Records in `decisions/` follow this naming convention:

```
ADR-NNNN-short-title.md
```

See [`decisions/ADR-0001-monorepo-architecture.md`](decisions/ADR-0001-monorepo-architecture.md) for an example.
