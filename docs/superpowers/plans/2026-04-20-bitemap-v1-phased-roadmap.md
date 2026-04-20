# BiteMap v1 — Phased Development Roadmap

> **For agentic workers:** This is a **master roadmap**. Each phase below is a self-contained, testable milestone. Every phase has its own detailed TDD plan in `docs/superpowers/plans/2026-04-20-bitemap-phase-NN-*.md`. Execute phases in order — later phases assume earlier ones are done, tested, and merged.

**Goal:** Ship BiteMap v1 (mobile-first, free, crowdsourced fishing reports) for Port Phillip Bay, with web parity and an offline-capable reporting loop.

**Architecture:** Turborepo monorepo — Expo mobile app + Next.js 14 web app + shared packages, backed by Supabase (Postgres + Auth + Realtime + Storage + Edge Functions). Mapbox for maps, BOM + WorldTides for conditions.

**Tech Stack:** TypeScript, Expo SDK 52+, Next.js 14 (App Router), NativeWind, Tailwind, Supabase JS v2, Mapbox GL JS + Mapbox React Native SDK, Zod, React Query, Jest, Playwright, Detox (mobile E2E).

**Spec:** `docs/superpowers/specs/2026-04-20-bitemap-design.md`
**UX Research + Design System:** `docs/superpowers/design/bitemap-ux-research.md` (Stitch project `7130908085017726434`, design-system asset `4590577941356041509`)

---

## How to Use This Roadmap

1. **Pick the next unstarted phase.**
2. **Invoke `superpowers:writing-plans`** with the phase's scope/verification as input to generate a TDD step-by-step plan.
3. **Execute that plan** (via `superpowers:subagent-driven-development` or `superpowers:executing-plans`).
4. **Run the phase's Acceptance Tests.** Every test must pass before proceeding.
5. **Commit + merge** — each phase ends on a green main.
6. **Move to next phase.**

Each phase is **independently shippable** — if you stop after any phase, you have working (if incomplete) software.

---

## Phase Index

| # | Phase | Detailed plan file |
|---|-------|--------------------|
| 0 | Foundation | `2026-04-20-bitemap-phase-00-foundation.md` |
| 0.5 | UX/UI Design System | `2026-04-20-bitemap-phase-00-5-design-system.md` |
| 1 | Schema + RLS | `2026-04-20-bitemap-phase-01-schema-rls.md` |
| 2 | Auth | `2026-04-20-bitemap-phase-02-auth.md` |
| 3 | Species DB | `2026-04-20-bitemap-phase-03-species.md` |
| 4 | Map (read-only) | `2026-04-20-bitemap-phase-04-map-readonly.md` |
| 5 | Catch reporting + offline | `2026-04-20-bitemap-phase-05-catch-reporting.md` |
| 6 | Weather + tide enrichment | `2026-04-20-bitemap-phase-06-weather-tide.md` |
| 7 | Filters + heatmap + decay | `2026-04-20-bitemap-phase-07-filters-heatmap.md` |
| 8 | Profiles | `2026-04-20-bitemap-phase-08-profiles.md` |
| 9 | Social | `2026-04-20-bitemap-phase-09-social.md` |
| 10 | Leaderboard | `2026-04-20-bitemap-phase-10-leaderboard.md` |
| 11 | Hardening + launch | `2026-04-20-bitemap-phase-11-hardening.md` |

---

## Phase 0 — Monorepo Foundation

**Why first:** Nothing else can be built without the workspace, tooling, and CI being green.

**Scope:**
- `pnpm` + Turborepo workspace init
- Apps: `apps/mobile` (Expo blank TS), `apps/web` (Next.js 14 App Router TS)
- Packages: `packages/shared` (TS types, utils, Zod schemas), `packages/ui` (placeholder components)
- Root config: `.editorconfig`, `.prettierrc`, `eslint` (flat config), `tsconfig.base.json`
- Turbo pipeline: `build`, `lint`, `typecheck`, `test`
- GitHub Actions CI: runs `turbo lint typecheck test build` on PR
- `.env.example` committed, `.env.local` gitignored
- README: setup, dev commands

