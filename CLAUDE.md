# BiteMap — Port Phillip Bay Fishing Tracker

Turborepo pnpm monorepo. Expo (mobile) + Next.js (web) + Supabase + shared packages.

## Stack

- **apps/mobile** — Expo SDK 54, React Native 0.81.5, expo-router v4
- **apps/web** — Next.js 14, Tailwind CSS
- **packages/shared** — Zod schemas, Supabase client, query helpers, types
- **packages/ui** — Design system (tokens, primitives, Storybook scaffolded)
- **Supabase** — Postgres, RLS, pgTAP tests, local Docker dev stack

## Context

See `.claude/context/` for detailed state:
- `status.md` — current phase, what's done, what's next, open bugs
- `decisions.md` — architectural decisions with rationale
- `lessons.md` — corrections log (what gets done wrong repeatedly)

## Key Commands

```bash
pnpm turbo typecheck          # all packages
pnpm --filter @bitemap/shared test
pnpm --filter @bitemap/ui test
pnpm --filter web build
supabase db reset              # apply migrations + seed
supabase test db               # run pgTAP tests
```

## Conventions

- Work directly on `main` branch
- Tag releases: `v{major}.{minor}.{patch}-{phase-name}`
- Zod v4 — use `z.uuid()` not `z.string().uuid()`
- Supabase SSR cookie API: `getAll`/`setAll` (not deprecated `get`/`set`/`remove`)
- Mobile entry point: `expo-router/entry`
- GitHub: https://github.com/lulacoding/bitemap

## Phased Roadmap

See `docs/superpowers/plans/` for detailed TDD plans per phase.
Current progress tracked in `.claude/context/status.md`.

**Pre-launch blockers (no exceptions):**
1. **Phase 12 — Production Data Audit** (`v0.16.0-data-audit`): zero mock/placeholder/TODO in shipping code. Every screen hits real data.
2. **Phase 13 — Security Hardening** (`v0.17.0-security`): RLS audit, server-side privacy snap, rate limits, CSP, pen-test pass.

Both must tag green before v1.0.0.

Competitor-parity enhancements layered on top of each phase:
- `docs/superpowers/design/bitemap-competitor-gap-analysis.md` (research + sources)
- `docs/superpowers/plans/2026-04-20-bitemap-competitor-gap-backlog.md` (actionable backlog)
