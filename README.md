# BiteMap

Free, community-driven fishing tracker for Port Phillip Bay. Map-first mobile + web app built on a Turborepo monorepo.

## Setup

Prerequisites: Node 20+, pnpm 9+ (via corepack), git.

```bash
corepack enable
pnpm install
cp .env.example .env   # fill in Supabase + Mapbox keys
```

## Dev Commands

| Target | Command |
|--------|---------|
| Web (Next.js 14, App Router) | `pnpm --filter web dev` → http://localhost:3000 |
| Mobile (Expo + React Native) | `pnpm --filter mobile start` → scan QR with Expo Go |
| Full pipeline (lint/typecheck/test/build) | `pnpm turbo lint typecheck test build` |
| Format all files | `pnpm format` |

## Test

| Scope | Command |
|-------|---------|
| Shared package (vitest) | `pnpm --filter @bitemap/shared test` |
| All workspaces | `pnpm turbo test` |

## Lint

```bash
pnpm turbo lint
pnpm turbo typecheck
```

## Structure

```
/
├── apps/
│   ├── mobile/      Expo + React Native (iOS/Android)
│   └── web/         Next.js 14 App Router
├── packages/
│   ├── shared/      Zod schemas, types, cross-platform helpers
│   └── ui/          Cross-platform design-system primitives
├── supabase/        (Phase 1+) migrations, Edge Functions, seed data
├── docs/            specs, plans, UX research
└── .github/workflows/ci.yml
```

## Phases

See `docs/superpowers/plans/2026-04-20-bitemap-v1-phased-roadmap.md` for the full roadmap. Phase 0 (this scaffold) → 0.5 design system → 1 schema/RLS → … → 11 hardening + launch.

## License

TBD (not yet chosen — will be permissive open-source for v1).
