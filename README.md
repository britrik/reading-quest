Reading Quest
=============

A reading adventure app for children aged 7–9. Kids explore story worlds, earn gems and stars, care for a virtual pet, and unlock new adventures — all while building reading confidence.

## Features

- Story worlds with chapters and comprehension
- Virtual pet companion that grows with reading progress
- Gems, stars, and XP reward system
- Grown-ups dashboard with reading stats and vocabulary tracking
- Passcode-protected parent controls
- Data export for parent peace of mind

## Architecture

Monorepo (pnpm workspace):

- **artifacts/api-server/** — Express 5 + PostgreSQL/Drizzle ORM
- **artifacts/reading-quest/** — React 19 + Vite + TailwindCSS
- **lib/api-spec/** — OpenAPI specification
- **lib/api-zod/** — Generated Zod validators (via Orval)
- **lib/api-client-react/** — Generated React Query hooks
- **lib/db/** — Drizzle schema + migrations

## Getting Started

Prerequisites: Node.js 22+, pnpm 9+, PostgreSQL

```sh
cp .env.example .env   # then fill in values
pnpm install
pnpm run verify
```

## Scripts

- `pnpm build` — Type-check and build all packages
- `pnpm test` — Run unit tests
- `pnpm test:e2e` — Run Playwright E2E tests
- `pnpm verify` — Full verification (typecheck + build + test + e2e)

## Deployment

Configured for Replit Autoscale. See `replit.nix` and `.replit` for deployment settings.

## License

MIT
