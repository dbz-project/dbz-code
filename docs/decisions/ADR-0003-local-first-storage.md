# ADR-0003: Local-First Storage with SQLite and sqlite-vec

## Status

Accepted

## Date

2026-06-07

## Context

DBZ Code is local-first. All user data — sessions, memory, embeddings — must remain on the user's machine by default. We need a storage solution that:

- Requires no external server
- Supports structured queries (sessions, tool results, history)
- Supports vector similarity search (memory retrieval)
- Works on macOS, Linux, and Windows
- Embeds easily in Node.js and Tauri (Rust)

## Decision

Use **SQLite** for structured storage and **sqlite-vec** for vector embeddings.

SQLite is a battle-tested, serverless, file-based relational database. `sqlite-vec` is a SQLite extension that adds vector similarity search, enabling local semantic memory without a separate vector database.

## Consequences

### Positive

- Zero infrastructure — a single `.db` file per user
- Runs on every platform without installation
- `sqlite-vec` gives semantic search without any network dependency
- Supported natively in Node.js (via `better-sqlite3`) and Rust (via `rusqlite` in Tauri)

### Negative

- Not suitable for multi-user or high-concurrency workloads (acceptable for local-first)
- `sqlite-vec` is newer and less battle-tested than dedicated vector DBs (pgvector, Weaviate, etc.)

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| PostgreSQL + pgvector | Requires a running server — violates local-first principle |
| Chroma / Weaviate | External processes — violates local-first principle |
| LevelDB / RocksDB | No SQL interface, no built-in vector search |
