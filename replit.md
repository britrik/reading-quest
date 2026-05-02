# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/api-server run test` — run API unit tests (Vitest)

## Reading Quest app (`artifacts/reading-quest`)

A PDA-friendly chapter-reading app for 7-9yo reluctant readers. Routes:
- `/` Home (worlds list, active session resume, pet HUD)
- `/world/:worldId` Story picker
- `/story/:storyId` Chapter picker
- `/story/:storyId/chapter/:chapterId` Reading session (heartbeat, word help, finish)
- `/pet` Pet Den (feed/equip/decor/shop)
- `/grownups` Passcode-protected dashboard (default passcode `1234` via `GROWNUPS_PASSCODE` env)

Reward formula: `gems = 5 + chapter.sortIndex`, `stars = 1`, `xp = 10` per first finish.
Pet level threshold: `xpForNextLevel(level) = level * 50`. Heartbeat clamps deltas to 30s.
Single active profile (auto-created "Alex"). API server seeds 3 worlds × 2 stories on first boot (idempotent).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
