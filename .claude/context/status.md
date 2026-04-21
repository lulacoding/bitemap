# BiteMap — Status & Roadmap

**Current Date:** Apr 21, 2026
**Current Phase:** **Phase 11 — Hardening & UX polish** (core analytics + legal + DB rate limit + map/report events landed; **gap injects 11.4 / 11.11–11.15 + social analytics events** still open)
**Primary Blocker:** a11y automation + manual device smoke; large gap injects (onboarding video, marine hazard layer, offline tiles, regulatory cron); external pen-test for v1.0.0
**Launch Target:** v1.0.0 — blocked on **Phase 11 completion** + external pen-test

---

## Phase Progress

| Phase | Description | Tag | Status |
|-------|-------------|-----|--------|
| 0 | Foundation (monorepo scaffold, CI) | v0.0.0-foundation | DONE |
| 0.5 | Design system (tokens, 10 primitives, a11y) | v0.5.0-design-system | DONE |
| 1 | Supabase schema, RLS, pgTAP, TS types | v0.6.0-schema | DONE |
| 2 | Auth (web + mobile, Google OAuth) | v0.7.0-auth | DONE |
| 3 | Species catalogue (seed, Zod, queries, screens) | v0.8.0-species | DONE |
| 4 | Map read-only (Mapbox, pins, bottom sheet) | v0.9.0-map | DONE |
| 5 | Catch reporting (core) | v0.10.0-catch | DONE |
| 5a | Catch reporting extras (offline queue, photo upload, Edge Function) | v0.10.1-catch-extras | DEFERRED |
| 6 | Weather + tide (Open-Meteo) + pressure trend + swell + solunar feed times | v0.11.0-weather | DONE |
| 7 | Filters + heatmap + state-aware regs + marine parks | v0.12.0-filters | DONE |
| 7.5 | POI layer: boat ramps, bait shops, fuel, jetties + tide thresholds | v0.12.5-pois | DONE |
| 8 | Profiles + bag-limit counter + analytics (core) | v0.13.0-profiles | DONE |
| 9 | Social core (likes, comments, follows, feed) | v0.14.0-social | DONE |
| 10 | Leaderboard core | v0.15.0-leaderboard | DONE |
| 10.5 | Citizen Science (optional — criteria-gated) | v0.15.25-citizen-science | OPTIONAL |
| 11 | Hardening & UX polish + onboarding videos + shark alerts + offline tiles | v0.15.5-hardening | **IN PROGRESS** — Sentry + EAS + Vercel live; **PostHog + legal + catch rate limit (DB) + profile analytics toggle** in repo; Playwright a11y / gap injects / social product events still open |
| **12** | **Production data integrity audit (no mocks, real data everywhere)** | **v0.16.0-data-audit** | **DONE (core sweep) — device walkthrough still pending** |
| **13** | **Security hardening (cybersecurity audit + pen-test)** | **v0.17.0-security** | **DONE (technical core); external pen-test pending** |
| 14 | v1.0.0-rc1 launch candidate | v1.0.0-rc1 | DONE |
| 15 | v1.0.0 launch | v1.0.0 | **BLOCKED on Phase 11 finish + external pen-test** |

---

## Deployed environments

| Surface | URL / notes |
|---------|-------------|
| **Web (Vercel production)** | https://bitemap-joz2xyiia-lulacodings-projects.vercel.app |
| Supabase Auth | Add the Vercel origin to **Site URL** (if primary) and **Redirect URLs** in the hosted project dashboard. |
| Mapbox token URL allowlist | Include `https://bitemap-joz2xyiia-lulacodings-projects.vercel.app` (no `*` wildcards). |

---

## Open Bugs (from S4 Thermaliq-style validation)

None yet — no device testing done.

## Known Risks

- Mapbox: keep **URL restrictions** aligned with **production** (`https://bitemap-joz2xyiia-lulacodings-projects.vercel.app`) + **localhost**; separate token for native if Referer-less requests break maps
- Hosted Supabase in use for dogfooding — rotate anon key if leaked; RLS remains authoritative
- E2E tests (Detox/Playwright) still **Phase 11** deliverables
- Storybook install deferred to Phase 11
- **Phase 5 deferred to v0.10.1-catch-extras:** offline queue (AsyncStorage + NetInfo), photo upload (expo-image-picker + Storage).
  Server-side privacy snap is now formally scheduled as Task 13.2 in Phase 13 Security.
- **Phase 6 deferred to v0.11.1-enrichment-apis:** BOM marine warnings overlay,
  suncalc-based lunar ephemeris for precise moonrise/moonset solunar times.
- **Phases 12–13 (data audit + security) are DONE in-repo**; ongoing: device walkthrough (12), external pen-test sign-off (13).

---

## Competitor-Gap Backlog

Deep competitor research (Apr 2026) identified 20 gaps vs. Fishbrain, ANGLR, FishTrack,
iNaturalist, eBird, AllTrails, OnX, FishVerify, etc. All enhancements are layered on top
of the core phase plans and mapped into the phase where they belong.

- **Full analysis:** `docs/superpowers/design/bitemap-competitor-gap-analysis.md`
- **Prioritized actionable backlog:** `docs/superpowers/plans/2026-04-20-bitemap-competitor-gap-backlog.md`

When starting a phase, open BOTH its core phase plan AND the matching "Inject into Phase N"
section of the backlog so competitor-parity items ship in the same release tag.

High-priority gaps (earliest injection points):
- Barometric pressure trend card + swell forecast → Phase 6
- State-aware regulations + marine-park overlay → Phase 7
- Boat ramp + bait shop POI layer w/ ratings → new Phase 7.5 (promoted from post-v1)
- Bag-limit counter + CSV export + condition-correlation cards → Phase 8
- Live trip GPS broadcast + DMs + verified-guide peer review → Phase 9
- Rare-catch alerts + expert-ID verification + Claude Vision confidence UX → Phase 10
