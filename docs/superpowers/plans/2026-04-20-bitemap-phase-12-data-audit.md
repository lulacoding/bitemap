# BiteMap Phase 12 — Production Data Integrity Audit

**Purpose:** Guarantee that zero mock, placeholder, hardcoded-for-dev, or stub data ships to production. Every byte the user sees must be real. Every code path must be exercised end-to-end. v1.0 is blocked on this phase passing.

**Tag:** `v0.16.0-data-audit`

**Blocking:** Phase 13 (Security) and v1.0.0 launch cannot start until every item here passes.

---

## Why this phase exists

During phases 4-7 we kept `mockCatches` as a fallback so the map looked populated before real users existed. That's fine for development, *fatal* for production: a new user in a fresh region sees fake pins that erode trust immediately. This phase is the one-time sweep that removes all such shortcuts and verifies every screen has real-data coverage.

Rule enforced by this phase and documented in `.claude/context/decisions.md`: **no synthetic data shown to users, ever**.

---

## Task 12.1 — Mock / placeholder / TODO sweep

- [ ] **Ripgrep audit** — must return zero hits across `apps/` and `packages/`:
  ```bash
  rg -i 'mock|placeholder|lorem|TODO|FIXME|XXX|@ts-ignore|@ts-expect-error' \
     apps/ packages/ \
     --glob '!*.test.ts' --glob '!*.test.tsx' --glob '!node_modules/**'
  ```
- [ ] Remove `mockCatches` fallback from `apps/mobile/src/map/MapView.tsx` and `apps/web/src/map/MapView.tsx`. Empty DB = empty map with a helpful "No catches in this area — be the first" empty state. Pin-render code must accept 0 catches cleanly.
- [ ] Remove `apps/web/src/app/page.tsx` design-system showcase content or move it behind a `/_internal/showcase` route that 404s for unauthenticated users. Homepage should redirect to `/(app)/map` when authenticated, `/sign-in` when not.
- [ ] Remove any `console.log` / `console.debug` not wrapped in `if (__DEV__)` or equivalent.
- [ ] Delete dead code: unused imports, unreachable branches, commented-out blocks ≥3 lines.

## Task 12.2 — Real-data coverage matrix

Walk every user-reachable screen; confirm it hits a real source (Supabase, Open-Meteo, or deterministic math) and never falls back to fake data. Fill this table:

| Screen | Data sources | Empty state | Error state | Loading state | Offline state |
|--------|--------------|-------------|-------------|---------------|---------------|
| /(app)/map | `listCatches`, `listMarineParks`, realtime sub | ✅ | ✅ | ✅ | ✅ |
| /(app)/tide | `fetchMarine`, `fetchCurrentWeather`, `fetchPressureHistory`, solunar math | ✅ | ✅ | ✅ | ✅ |
| /(app)/species | `listSpecies`, `searchSpecies` | ✅ | ✅ | ✅ | ✅ |
| /(app)/species/[id] | `getSpeciesById`, `getRegulationsForSpecies` | ✅ | ✅ | ✅ | ✅ |
| /(app)/report | `getSpeciesById`, `listMarineParks`, `createCatch` | ✅ | ✅ | ✅ | ✅ |
| /(auth)/sign-in | Supabase auth | n/a | ✅ | ✅ | ✅ |
| /(auth)/sign-up | Supabase auth | n/a | ✅ | ✅ | ✅ |

- [ ] Fill every cell. An unchecked cell = blocker.
- [ ] Every empty state needs a CTA that leads somewhere useful.
- [ ] Every error state must render (a) what went wrong in plain English, (b) a retry button, (c) a fallback nav option.

## Task 12.3 — Seed & fixture review

