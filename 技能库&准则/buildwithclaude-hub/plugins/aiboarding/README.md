# AIBoarding

**Onboard AI agents like fresh engineers.**

AIBoarding treats every AI coding agent as a new hire. It maintains one compressed, high-signal `AIBOARDING.md` per repository — the project's engineering basics, domain logic, and AI-specific gotchas — and guarantees, via committed hooks, that agents read it on entry and keep it current as the code evolves. No more re-explaining the codebase to every fresh session, sub-agent, or post-compaction context.

## Why

- **Zero re-explaining** — Agents get context without re-deriving it every session
- **Committed hooks** — Enforcement via deterministic hook scripts, not model-invoked skills
- **Drift-aware** — Auto-detects when `AIBOARDING.md` is stale and nudges updates
- **Cross-platform** — Polyglot `run-hook.cmd` works on Windows, macOS, and Linux

## Lifecycle

| Stage | Component | What it does |
|-------|-----------|-------------|
| **Create** | `create-aiboarding` | Generates `AIBOARDING.md` via code-crawl + grilling, installs hooks |
| **Sync** | `session-start` / `pre-task` hooks | Injects doc into every session and spawned sub-agents |
| **Update** | `update-aiboarding` | Triages commit diff, patches drifted sections or advances pointer |

## How Sync Works

| Event | Hook | Behavior |
|-------|------|----------|
| `SessionStart` (`startup\|clear\|compact`) | `session-start` | Emits `AIBOARDING.md` as session context |
| `PreToolUse` (`Task`) | `pre-task` | Prepends doc to spawned sub-agents |
| `PostToolUse` (`Bash`) | `post-commit` | Compares `last_synced_commit` to HEAD, nudges update on drift |

## Install

```bash
/plugin marketplace add gustavo-meilus/aiboarding
/plugin install aiboarding@aiboarding
```

Then generate the doc:

```
/create-aiboarding
```

This buildwithclaude listing is for discovery — install from the upstream repository above.

## Links

- [GitHub](https://github.com/gustavo-meilus/aiboarding)
- License: MIT
