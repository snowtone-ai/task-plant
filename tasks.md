# tasks.md -- pm-zero v9.4 Execution Ledger

## Goal Binding
- Vision source: docs/vision.md
- Active goal: Maintain Task Plant under pm-zero v9.4 with product code changes tracked as explicit tasks.
- Planning owner: Codex CLI
- Implementation owner: Codex CLI
- Review owner: Codex CLI self-audit; cross-vendor review required only for trigger work.

## Status Vocabulary
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
| T001 | verified | Codex CLI | none | Legacy pm-zero metadata and project docs | Repository had the earlier task ledger, repo map, scope lock rules, aligned commands, and pnpm-only lockfile policy | git diff --check; pnpm lint; pnpm typecheck; pnpm test; pnpm build; pnpm verify | all passed on 2026-05-15 |
| T002 | ready | Codex CLI | T001 | Existing implementation files for active product work only | Continue Task Plant Phase 1-7 using docs/implementation-plan.md with disjoint write scope per task | pnpm lint; pnpm typecheck; pnpm build; related tests; browser smoke for UI | pending |
| T003 | verified | Codex CLI | T001 | src/app/plant/page.tsx, src/components/navigation/bottom-nav.tsx, src/components/plant/, src/hooks/use-plant.ts, src/lib/domain/plant.ts, tests/lib/domain/plant.test.mjs, docs/decisions.md, docs/repo-map.md, docs/state.md, tasks.md | Plant tab is visible on app screens, `/plant` renders the monthly plant view, and domain tests prevent blank plant state regressions | pnpm lint; pnpm typecheck; pnpm test; pnpm build; pnpm verify; browser smoke | all passed on 2026-05-15; smoke confirmed `/`, `/plant`, `/all` show 3-tab nav and `/plant` shows バラ |
| T004 | verified | Codex CLI | T003 | src/lib/domain/plant.ts, src/hooks/use-plant.ts, src/lib/taskDb.ts, src/hooks/use-home-screen.ts, src/components/all/all-screen.tsx, src/components/navigation/bottom-nav.tsx, src/components/home/home-screen.tsx, src/components/plant/plant-screen.tsx, tests/lib/domain/plant.test.mjs, docs/decisions.md, docs/state.md, tasks.md | Review指摘のNB-1〜NB-4を解消し、週境界・植物同期・採番重複の再発を防止する | pnpm lint; pnpm typecheck; pnpm test; pnpm build; pnpm verify | all passed on 2026-05-15; week-start tests added; plantState sync added for / and /all update paths |
| T005 | verified | Codex CLI | none | AGENTS.md, CLAUDE.md, HANDOFF-JA.md, tasks.md, docs/state.md, docs/repo-map.md, docs/decisions.md, scripts/setup.mjs, scripts/verify.mjs, .claude/settings.json, .gitignore | pm-zero v9.4 source-of-truth files are current, old project-local hook/MCP/Codex scaffolds are removed unless justified, and product code is untouched | git diff --check; pnpm verify | 2026-05-17: node scripts/verify.mjs passed; git diff --check passed before commit. |
| T006 | verified | Codex CLI | T003 | docs/plant-reward-image-prompts.md, docs/decisions.md, docs/state.md, tasks.md | 12か月の植物ごとに、自然写真として破綻しない報酬画像プロンプトを5案ずつ定義し、生成前に選定基準を固定する | git diff --check | 2026-05-17: prompt manifest added for 12 flowers x 5 variants; git diff --check passed |
| T007 | verified | Codex CLI | T003 | public/plant-rewards/, docs/plant-reward-image-sources.md, docs/state.md, tasks.md | Pexels/Unsplash/Pixabay等の無料利用可能な写真から12か月の花候補を収集し、元URL・ライセンス参照・保存先を記録する | source manifest check; git diff --check | 2026-05-17: 12 Unsplash candidates downloaded; source manifest and dimensions recorded; git diff --check passed |
| T008 | verified | Codex CLI | T007 | public/plant-rewards/candidates-v2/, docs/plant-reward-image-sources-v2.md, docs/plant-reward-image-selection-research.md, docs/state.md, tasks.md | Web/SNS由来の美しい花写真の判断軸を調査し、花全体像が見える候補を12花×5枚収集して出典・ライセンス・保存先を記録する | source manifest check; git diff --check | 2026-05-17: 60 candidates downloaded; 5 images per monthly flower confirmed; selection research and source manifest recorded; git diff --check passed |
| T009 | verified | Codex CLI | T008 | public/plant-rewards/candidates-v2/, docs/plant-reward-image-sources-v2.md, docs/plant-reward-image-selections.md, docs/state.md, tasks.md | 桜だけ別テイストの追加候補を5枚収集し、出典・ライセンス・保存先を記録する | source manifest check; git diff --check | 2026-05-17: sakura candidates 6-10 downloaded; selected candidates recorded except month 3; git diff --check passed |
| T010 | verified | Codex CLI | T009 | public/plant-rewards/candidates-v2/, docs/plant-reward-image-sources-v2.md, docs/state.md, tasks.md | 桜のややアップ寄り候補を追加収集し、出典・ライセンス・保存先を記録する | source manifest check; git diff --check | 2026-05-17: close-up sakura candidates 11-15 downloaded; source manifest updated; git diff --check passed |
| T011 | verified | Codex CLI | T010 | src/components/plant/, src/lib/domain/plant.ts, tests/lib/domain/plant.test.mjs, public/plant-rewards/, docs/plant-reward-image-selections.md, docs/plant-reward-image-sources.md, docs/repo-map.md, docs/state.md, tasks.md | 選定済み12枚の花写真を植物画面へ反映し、開花までを早め、未採用画像と候補情報を削除する | pnpm lint; pnpm typecheck; pnpm test; pnpm build; pnpm verify; browser smoke; git diff --check | 2026-05-17: final 12 reward photos added; candidates removed; blooming starts at 5 weekly completions; lint/typecheck/test/build/verify/diff-check passed; browser smoke confirmed photo reward with no console errors |
| T012 | verified | Codex CLI | T011 | src/components/navigation/bottom-nav.tsx, src/components/plant/plant-screen.tsx, docs/state.md, tasks.md | 開花写真表示中でもスマホの下部ナビでホーム/カレンダーへ遷移できる | pnpm lint; pnpm typecheck; pnpm test; pnpm build; pnpm verify; browser mobile smoke; git diff --check | 2026-05-17: reward image and overlay made non-interactive; bottom nav given explicit z-index; mobile 390x844 smoke confirmed /plant photo state can navigate to / and /all with no console errors |
| T013 | verified | Codex CLI | T012 | src/hooks/use-home-screen.ts, tasks.md | Home screen initialization keeps the same behavior while React hook dependencies are explicit and the exhaustive-deps suppression is removed | pnpm lint; pnpm typecheck; pnpm test; pnpm build | 2026-05-17: initial lint exposed react-hooks/set-state-in-effect; load moved behind a microtask; lint/typecheck/test/build passed. |
| T014 | verified | Codex CLI | T013 | src/lib/gemini.ts, src/components/home/voice-input-button.tsx, docs/state.md, tasks.md | 音声タスク登録でGemini APIが400を返しても、リクエスト形式/モデルのフォールバックで復旧可能であり、空音声入力も安全に扱える | pnpm lint; pnpm typecheck; pnpm test; pnpm build; pnpm verify | 2026-05-25: gemini client fallback (payload/model) added; transcript empty guard added; lint/typecheck/test/build/verify passed. |

## Execution Pointer
Current active task, executor, write lock, and latest verification live in docs/state.md.

## Blockers
| ID | Task | Blocker | Needed decision | Owner |
|---|---|---|---|---|

## Review Notes
| Task | Reviewer | Result | Follow-up |
|---|---|---|---|
| T001 | Codex CLI self-audit | pass | Cross-vendor review not triggered; changes are OS docs/scripts and package scripts only. |