**Acceptance Tests:**
- [ ] `pnpm install` completes in clean clone
- [ ] `pnpm turbo lint` passes with zero warnings
- [ ] `pnpm turbo typecheck` passes
- [ ] `pnpm turbo test` passes (placeholder tests)
- [ ] `pnpm --filter web dev` serves "Hello BiteMap" at http://localhost:3000
- [ ] `pnpm --filter mobile start` launches Expo dev server; scanning QR loads "Hello BiteMap"
- [ ] CI passes on a dummy PR

**Verification:** Clone the repo on a clean machine, follow README, everything works.

---

## Phase 0.5 — UX/UI Research + Design System Package

**Why next:** Research is done (`docs/superpowers/design/bitemap-ux-research.md`). Ship the `packages/ui` primitives + Storybook before any feature UI, so every screen inherits the system.

**Scope:**
- `packages/ui/` with design tokens (colours, typography, spacing, radius) exported as TS constants + Tailwind preset (Tailwind + NativeWind both consume the preset)
- Primitive components: `Button`, `Chip`, `Card`, `Sheet`, `Input`, `SegmentedControl`, `Avatar`, `Pin`, `BannerOffline`, `TabBar`, `BottomSheet`
- Each primitive works on **both React Native (mobile) and React DOM (web)** via `react-native-web` pattern or parallel `.native.tsx` / `.web.tsx` files
- Storybook (web) — one story per primitive × each variant (default, hover, disabled, loading)
- Visual regression: Chromatic (or Loki) snapshot tests on Storybook
- Dark mode parity — every primitive works in both modes
- Accessibility: `jest-axe` over Storybook, zero violations
- Import Stitch-generated assets where relevant (map pin SVGs, empty-state illustrations)

**Acceptance Tests:**
- [ ] Unit: `Button` renders "Post Catch" with seafoam teal background in light mode, correct contrast
- [ ] Unit: `Pin` at alpha=30% renders correctly (48h old encoding)
- [ ] Unit: `SegmentedControl` switches value on tap; fires `onChange`
- [ ] Storybook lints clean; Chromatic baseline snapshot committed
- [ ] `jest-axe` reports zero a11y violations across all stories
- [ ] Mobile smoke: render a screen with 10 primitives stacked — looks visually correct on iOS + Android

**Verification:** Open Storybook, walk through every primitive × variant × light/dark. Compare to Stitch reference screens (`bitemap-ux-research.md` § 4).

---

## Phase 1 — Supabase Project + Core Schema + RLS

**Why next:** All features depend on the database. Get schema + auth policies locked down before building features on top.

**Scope:**
- Supabase project provisioned (local via `supabase init` + `supabase start`, and a staging cloud project)
- Migrations for: `profiles`, `species`, `catches`, `saved_spots`, `catch_likes`, `catch_comments`, `follows` (core tables per spec)
- Row Level Security (RLS) enabled on every table
- RLS policies:
  - `profiles`: public read, owner write
  - `species`: public read, admin write
  - `catches`: public read of non-hidden, non-expired rows; owner insert/update/delete
  - `catch_likes`, `catch_comments`: public read, authenticated insert, owner delete
  - `follows`: public read, authenticated insert/delete own
  - `saved_spots`: owner-only read/write
- DB trigger: on `profiles.insert` from `auth.users` signup
- DB trigger: `catches.expires_at` defaults to `created_at + interval '48 hours'`
- Generated TS types committed to `packages/shared/src/types/database.ts`

**Acceptance Tests:**
- [ ] `supabase db reset` applies all migrations cleanly
- [ ] `pgTAP` tests verify: anon can SELECT from `catches` WHERE NOT is_hidden AND expires_at > now(); anon cannot INSERT
- [ ] `pgTAP` tests verify: authenticated user can INSERT own catch; cannot UPDATE someone else's
- [ ] `pgTAP` test: deleting `auth.users` row cascades / sets null on `profiles` per design
- [ ] Generated types import cleanly in `packages/shared`
- [ ] `supabase gen types typescript --local` diff is empty (types in sync)

