# Threat Model

## Project Overview

Reading Quest is a TypeScript monorepo with a React/Vite frontend (`artifacts/reading-quest`) and an Express 5 + PostgreSQL/Drizzle backend (`artifacts/api-server`). In production, the Express server serves both the `/api` routes and the built frontend from the same deployment. The app stores child profile data, reading progress, preferences, pet/shop state, and passcode-gated grown-ups dashboard data.

Production assumptions for this scan:
- `NODE_ENV` is `production`
- Replit provides TLS for deployed traffic
- `artifacts/mockup-sandbox` is dev-only and out of scope unless production reachability is demonstrated

## Assets

- **Child profile data** — names, avatars, onboarding state, companion choice, creation timestamps, and profile IDs. This is directly identifying information about child users.
- **Reading activity and learning data** — sessions, chapter completion, word-help events, weekly summaries, and vocabulary insights. This is sensitive behavioral and educational data.
- **Preferences and household contact data** — accessibility preferences, break reminders, language variant, and the grown-up weekly email address when configured.
- **Game economy and progress state** — gems, stars, unlocked stories, owned items, pet state, and transaction history. Integrity matters because the app’s progression and rewards depend on it.
- **Grown-ups dashboard access secret** — `GROWNUPS_PASSCODE` and `GROWNUPS_TOKEN_SECRET`, plus any derived bearer token returned by `/api/grownups/auth`.
- **Database contents and connection secret** — `DATABASE_URL` and the full application database reachable from the API server.

## Trust Boundaries

- **Browser to API (`/api`)** — all client input is untrusted. The API must authenticate and authorize any request that reads or mutates per-profile data.
- **Public kid flows to passcode-gated grown-ups flows** — the app intentionally exposes a child-facing experience and a more sensitive grown-ups dashboard. That boundary must be enforced server-side, not just in UI state.
- **Profile selection boundary** — requests can target a specific child profile via `x-profile-id`. This is a sensitive boundary because it separates one child’s data and state from another’s.
- **API to PostgreSQL** — the API has full database access, so authorization mistakes at the route layer directly expose or corrupt stored data.
- **Production vs dev-only code** — `artifacts/mockup-sandbox` and test-only routes are out of scope unless reachable in production. The production router excludes `src/routes/test.ts` when `NODE_ENV === "production"`.

## Scan Anchors

- **Production entry points**: `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/*.ts`, `artifacts/reading-quest/src/App.tsx`
- **Highest-risk code areas**: `artifacts/api-server/src/lib/profile.ts`, `src/lib/grownup-auth.ts`, `src/routes/grownups.ts`, `src/routes/insights.ts`, `src/routes/profiles.ts`, `src/routes/preferences.ts`, `src/routes/sessions.ts`, `src/routes/pet.ts`, `src/routes/worlds.ts`
- **Public surfaces**: most kid-facing API routes under `/api` currently appear callable without user authentication
- **Passcode-gated surfaces**: `/api/grownups/*` and profile-management writes that require `x-grownup-token`
- **Dev-only surfaces to usually ignore**: `artifacts/mockup-sandbox/**`, `artifacts/api-server/src/routes/test.ts`

## Threat Categories

### Spoofing

The application currently uses no user session or account authentication for normal kid-facing API routes. Instead, route handlers often trust the caller-selected `x-profile-id` header to decide which child profile a request should operate on. The system must not treat a client-supplied profile identifier as proof of identity. Any request that reads or mutates per-profile data MUST be bound to a server-authenticated principal or to a server-issued, unforgeable profile-selection mechanism.

The grown-ups dashboard uses a custom passcode flow that returns a bearer-style `x-grownup-token`. The application MUST resist online guessing of the passcode and MUST ensure every grown-ups-only route validates the same production secret consistently.

### Tampering

Kid-facing routes mutate sensitive state including sessions, chapter completion, gems, unlocked stories, purchases, pet state, and preferences. Those mutations currently rely on whichever profile `resolveProfile()` selects. The system MUST enforce that callers can only modify data for profiles they are authorized to control.

Business rules such as rewards, gem spending, story unlocks, and owned-item checks are correctly implemented server-side in many places, but those controls only matter if the target profile itself is trustworthy. Profile targeting MUST be authenticated before these integrity checks are meaningful.

### Information Disclosure

The API stores and serves child names, reading history, vocabulary help events, profile preferences, and optionally a grown-up email address. The system MUST prevent unauthorized callers from enumerating profiles, reading another child’s activity, or exporting household data.

The API also enables CORS globally from `app.ts`. Cross-origin access to sensitive responses MUST be limited to trusted origins when endpoints expose non-public data or state-changing operations.

### Denial of Service

The passcode endpoint and other public API routes do not appear to have built-in rate limiting. The system MUST bound repeated authentication attempts and other inexpensive public requests so attackers cannot brute-force secrets or degrade service availability.

### Elevation of Privilege

The main privilege boundary is between a general caller, a specific child profile, and a grown-up. If an attacker can choose any profile by header, enumerate profile IDs, or guess the passcode without throttling, they can escalate from unauthenticated network access to unauthorized access to household data and control of protected features. The application MUST enforce per-profile authorization server-side and MUST ensure the grown-ups boundary is robust against brute force and token misuse.
