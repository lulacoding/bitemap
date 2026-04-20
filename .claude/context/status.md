# BiteMap — Status & Roadmap

**Current Date:** Apr 20, 2026
**Current Phase:** Phase 3 COMPLETE; Phase 4 (map read-only) IN PROGRESS
**Primary Blocker:** Mapbox token setup (EXPO_PUBLIC_MAPBOX_TOKEN, NEXT_PUBLIC_MAPBOX_TOKEN)
**Launch Target:** v1.0.0 — TBD

---

## Phase Progress

| Phase | Description | Tag | Status |
|-------|-------------|-----|--------|
| 0 | Foundation (monorepo scaffold, CI) | v0.0.0-foundation | DONE |
| 0.5 | Design system (tokens, 10 primitives, a11y) | v0.5.0-design-system | DONE |
| 1 | Supabase schema, RLS, pgTAP, TS types | v0.6.0-schema | DONE |
| 2 | Auth (web + mobile, Google OAuth) | v0.7.0-auth | DONE |
| 3 | Species catalogue (seed, Zod, queries, screens) | v0.8.0-species | DONE |
| 4 | Map read-only (Mapbox, pins, bottom sheet) | v0.9.0-map | IN PROGRESS |
| 5 | Catch reporting + offline | v0.10.0-catch | PENDING |
| 6 | Weather + tide | v0.11.0-weather | PENDING |
| 7 | Filters + heatmap | v0.12.0-filters | PENDING |
| 8 | Profiles | v0.13.0-profiles | PENDING |
| 9 | Social | v0.14.0-social | PENDING |
| 10 | Leaderboard | v0.15.0-leaderboard | PENDING |
| 11 | Hardening + launch | v1.0.0 | PENDING |

---

## Open Bugs (from S4 Thermaliq-style validation)

None yet — no device testing done.

## Known Risks

- Mapbox tokens not yet configured (need account + token)
- Supabase is local Docker only — hosted migration deferred to Phase 11
- E2E tests (Detox/Playwright) deferred to Phase 11
- Storybook install deferred to Phase 11