**Verification:** Run `supabase db reset`, run pgTAP suite — all green.

---

## Phase 2 — Auth Flows (Mobile + Web)

**Why next:** Most features gate on `is authenticated`. Ship signup/login before building feature UIs.

**Scope:**
- Supabase client wrappers in `packages/shared/src/supabase/{client.ts,server.ts}`
- Mobile:
  - Expo Router stack: `/(auth)/sign-in`, `/(auth)/sign-up`, `/(app)/*`
  - Email/password auth
  - Google OAuth via `expo-auth-session`
  - Session persistence via `expo-secure-store`
  - Auth guard: unauthenticated users routed to `/(auth)/sign-in` for protected routes
- Web:
  - Next.js routes: `/sign-in`, `/sign-up`
  - Supabase SSR auth helpers (`@supabase/ssr`)
  - Middleware for protected routes
- `profiles` row auto-created on signup (DB trigger from Phase 1)
- Sign-out on both platforms

**Acceptance Tests:**
- [ ] Mobile: sign up with email → account created → profile row exists → redirected to home
- [ ] Mobile: kill and reopen app → still signed in
- [ ] Mobile: sign in with Google → account created on first use
- [ ] Web: sign up/sign in/sign out flows identical, including middleware redirect
- [ ] Unit: `supabaseClient` singleton not re-instantiated across hot reloads
- [ ] Detox E2E (mobile): sign-up → home
- [ ] Playwright E2E (web): sign-up → home

**Verification:** Manually sign up on each platform; inspect Supabase dashboard — one `auth.users` + one `profiles` row created per signup.

---

## Phase 3 — Species Database + Seed Data

**Why next:** Catch reporting requires species to pick from. Ship a browsable species list with regulations first.

**Scope:**
- Seed script: ~100 curated AU species → `supabase/seed.sql` (common/scientific name, category, min_legal_size_mm, bag_limit, closed_season, state, image_url, description)
- Source images: public-domain or CC-BY photos; stored in Supabase Storage bucket `species-images`
- Shared data layer: `packages/shared/src/queries/species.ts` (list, search, getById)
- Mobile: Species index screen (searchable list with thumbnail, name, category chip)
- Mobile: Species detail screen (photo, description, legal size, bag limit, closed season, state)
- Web: parity screens at `/species` and `/species/[id]`
- Search filter by name (case-insensitive, includes scientific name)

**Acceptance Tests:**
- [ ] Unit: `searchSpecies("snapper")` returns snapper rows
- [ ] Unit: `searchSpecies("Chrysophrys")` (scientific) returns snapper
- [ ] Unit: `getSpeciesById(nonexistent)` returns null (not throws)
- [ ] Mobile: species list renders 100 rows, search narrows in < 300ms on device
- [ ] Mobile: detail screen shows correct VIC bag limit for snapper (hard-coded assertion in E2E)
- [ ] Web: parity — same assertions via Playwright

**Verification:** Matches spec verification item 6 ("tap a species, verify correct legal size + bag limit displays for VIC").

---

## Phase 4 — Map (Read-Only, No Reports Yet)

**Why next:** Build the map surface before you have catches to display. Isolates Mapbox-integration bugs from data bugs.

**Scope:**
- Mapbox account, access token in `.env.local`, `EXPO_PUBLIC_MAPBOX_TOKEN` / `NEXT_PUBLIC_MAPBOX_TOKEN`
- Mobile: `@rnmapbox/maps` integration, home screen is a fullscreen map centred on Port Phillip Bay (lat -38.10, lng 144.85, zoom 9)
- Web: Mapbox GL JS, parity home screen
- User-location button: requests permission, centres map on user
- Map style: light + dark variants following system theme
- Render **mock** pins (hard-coded GeoJSON of 5 fake catches) to prove the pin-rendering pipeline
- Pin → bottom-sheet preview (mobile) / popup (web) showing species name + time

