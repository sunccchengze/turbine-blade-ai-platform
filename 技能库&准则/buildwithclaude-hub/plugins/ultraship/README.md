# Ultraship

Claude Code plugin — 32 expert-level skills for building, shipping, and scaling production software. 29 audit tools close the loop before deploy.

## Install

```bash
claude plugin marketplace add Houseofmvps/ultraship
claude plugin install ultraship
```

Or standalone:

```bash
npx ultraship ship .
```

## What it does

`/ship` runs 5 tools in parallel and outputs a scorecard covering security, code quality, bundle size, and SEO/GEO/AEO.

### Builder Skills (32)

TDD enforcement, code review with confidence scoring, structured planning, frontend design, API design, data modeling, deploy pipeline with rollback plans, debugging, refactoring, git workflow, competitive analysis, incident response, launch prep, and more.

### Audit Tools (29)

Secret scanner, code profiler (N+1 queries, memory leaks, ReDoS), bundle tracker, dependency doctor (import graph analysis), Lighthouse runner, health check (HTTP + SSL + security headers), env validator, migration checker, SEO/GEO/AEO scanner (60+ rules), and more.

### Agents (9)

Parallel dispatching for `/ship` scorecard generation, code review, security audit, performance audit, browser verification, competitive analysis, launch prep, incident response, growth tracking.

## Technical details

- 1 dependency (`htmlparser2`)
- 113 tests (`node:test`)
- Node.js ESM, no build step
- `execFileSync` with array args (no shell interpolation)
- SSRF protection on all HTTP tools
- Zero telemetry

## Links

- [npm](https://www.npmjs.com/package/ultraship)
- [GitHub](https://github.com/Houseofmvps/ultraship)
