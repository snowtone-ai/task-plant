# repo-map.md -- pm-zero v9.3 Repository Map

## Read Policy
- Session start: read Summary only.
- Before editing: read the section for the target area.
- When navigation is unclear: read Entry Points and Directory Map.
- After structural changes: update the affected section.

## Summary
- App type: Next.js PWA task manager for Android Chrome.
- Main runtime: Next.js 16 App Router, React 19, TypeScript strict.
- Package manager: pnpm.
- Primary source directory: src/.
- Primary test directory: tests/.
- Main entry points: src/app/page.tsx, src/app/all/page.tsx, src/app/layout.tsx.
- Verification command: pnpm verify.
- Project memory: docs/, tasks.md, CONTEXT.md, OS-KERNEL.md.

## Directory Map
| Path | Purpose | Edit Frequency | Notes |
|---|---|---|---|
| src/app/ | App Router pages, layout, manifest, global CSS | medium | Keep browser-only logic behind client components. |
| src/components/home/ | Home task UI, add/edit modals, voice input | high | User-facing task workflows. |
| src/components/all/ | Calendar/list all-task views | high | /all view state and display components. |
| src/components/calendar/ | Google Calendar import UI | medium | Auth/API integration UI. |
| src/components/navigation/ | Shared app navigation | low | Keep bottom tabs centralized. |
| src/components/plant/ | Plant growth UI | medium | Browser-only plant screen and renderer. |
| src/components/ui/ | Shared UI primitives | low | Match existing shadcn-style patterns. |
| src/hooks/ | React hooks for browser/API state | medium | Keep side effects out of pure domain modules. |
| src/lib/ | DB, notifications, Gemini, utilities | high | Data/API/domain boundary lives here. |
| src/lib/domain/ | Pure domain logic | medium | Preferred place for testable rules. |
| src/lib/api/ | External API helpers | medium | Avoid UI state here. |
| src/types/ | Ambient browser typings | low | Web Speech API types. |
| tests/ | Node test runner tests | medium | Keep pure domain tests dependency-light. |
| docs/ | pm-zero project memory | medium | Decisions, state, issues, repo map. |
| scripts/ | Setup and verification automation | medium | Keep commands aligned with package.json. |
| public/ | Static PWA assets and service worker output | low | Do not use cache.addAll in SW install. |
| .claude/ | Claude project adapter files | low | Thin project adapter. |
| .codex/ | Codex project adapter files | low | Project-specific limits only. |

## Entry Points
| Area | File | Purpose |
|---|---|---|
| Home page | src/app/page.tsx | Loads the home screen. |
| All tasks page | src/app/all/page.tsx | Loads calendar/list view. |
| App shell | src/app/layout.tsx | Metadata and root document. |
| PWA manifest | src/app/manifest.ts | App install metadata. |
| Task data | src/lib/taskDb.ts | CRUD and date-scoped task retrieval. |
| DB schema | src/lib/db.ts | Dexie schema and domain types. |
| Date rules | src/lib/domain/task-date.ts | Recurrence, completion, sorting helpers. |
| Notifications | src/lib/notifications.ts | Local notification scheduling helpers. |
| Gemini parsing | src/lib/gemini.ts | Voice task parsing integration. |
| Google auth | src/lib/api/google-auth.ts | GIS token flow. |
| Plant page | src/app/plant/page.tsx | Loads plant growth view. |

## Common Workflows
| Workflow | Read First | Edit Usually | Verify |
|---|---|---|---|
| Home task UI | docs/vision.md, src/components/home/ | src/components/home/, src/lib/taskDb.ts | pnpm lint; pnpm typecheck; pnpm test |
| Calendar/list UI | src/components/all/, src/lib/domain/task-date.ts | src/components/all/, src/lib/domain/ | pnpm lint; pnpm typecheck; pnpm test |
| Recurrence/domain logic | src/lib/domain/task-date.ts, tests/lib/domain/ | src/lib/domain/, tests/lib/domain/ | pnpm test |
| External API import | docs/decisions.md, src/lib/api/ | src/lib/api/, src/hooks/, relevant component | pnpm lint; pnpm typecheck; pnpm build |
| PWA/SW behavior | CLAUDE.md, src/components/pwa-register.tsx | src/components/pwa-register.tsx, public/ | pnpm build; browser smoke |
| pm-zero OS update | AGENTS.md, pm-zero v9.3 spec | AGENTS.md, tasks.md, docs/, scripts/ | git diff --check; pnpm test |

## Generated / External Files
| Path | Rule |
|---|---|
| node_modules/ | Do not edit. |
| .next/ | Generated build output; do not edit. |
| tsconfig.tsbuildinfo | Generated TypeScript cache; do not edit manually. |
| pnpm-lock.yaml | Update only via pnpm. |
| screenshots/ | Verification artifacts only. |
| logs/ | Local logs only; do not commit secrets. |
| .env.local | Do not read or output. |

## Update Rules
- Add new directories when they become implementation-relevant.
- Keep Summary under 20 lines.
- Keep each directory note concrete.
- Move rationale to docs/decisions.md.
