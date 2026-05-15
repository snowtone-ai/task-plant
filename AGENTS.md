# Project AGENTS.md -- pm-zero v9.3

## Language
- 完了報告、エラー報告、手動確認依頼は日本語。
- コード識別子は英語可。
- HIGH仮定が3つ以上溜まったら、実装前に確認する。

## Source of Truth
- Product intent: docs/vision.md
- Execution tasks: tasks.md
- Current state: docs/state.md
- Decisions: docs/decisions.md
- Failures: docs/issues.md
- Repository map: docs/repo-map.md
- Quality: OS-KERNEL.md
- Domain vocabulary: CONTEXT.md
- Report: HANDOFF-JA.md

## Startup Read
- Read this file.
- Read docs/state.md.
- Read docs/decisions.md.
- Read docs/repo-map.md Summary.

## Repository Navigation
- Read detailed repo-map sections only when the target area is unclear.
- Update docs/repo-map.md after structural changes.
- Use rg before broad manual browsing.

## Task Ledger Rule
- Planning output goes to tasks.md.
- Implementation starts from tasks marked ready.
- Each ready task includes owner, dependencies, write scope, acceptance, verification, and evidence.
- Coordinator updates tasks.md.
- Worker agents report results to the coordinator.

## Scope Lock Rule
- One coordinator owns tasks.md and docs/state.md.
- Workers edit only their assigned write scope.
- Parallel work requires disjoint write scopes or isolated worktrees.
- Tasks touching the same file are serialized.

## Execution Rules
- Read docs/state.md and docs/decisions.md before implementation.
- Ground UI/API/DB/critical workflows with 3 real examples in docs/decisions.md before implementation.
- Target 300 lines per file and 50 lines per function.
- Add tests for every new feature.
- After 3 consecutive errors, record in docs/issues.md Escalation and pause.
- Declare verification mode (quick / standard / final) before completion.
- Final report follows HANDOFF-JA.md.

## Commands
- install: pnpm install
- lint: pnpm lint
- typecheck: pnpm typecheck
- test: pnpm test
- build: pnpm build
- verify: pnpm verify
- dev: pnpm dev
- setup: node scripts/setup.mjs

## Execution Boundaries
- Use standard push with branch tracking only when explicitly requested.
- Handle every error explicitly.
- Keep safe values only in output.
- Use .env.example as template; application runtime reads actual env values.
- Authentication, billing, production deploy final approval, API key issuance, OAuth approval, and personal data handling are human tasks.
- pnpm install / lint / typecheck / test / build / verify, Playwright checks, git inspection, file creation, and file edits are AI-executed.

## Security
- Do not read or output secrets.
- Do not read .env.local or other secret-bearing .env files.
- force push / reset --hard / clean -fd / rm -rf / sudo are forbidden.

## Model Routing
- Default planning: Claude Code.
- Default implementation: Codex CLI.
- Either agent can perform the full workflow when needed.
- Lightweight fixes: lightweight model.
- Critical changes: review by a model or vendor different from the implementer.
- Auth, billing, DB, permissions, deploy, security, new external API, and 300+ line diff require cross-vendor review.
