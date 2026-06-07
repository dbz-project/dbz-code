# ADR-0002: Event Bus Architecture

## Status

Accepted

## Date

2026-06-07

## Context

DBZ Code must be transparent and observable. Every subsystem — model calls, tool execution, memory reads, context construction, agent lifecycle — should be inspectable in real time without tight coupling between components.

## Decision

Adopt an **event bus architecture** as a first-class primitive.

Every major action emitted by any subsystem fires a typed event on a central event bus. The `@dbz-code/events` package owns the bus and all event type definitions. All other packages depend on `@dbz-code/events` to emit and subscribe, never coupling directly to each other for cross-cutting concerns.

## Consequences

### Positive

- Loose coupling between subsystems
- Real-time observability for the Studio UI and CLI
- Enables plugin and extension points with zero changes to core
- Testing becomes easier: assert on emitted events instead of internal state

### Negative

- Event schema must be versioned carefully to avoid breaking consumers
- Debugging async event chains requires good tooling

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Direct method calls between subsystems | Tight coupling, hard to observe, no extension points |
| External message broker (Redis, NATS) | Overkill for a local-first runtime; adds infrastructure dependency |