**Acceptance Tests:**
- [ ] Mobile: map renders with no network between loads (tiles cached)
- [ ] Mobile: tapping a mock pin opens bottom sheet with correct species
- [ ] Mobile: location button prompts permission once, then centres on GPS
- [ ] Web: parity
- [ ] Detox: map renders in < 3s from cold launch on mid-tier device
- [ ] Unit: `mapboxStyleForTheme("dark")` returns dark-style URI

**Verification:** Manual: open map, it's fast, pins click, no JS errors in console.

---

## Phase 5 — Catch Reporting (Offline-Capable Core Loop)

**Why next:** This is *the* feature. Ship it next so the app is usable even before weather/tide/social polish.

**Scope:**
- Zod schema in `packages/shared/src/schemas/catch.ts`
- Mobile `/report` screen, 3-tap flow:
  - Step 1: species picker (reuse Phase 3 list, with recent-species shortcut)
  - Step 2: quantity, size_mm, bait, technique
  - Step 3: GPS captured automatically; privacy toggle (Exact / Area / Hidden); submit
- Privacy handling:
  - **Exact:** stored lat/lng unchanged
  - **Area:** snap lat/lng to ~1 km grid cell centre on client AND on DB-level API to ensure the server enforces it (no raw GPS reaches DB)
  - **Hidden:** `is_hidden = true`; excluded from map SELECTs via RLS/query
- Optional photo upload to `catch-photos` Supabase Storage bucket (gated by auth)
- **Offline queue:**
  - Mobile uses `@tanstack/react-query` with a persistent `AsyncStorage` mutation queue
  - Reports submitted offline are queued locally; retry on network regain
  - Visible "queued" badge on pending reports in user's logbook
