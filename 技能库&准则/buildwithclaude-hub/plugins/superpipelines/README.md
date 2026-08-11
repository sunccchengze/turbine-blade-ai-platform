# Superpipelines

**Multi-agent orchestration across AI coding platforms.**

Superpipelines turns AI coding assistants from chaotic generators into disciplined engineering teams. It enforces isolated code reviews, prevents infinite loops, guarantees persistent state across mid-session crashes, and removes the manual overhead of verifying every generated output.

Works on **Claude Code**, **OpenCode**, **Codex App/CLI**, **Cursor**, **Windsurf**, **Cline**, and **Antigravity CLI 2.0**.

## Why

- **Isolated reviews** — Reviewers cannot modify the code they validate (permission-layer, not convention)
- **Crash recovery** — Pipeline state persists deterministically; resumes from last checkpoint
- **Iteration caps** — Hard-coded limits prevent runaway repair cycles
- **Human gates** — Explicit approval required before high-stakes transitions
- **Spec-driven** — Tasks decompose into precise specs before execution, surfacing ambiguities early

## Slash Commands

| Command | Function |
|---------|----------|
| `/superpipelines:new-pipeline` | Initiates 4D intake and generates pipeline artifacts |
| `/superpipelines:run-pipeline` | Orchestrates an existing pipeline end-to-end |
| `/superpipelines:new-step` | Adds a new step to an existing named pipeline |
| `/superpipelines:update-step` | Modifies an existing step within a named pipeline |
| `/superpipelines:delete-step` | Removes a step from a named pipeline with gap analysis |
| `/superpipelines:audit-steps` | Audits agents and skills against the compliance matrix |
| `/superpipelines:change-models` | Sets, changes, or audits per-agent model-tier preferences |
| `/superpipelines:optimize-pipeline` | Surveys pipeline topology, locks plan, batch-applies |
| `/superpipelines:init-deep` | Generates hierarchical PIPELINE-CONTEXT.md maps |

## What's Included

| Component | Count |
|-----------|-------|
| Agents | 8 (pipeline-architect, pipeline-auditor, pipeline-failure-analyzer, pipeline-optimizer, pipeline-quality-reviewer, pipeline-spec-reviewer, pipeline-task-executor, skill-architect) |
| Commands | 9 (new-pipeline, run-pipeline, new-step, update-step, delete-step, audit-steps, change-models, optimize-pipeline, init-deep) |
| Skills | 41 (pipeline lifecycle, agent protocols, reference libraries, general-purpose) |
| Hooks | SessionStart (per-platform variants) |
| Platform tiers | 7 platforms with 3 isolation tiers |

## Execution Lifecycle

| Phase | Description |
|-------|-------------|
| 1. DECONSTRUCT | Intake → gap analysis, surfacing constraints before execution |
| 2. DIAGNOSE | Environment → constraints analysis |
| 3. DEVELOP | Architect generates spec/plan/tasks |
| 4. HARD GATE | Human approval of specification |
| 5. IMPLEMENT | Worker agents execute in isolated git worktrees |
| 6. STAGE 1 | Spec validation against output |
| 7. STAGE 2 | Quality audit (after Stage 1 passes) |
| 8. COMMIT | Passing tasks merge to integration branch |
| 9. DONE | Cleanup and summary |

## Execution Patterns

- **Sequential** — Ordered phases with hard data dependencies
- **Parallel Fan-Out** — Independent branches merged on completion
- **Iterative Loop** — Test-driven repair with hard cap of 3 iterations
- **Human-Gated** — High-stakes stages requiring manual approval
- **Spec-Driven Dev** — Full SDD with worktrees per task
- **4D Wrapper** — Wraps any pattern with structured deconstruction

## Install

Install from the upstream repository:

```bash
# Claude Code
claude plugin install github:gustavo-meilus/superpipelines

# Universal (auto-detects platform)
npx -y superpipelines-install
# or
curl -fsSL https://raw.githubusercontent.com/gustavo-meilus/superpipelines/main/install.sh | bash
```

This buildwithclaude listing is for discovery — install from the upstream repository above to get the latest version.

## Links

- [GitHub](https://github.com/gustavo-meilus/superpipelines)
- License: MIT
