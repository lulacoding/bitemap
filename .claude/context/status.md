# BiteMap — Status & Roadmap

**Current Date:** Apr 20, 2026
**Current Phase:** Phases 1-7.5 COMPLETE; Phase 8 (profiles) IN PROGRESS
**Primary Blocker:** Mapbox tokens needed to live-test map (EXPO_PUBLIC_MAPBOX_TOKEN, NEXT_PUBLIC_MAPBOX_TOKEN)
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
| 11 | Hardening & UX polish + onboarding videos + shark alerts + offline tiles | v0.15.5-hardening | DEFERRED (external infra) |
| **12** | **Production data integrity audit (no mocks, real data everywhere)** | **v0.16.0-data-audit** | **DONE (core sweep) — device walkthrough still pending** |
| **13** | **Security hardening (cybersecurity audit + pen-test)** | **v0.17.0-security** | **PENDING — blocks v1.0** |
| 14 | v1.0.0 launch | v1.0.0 | PENDING |

---

## Open Bugs (from S4 Thermaliq-style validation)

None yet — no device testing done.

## Known Risks

- Mapbox tokens not yet configured (need account + token)
- Supabase is local Docker only — hosted migration happens in Phase 11 hardening
- E2E tests (Detox/Playwright) deferred to Phase 11
- Storybook install deferred to Phase 11
- **Phase 5 deferred to v0.10.1-catch-extras:** offline queue (AsyncStorage + NetInfo), photo upload (expo-image-picker + Storage).
  Server-side privacy snap is now formally scheduled as Task 13.2 in Phase 13 Security.
- **Phase 6 deferred to v0.11.1-enrichment-apis:** BOM marine warnings overlay,
  suncalc-based lunar ephemeris for precise moonrise/moonset solunar times.
- **Phase 12 (data audit) is a HARD blocker before Phase 13.**
  Any mock data still rendered in production = v1.0 cannot tag.
- **Phase 13 (security) is a HARD blocker before v1.0.0.**
  Plan: `docs/superpowers/plans/2026-04-20-bitemap-phase-13-security.md`.
  No exceptions — pen-test pass required.

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
