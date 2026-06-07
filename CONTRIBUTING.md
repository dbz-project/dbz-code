# Contributing to DBZ Code

Thank you for your interest in contributing! This guide will help you get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Workflow](#workflow)
- [Coding Standards](#coding-standards)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

---

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you agree to uphold a respectful and collaborative environment.

---

## Ways to Contribute

- **Bug reports**: Open a GitHub issue using the Bug Report template
- **Feature requests**: Open a GitHub issue using the Feature Request template
- **Documentation**: Improve or correct docs, ADRs, or READMEs
- **Code**: Fix bugs, implement features, or improve tooling

---

## Development Setup

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Git

### Installation

```bash
git clone https://github.com/dbz-code/dbz-code.git
cd dbz-code
pnpm install
```

### Build

```bash
pnpm build
```

### Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
```

---

## Workflow

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes following the coding standards below
4. Commit using the convention described below
5. Push and open a Pull Request

---

## Coding Standards

- All code must be written in **TypeScript**
- Use **strict mode** (`"strict": true` is enforced)
- No `any` types — use `unknown` and narrow appropriately
- Prefer explicit return types on public functions
- All public APIs must include JSDoc comments
- Run `pnpm lint` and `pnpm typecheck` before committing — CI will fail otherwise
- Format with `pnpm format` (Prettier)

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(scope): <short summary>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that is not a fix or feature |
| `test` | Adding or updating tests |
| `chore` | Tooling, build, CI |
| `perf` | Performance improvement |
| `ci` | CI configuration |

### Examples

```
feat(events): add typed event emitter base class
fix(core): handle null provider response correctly
docs(readme): update getting started instructions
chore(ci): add typecheck step to CI workflow
```

---

## Pull Request Process

1. Fill in the PR template completely
2. Link any related issues
3. Ensure all CI checks pass (lint, typecheck, build, test)
4. Request a review from a maintainer
5. Address review feedback promptly
6. Squash commits before merge if requested

---

## Issue Reporting

Use the provided templates:

- **Bug Report**: Include steps to reproduce, expected vs actual behavior, and environment info
- **Feature Request**: Describe the problem being solved, not just the solution
- **RFC**: Major architectural changes should go through the RFC process (see `docs/rfc/`)

---

## Questions

Open a [Discussion](https://github.com/dbz-code/dbz-code/discussions) for questions that don't fit as issues.
