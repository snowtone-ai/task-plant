# OS-KERNEL.md -- pm-zero v9.3

## Quality Gates

### Q1. Spec / Reference Gate
- docs/vision.md contains product intent.
- UI/API/DB/critical workflows have 3 real examples in docs/decisions.md.
- 3+ HIGH assumptions are confirmed before implementation.

### Q2. Task Ledger Gate
- tasks.md exists.
- Active work maps to a task ID.
- Ready tasks include owner, dependencies, write scope, acceptance, verification, and evidence.
- Completed work updates task status and evidence.

### Q3. Repo Map Gate
- docs/repo-map.md exists.
- Summary stays under 20 lines.
- Structural changes update the relevant section.
- Agents use repo-map details before broad manual browsing.

### Q4. Code Gate
- Target 300 lines per file.
- Target 50 lines per function.
- Meaningful naming throughout.
- Every error is handled explicitly.
- Existing code style is matched.

### Q5. Architecture Gate
- UI / domain / data responsibilities stay separated.
- Dependencies flow in one direction.
- 300+ line diffs are split or explained in docs/decisions.md.
- Abstractions stay concrete and justified.

### Q6. Test Gate
- New features include tests.
- Bug fixes include reproduction tests or reproduction steps.
- Include at least 1 negative path.
- UI changes include screenshot or browser smoke.

### Q7. Error Gate
- Failure cases are documented.
- User-facing errors are prepared.
- 3 consecutive identical errors create Escalation in docs/issues.md.

### Q8. Security Gate
- Safe values only in output.
- Environment secrets are accessed through application runtime only.
- Auth, billing, DB, permissions, deploy, and external API require cross-vendor review.

### Q9. Observability Gate
- For production targets, logging distinguishes error / warn / info.
- Secret redaction is applied where data leaves process boundaries.
- API / DB / auth / external API failures are traceable.
- MVP deferrals are documented in docs/decisions.md.

### Q10. Handoff Gate
- Report in Japanese.
- Completed task IDs are listed.
- Verification steps are explicitly listed.
- Unverified items are explicitly listed.
- AI completes all possible work before requesting human action.

## Verification Modes

### quick
Use for docs, small copy changes, and low-risk config changes.

Execute:
- Confirm changed files.
- Check task ID if applicable.
- Run git diff --check.
- Run targeted tests only when needed.

### standard
Use for normal implementation, component additions, and API changes.

Execute:
- pnpm lint
- pnpm typecheck
- pnpm build
- pnpm test or related tests
- task evidence update

### final
Use for pre-merge, pre-push, pre-deploy, and large-scope changes.

Execute:
- pnpm verify
- e2e tests
- browser smoke
- console error check
- screenshot capture
- git status
- tasks.md vs git reality reconciliation
- docs/state.md vs git reality reconciliation

## Cross-vendor Review Triggers
- Auth
- Billing
- DB schema
- RLS / permissions
- Deploy
- Security
- New external API
- 300+ line diff
- 3 consecutive errors
- Production data, personal data, or public URL impact

## Permission Design

### AI Executes
- pnpm install / lint / typecheck / test / build / verify
- Playwright / screenshot / console checks
- git status / diff / non-destructive inspection
- File creation and edits inside assigned write scope

### Human Approval Required
- git push
- Production deploy final approval
- API key issuance / OAuth approval / billing
- Personal data or production data handling decisions

### Forbidden
- force push / reset --hard / clean -fd / rm -rf / sudo
- Reading or outputting secret-bearing .env files
