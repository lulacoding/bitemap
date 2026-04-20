# BiteMap — Competitor-Gap Backlog

**Date:** 2026-04-20 (updated 2026-04-20)
**Status:** Injects merged into individual phase plans. This doc is now the index, not the implementation spec.
**Reference:** Full research + sources in `docs/superpowers/design/bitemap-competitor-gap-analysis.md`.

---

## How this doc works now

As of 2026-04-20, every gap inject has been merged into its target phase plan. When you start a phase, you only need to open that phase's plan — the gap work is already in the Acceptance section.

This backlog remains as:
1. **A cross-phase index** so operators can see at a glance which gaps land where.
2. **A landing zone** for any new gaps discovered post-audit. Add them here first; then merge into a phase plan in the same commit.

---

## Merged status per phase

| Phase | Tag | Plan doc | Gap injects merged |
|-------|-----|----------|--------------------|
| 6 | v0.11.0-weather | 2026-04-20-bitemap-phase-06-weather-tide.md | Pressure trend, swell forecast, solunar feed times. BOM marine warnings deferred to v0.11.1-enrichment-apis. ✅ SHIPPED |
| 7 | v0.12.0-filters | 2026-04-20-bitemap-phase-07-filters-heatmap.md | State-aware regulation deltas, marine park boundary overlay. ✅ SHIPPED |
| 7.5 | v0.12.5-pois | 2026-04-20-bitemap-phase-07-5-poi-layer.md | Boat ramps + bait shops + fuel POI layer, per-ramp tide-height threshold, user-reported ramp status. NEW phase promoted from post-v1. 📋 planned |
| 8 | v0.13.0-profiles | 2026-04-20-bitemap-phase-08-profiles.md | Bag-limit counter, CSV export, analytics dashboard, PB context, correlation cards, photo backup. 📋 planned |
| 9 | v0.14.0-social | 2026-04-20-bitemap-phase-09-social.md | Live trip GPS broadcast, DMs + group chat, verified-guide peer review, reputation scores. 📋 planned |
| 10 | v0.15.0-leaderboard | 2026-04-20-bitemap-phase-10-leaderboard.md | Rare-catch alerts + rarity scoring, expert-ID verification, seasonal range maps, historical timelines, taxonomy, Claude Vision photo ID, tournament import, streak + XP. 📋 planned |
| 10.5 | v0.15.25-citizen-science | 2026-04-20-bitemap-phase-10-5-citizen-science.md | Seasonal breeding layer, research export endpoint, Indigenous knowledge partnership. OPTIONAL — criteria in the plan. 📋 planned |
| 11 | v0.15.5-hardening | 2026-04-20-bitemap-phase-11-hardening.md | Video onboarding, shark / marine-hazard layer, offline map tile download, regulatory annual refresh, free-forever audit. 📋 planned |
| 12 | v0.16.0-data-audit | 2026-04-20-bitemap-phase-12-data-audit.md | NEW phase — no gaps from this backlog; pre-launch blocker. 📋 planned |
| 13 | v0.17.0-security | 2026-04-20-bitemap-phase-13-security.md | NEW phase — no gaps from this backlog; pre-launch blocker. 📋 planned |
| — | v1.0.0 | (launch) | n/a |

---

## Post-v1.0 monetization shelf

These are NOT phases — they are opt-in revenue sources that never gate core features. Ship individually when organic demand appears, post-launch.

- **Merch shop** (Printful/Shopify dropship — hats/hoodies/towels linked from Pokédex milestones)
- **Tackle shop affiliate links** (5-10% commission, scoped to "Recommended" species-card section)
- **Fishing licence renewal deep-link** (no revenue, drives compliance + retention)
- **Guide-booking referral commission** (10-15% on Viator / GetYourGuide)
- **Charity partnerships** (monthly challenges tied to AMCS / Waterkeeper AU; Stripe Giving; 100% forwarded)
- **Bait + tackle brand sponsorship of chrome** (Powered by BOM / WorldTides / TackleCo — $5-20k/yr; never a feature gate)

---

## Cross-cutting rules (every phase)

These are enforced in every phase's acceptance checklist:

- **Accessibility audit.** Every new card/screen/button must hit WCAG AA + 44×44 pt tap targets + respect `prefers-reduced-motion`.
- **Free-forever audit.** At each phase tag, verify no core feature has drifted behind a paywall. Documented in the Phase 11 release checklist but run at every tag.
- **Regulatory-data annual refresh.** December cron to sync VFA + state body updates (job lives in Phase 11, runs forever).

---

## Backlog log (DONE)

- **Phase 6** shipped `v0.11.0-weather` 2026-04-20: pressure trend card, swell card, solunar feed-times. BOM warnings deferred.
- **Phase 7** shipped `v0.12.0-filters` 2026-04-20: state-aware regs (VIC + NSW seeded), marine park overlay (6 Port Phillip parks), red warning on catch report.

---

## How to add a new gap post-audit

1. Write the gap here under "Inbox" (new section below).
2. Decide the target phase; write the inject into that phase's plan doc.
3. Update the merged-status table above.
4. Commit both changes in a single PR.

### Inbox (new gaps not yet slotted)

_(empty)_