- Map displays the user's newly-posted catch within 5 seconds (Supabase Realtime channel subscription)
- Web: parity form at `/report` (no offline queue on web — that's mobile-only)

**Acceptance Tests:**
- [ ] Unit: `applyPrivacy("area", {lat, lng})` snaps coordinates correctly
- [ ] Unit: `applyPrivacy("hidden", ...)` sets `is_hidden = true`
- [ ] Unit: Zod rejects size_mm < 0, quantity < 1
- [ ] Integration (MSW/Supabase test harness): submit catch → appears in `catches` table with correct `expires_at`
- [ ] Detox E2E: complete 3-tap flow → pin appears on map within 5s
- [ ] Detox E2E (offline): airplane mode → submit report → re-enable network → report syncs automatically (matches spec verification item 5)
- [ ] Integration: submit with privacy="area" → assert via raw SQL that stored lat/lng ≠ device GPS (snapped) (matches spec verification item 2)
- [ ] Integration: submit with `expires_at = now() + 1 minute` → after 61s, row excluded from `SELECT` used by map query (matches spec verification item 3)

**Verification:** Covers spec verification items 1, 2, 3, 4 (anon map), 5 (offline sync).

---

## Phase 6 — Weather + Tide Auto-Attach

**Why next:** Reports are functional without conditions, but conditions are what makes a BiteMap report valuable. Ship after the core loop is proven.

**Scope:**
- Supabase Edge Function `enrich-catch`:
  - Input: `{ lat, lng, created_at }`
  - Fetches BOM nearest-station weather snapshot (wind, temp, pressure, cloud, rainfall)
  - Fetches WorldTides tide state (height, direction incoming/outgoing) for nearest tidal station
  - Computes moon phase + solunar rating locally (offline algorithm, no API)
  - Returns `{ weather_json, tide_json, moon_phase, solunar_rating }`
  - Cache key: `${roundedLat},${roundedLng},${hour}` in Supabase Storage/KV to avoid duplicate API calls
- Catch submission flow calls `enrich-catch` after insert; patches the row
- Fallback: if enrichment fails, catch is still saved; enrichment can be retried
- Standalone tide-chart screen: user → "tide" tab → 7-day tide chart for nearest station

**Acceptance Tests:**
- [ ] Unit: `moonPhase(Date)` returns correct phase for known dates (new moon, full moon)
- [ ] Unit: `solunarRating(...)` returns 0-4 stars for documented test cases
- [ ] Integration: submit catch → `weather_json` populated within 10s
- [ ] Integration (cache): submit two catches 5 min apart same location → BOM API called once
- [ ] Integration: BOM API failure → catch still persists, `weather_json` is null, retry flag set
- [ ] Mobile: tide chart renders 7 days of data, labelled high/low (matches spec verification item 7)

**Verification:** Open Supabase dashboard, see populated `weather_json` + `tide_json` on fresh catches.

---

## Phase 7 — Map Filters + Heatmap Toggle + Decay

**Why next:** Map is read-only with pins; add the UX polish now that real data flows.

**Scope:**
- Map-home filter bar: species multi-select, bait/technique chips, freshness (6h / 24h / 48h)
- Heatmap toggle (pins ↔ heatmap layer). Mapbox's `heatmap-layer` weighted by freshness
- Decay: map query `SELECT * FROM catches WHERE expires_at > now() AND is_hidden = false` — pins auto-disappear at 48h (already covered by schema)
- Realtime: Supabase Realtime subscription on `catches` → map state updates live when others post
- Layers toggle: Tackle shop / POI layer (empty for now, wired but no data — POIs are Phase 2+)

**Acceptance Tests:**
- [ ] Unit: filter reducer — applying species filter narrows pin list
- [ ] Integration: post catch on device A, device B sees pin within 5s (Realtime)
- [ ] E2E: set freshness=6h → older pins removed from map
- [ ] Visual: heatmap toggle changes render, no errors in RN/web console

**Verification:** Two devices side-by-side: post on one, see on the other within 5s.

---

## Phase 8 — Profiles

**Why next:** Social features (likes/comments/follows) depend on profile pages existing.

**Scope:**
- Mobile `/profile/[id]` screen:
  - Public: username, avatar, bio, total catches, species-caught count, followers/following counts
  - Own: edit button → edit username, bio, avatar
  - Private logbook tab: own full catch history (visible only to self)
- Avatar upload → Supabase Storage `avatars` bucket (500 KB limit, auto-resize to 256x256)
- Username uniqueness enforced via DB unique constraint + friendly error UI
- Web parity at `/profile/[username]`
- Profile routes deep-link from map pins (tap catch → tap user avatar → profile)

**Acceptance Tests:**
- [ ] Integration: update username → constraint rejects duplicate
- [ ] Integration: upload avatar → `profiles.avatar_url` updated, old avatar deleted from Storage
- [ ] E2E: tap catch pin → tap user → profile opens
- [ ] Unit: public-profile query excludes `email`, `saved_spots`

---

## Phase 9 — Social: Likes + Comments + Follows

**Why next:** Builds on profiles; unlocks "follow users" feature for Phase 10 feed.

**Scope:**
- Catch detail screen: likes row + comments thread
- Optimistic-updates for like/unlike
- Comment: single-level threading (no nested replies in v1)
- Follow/unfollow button on profiles
- Activity feed (secondary tab): recent catches from followed users + nearby (within 50 km of user's last known location)
- Denormalised counts (`catches.like_count`, `catches.comment_count`) via DB triggers for fast rendering

**Acceptance Tests:**
- [ ] Unit: optimistic like mutation reverts on error
- [ ] Integration: like increments `like_count`; unlike decrements
- [ ] Integration: follow user → activity feed includes their next catch
- [ ] E2E: comment on a catch → comment visible to other users in real time

---

## Phase 10 — Basic Leaderboard

**Why next:** Low complexity given all the data now exists; last visible feature before hardening.

**Scope:**
- `/leaderboard` screen with three toggles: **by species**, **by area** (Port Phillip Bay only for v1), **by season** (current month)
- Ranks by catch count per user (tiebreak: total size_mm)
- Cached via Supabase Edge Function materialised view, refreshed every 10 minutes
- Empty state: "Be the first — report a catch!"

**Acceptance Tests:**
- [ ] Unit: ranking function handles tie correctly
- [ ] Integration: posting a catch updates the leaderboard on next refresh
- [ ] E2E: switch tabs, correct ordering renders

---

## Phase 11 — Hardening, Analytics, Launch Prep

**Why last:** Everything works — now make it ship-ready.

**Scope:**
- Error monitoring: Sentry on mobile + web
- Analytics: PostHog (or Supabase analytics) — track key events (sign_up, report_posted, map_opened)
- Crash-free rate measurable from dashboard
- Rate limiting on Edge Functions (Supabase `rate_limit` helper, e.g., 60 reports/user/hour)
- Accessibility audit: mobile screens pass iOS/Android screen-reader walk-through; web passes axe with zero violations
- Privacy policy + terms of service published at `/legal/privacy` and `/legal/terms`
- App Store + Play Store listings drafted (screenshots, description, keywords) — submission pending
- Web deployed to Vercel production; mobile built via EAS + TestFlight / Play internal testing track

**Acceptance Tests:**
- [ ] Spec verification items 1-7 all pass (run the full list from `specs/2026-04-20-bitemap-design.md`)
- [ ] Sentry reports zero unhandled errors on a 30-minute smoke test across all screens
- [ ] Rate-limit test: 61 reports in one minute — 61st rejected with clear UX message
- [ ] Accessibility: VoiceOver + TalkBack can complete the 3-tap report flow
- [ ] TestFlight build installable and passes a manual run of the catch flow

**Verification:** Run all 7 items from the spec's Verification Plan back-to-back on a TestFlight build. Tag `v1.0.0`. Ship.

---

## Phases Deferred to v2+ (Not in v1)

These are explicitly **out of scope** for v1 and should not be started during Phase 0-11:

- Gamification (badges, Pokédex, streaks, tournaments)
- AI forecast (Claude-powered)
- Shareable catch cards (Satori)
- Verified guide profiles
- Tackle shop POI layer (shell is wired in Phase 7 but no data/data-entry)
- Push notifications
- Admin dashboard
- AI photo fish-ID

Each of these warrants its own spec + plan when prioritised.

---

## Phase Dependency Graph

```
Phase 0 (foundation)
   └── Phase 1 (schema + RLS)
         └── Phase 2 (auth)
               ├── Phase 3 (species)
               │     └── Phase 5 (catch reporting) ◄── requires Phase 4 (map) also
               ├── Phase 4 (map read-only)
               └── Phase 8 (profiles)
                     └── Phase 9 (social)
                           └── Phase 10 (leaderboard)
Phase 5 ── Phase 6 (weather/tide) ── Phase 7 (filters/heatmap/decay)
                                                     │
                                           Phase 11 (hardening) ◄── ALL PREVIOUS
```

Phases 3 and 4 can be parallelised by two workers after Phase 2 ships.

---

## Self-Review Checklist

- [x] Every v1 MVP item from the spec maps to a phase (1: map/report → 4,5,7; 2: accounts → 2,8; 3: species → 3; 4: tide/weather → 6; 5: privacy → 5; 6: likes/comments → 9; 7: leaderboard → 10; 8: offline queue → 5)
- [x] Every spec verification item (1-7) appears as an acceptance test in some phase
- [x] No phase depends on a later phase
- [x] Each phase ends on a green, shippable build
- [x] No placeholders (`TBD`, `TODO`) in the roadmap

---

## Next Step

Pick Phase 0 and invoke:

```
/superpowers:writing-plans
Write a detailed TDD implementation plan for Phase 0 of the BiteMap roadmap.
Roadmap: docs/superpowers/plans/2026-04-20-bitemap-v1-phased-roadmap.md
Spec: docs/superpowers/specs/2026-04-20-bitemap-design.md
Save to: docs/superpowers/plans/2026-04-20-bitemap-phase-00-foundation.md
```

Repeat for each subsequent phase when its predecessors are green.