- [ ] Species seed: verify all 30 VIC species match the current VFA recreational fishing guide (size + bag). Flag any stale entries for the Dec annual refresh cron.
- [ ] Marine parks seed: confirm all 6 polygons are inside the correct gazetted boundaries (will be simplified bounding boxes — that's OK; document limitation).
- [ ] Species regulations seed: confirm NSW deltas are correct per NSW DPI current rules (bream 250mm/10, flathead 270mm/10, snapper 300mm/10). Add source URL to every row.
- [ ] Delete any dev-only seed data (fake accounts, fake catches) from `supabase/seed.sql`.

## Task 12.4 — Environment variable audit

- [ ] `.env.example` lists every variable every app consumes, grouped by feature.
- [ ] New CI step: startup sanity check. If any required var is missing, fail build with a clear error naming the var.
- [ ] No hardcoded URLs anywhere — `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_MAPBOX_TOKEN`, etc.
- [ ] No hardcoded keys anywhere — `git diff origin/main -- ':(exclude).env.example'` must not contain any string matching the anon-key pattern `eyJ[A-Za-z0-9_-]{20,}` outside tests.
- [ ] Document which vars are required for dev vs prod in `docs/deployment.md` (new file in this phase).

## Task 12.5 — Query hygiene

- [ ] Every Supabase query uses `@bitemap/shared/queries/*` helpers. No `.from('catches')` inline in UI code.
- [ ] Every query has: `queryKey`, `queryFn`, `staleTime`, and where applicable `refetchInterval`.
- [ ] Every mutation has: `onSuccess` (invalidation), `onError` (user-visible message).
- [ ] No query leaks — every screen that subscribes to realtime must `removeChannel` on unmount.
- [ ] Pagination: lists that could grow beyond 200 items (catches, comments) use `range()` or cursor pagination.
- [ ] 48h catch decay verified end-to-end: insert with `expires_at = now() + 1 minute`, poll after 61s, row disappears from `listCatches`.

## Task 12.6 — Image + file asset sweep

- [ ] Every image ref is either a static import from `packages/ui/assets/` or a Supabase Storage URL. No raw CDN links.
- [ ] Every app icon / splash / favicon in place for iOS, Android, and web.
- [ ] No `.png` / `.jpg` larger than 300KB in `apps/mobile/assets/`. Optimise with ImageOptim.

## Task 12.7 — Analytics & telemetry

- [ ] Add minimal analytics (PostHog or Plausible, free tier) — opt-in via profile setting, default OFF for Phase 12.
- [ ] Crash reporter wired (Sentry free tier, 5k events/mo). Source maps uploaded on each release.
- [ ] No telemetry fires in dev mode — gate on `__DEV__ === false` + the opt-in flag.

## Task 12.8 — End-to-end device walkthrough

Two physical devices (or one device + web) required. Record findings as bugs in GitHub, block launch on P0/P1.

- [ ] iPhone + web: sign-up with new email, verify email flow, sign in, log a catch, see it on web, log out.
- [ ] Android + iPhone: two devices side-by-side — post catch on A, pin appears on B within 5s.
- [ ] Airplane mode: map still renders last-cached state + banner. Catches made while offline queue (deferred to v0.10.1 — document gap).
- [ ] Colour scheme: dark mode + light mode on every screen. No broken contrast, no invisible text.
- [ ] Accessibility: VoiceOver on iOS + TalkBack on Android for the core loop (open map, tap pin, read preview, log catch). Every interactive element announces.

## Task 12.9 — Test matrix

- [ ] All shared unit tests still green (target: ≥100 tests).
- [ ] pgTAP tests still green (target: ≥40 tests, up from 34 — add coverage for `species_regulations` and `marine_parks`).
- [ ] CI green on push to `main` and on every PR.
- [ ] Manual smoke test checklist committed as `docs/qa/smoke-test.md` — runs before every tag.

## Phase 12 Acceptance

- [ ] All `mockCatches` fallbacks removed; map renders cleanly with 0 pins.
- [ ] Ripgrep sweep for `mock|placeholder|TODO|FIXME` returns 0 hits outside test files.
- [ ] `.env.example` complete; missing vars fail CI.
- [ ] Every screen covered by the real-data matrix table.
- [ ] End-to-end device walkthrough passes without P0 bugs.
- [ ] Tag `v0.16.0-data-audit`.

**Only after this tag may Phase 13 (Security Hardening) begin.**
