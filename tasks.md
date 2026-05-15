# tasks.md -- pm-zero v9.3 Execution Ledger

## Goal Binding
- Vision source: docs/vision.md
- Active goal: Adapt Task Plant repository to pm-zero v9.3 with minimal changes and audit contradictions.
- Codex /goal: Optional; tasks.md remains source of truth.
- Planning owner: Codex CLI
- Implementation owner: Codex CLI
- Review owner: Codex CLI self-audit; cross-vendor review required only for trigger work.

## Task Status Vocabulary
- proposed: idea exists, not ready
- ready: owner, dependencies, write scope, acceptance, verification, and expected evidence are clear
- doing: one owner is actively working
- blocked: needs decision, dependency, credential, environment, or human action
- review: implementation complete, review pending
- done: accepted by reviewer
- verified: evidence recorded

## Parallelization Rules
- Coordinator owns tasks.md.
- Worker agents own only their assigned Write Scope.
- Parallel implementation requires disjoint Write Scopes or isolated worktrees.
- If two tasks need the same file, serialize them.
- Subagents return reports; coordinator updates tasks.md.

## Tasks
| ID | Status | Owner | Depends On | Write Scope | Acceptance | Verification | Evidence |
|---|---|---|---|---|---|---|---|
| T001 | verified | Codex CLI | none | AGENTS.md, OS-KERNEL.md, HANDOFF-JA.md, MEMORY.md, CONTEXT.md, tasks.md, docs/repo-map.md, docs/state.md, docs/decisions.md, package.json, package-lock.json, scripts/*.mjs, README.md, docs/codex-prompt.md, docs/implementation-plan.md | Repository has pm-zero v9.3 task ledger, repo map, scope lock rules, aligned commands, pnpm-only lockfile policy, and no obvious OS-document contradictions | git diff --check; pnpm lint; pnpm typecheck; pnpm test; pnpm build; pnpm verify | all passed on 2026-05-15 |
| T002 | ready | Codex CLI | T001 | Existing implementation files for active product work only | Continue Task Plant Phase 1-7 using docs/implementation-plan.md with disjoint write scope per task | pnpm lint; pnpm typecheck; pnpm build; related tests; browser smoke for UI | pending |
| T003 | verified | Codex CLI | T001 | src/app/plant/page.tsx, src/components/navigation/bottom-nav.tsx, src/components/plant/, src/hooks/use-plant.ts, src/lib/domain/plant.ts, tests/lib/domain/plant.test.mjs, docs/decisions.md, docs/repo-map.md, docs/state.md, tasks.md | Plant tab is visible on app screens, `/plant` renders the monthly plant view, and domain tests prevent blank plant state regressions | pnpm lint; pnpm typecheck; pnpm test; pnpm build; pnpm verify; browser smoke | all passed on 2026-05-15; smoke confirmed `/`, `/plant`, `/all` show 3-tab nav and `/plant` shows バラ |

## Execution Pointer
Current active task, executor, write lock, and latest verification live in docs/state.md.

## Blockers
| ID | Task | Blocker | Needed decision | Owner |
|---|---|---|---|---|

## Review Notes
| Task | Reviewer | Result | Follow-up |
|---|---|---|---|
| T001 | Codex CLI self-audit | pass | Cross-vendor review not triggered; changes are OS docs/scripts and package scripts only. |
