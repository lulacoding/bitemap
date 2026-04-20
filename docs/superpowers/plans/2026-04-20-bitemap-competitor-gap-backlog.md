# BiteMap — Competitor-Gap Backlog

**Date:** 2026-04-20
**Purpose:** Actionable, prioritised backlog of features identified in the competitor-gap analysis. Maps each gap to a target phase in the 0→11 roadmap so the work gets picked up automatically as each phase begins.
**Reference:** Full research + sources in `docs/superpowers/design/bitemap-competitor-gap-analysis.md`.

---

## How to use this doc

- Every unchecked item below is a planned enhancement layered on top of the core phase plans in `docs/superpowers/plans/2026-04-20-bitemap-phase-*.md`.
- When starting a phase, open **both** the core phase plan *and* the "Inject into Phase N" section here.
- Tick items when shipped. Move "DONE" items to a footer log for historical visibility.
- If a gap's cost/effort no longer justifies the phase, bump it into a later phase rather than dropping silently.

---

## Phase 6 — Weather + Tide Enrichment (inject)

- [ ] **Barometric pressure trend card.** Show 12–24h trend (rising / falling / stable) + a glanceable "bite window" colour bar for the next 6h. Data already fetched from BOM during `enrich-catch`; surface in both (a) the tide detail screen and (b) a new home-screen floating card above pins.
  - Competitor reference: Fishbrain BiteTime™, Bite Signal, Fishero.
  - Risk: accuracy claims — ship with a "for reference" disclaimer.
  - Effort: S (data already fetched).

- [ ] **Swell / wave-height forecast card.** Height (m), period (s), direction, 7-day outlook. Covers Port Phillip Heads + offshore users. Fetch from BOM marine boundary layer or WorldTides swell endpoint.
  - Competitor reference: FishTrack, Windy, FishWeather.
  - Risk: BOM rate limit — add NOAA/GEBCO fallback.
  - Effort: M.

- [ ] **BOM marine warnings overlay.** Small-craft warnings, strong-current alerts rendered on the map as a subtle band/banner.
  - Competitor reference: Navionics, Windy, VicFishing.
  - Effort: S–M (static endpoint poll every 15 min).

- [ ] **Solunar minor/major feed-time callouts.** We already compute solunar rating; add the actual minor/major start/end times for today on the tide screen.
  - Competitor reference: eBird, Bite Signal, ANGLR Pro.
  - Effort: S.

---

## Phase 7 — Filters + Heatmap (inject)

- [ ] **State-aware regulation deltas.** Introduce `user.home_state` ('VIC' | 'NSW' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT') + species-regulation rows keyed by `(species_id, state)`. Inline cross-reference on species card ("Bream: 10 VIC / 8 NSW").
  - Competitor reference: onX Fish, Fish Washington, VicFishing.
  - Risk: annual refresh dance with VFA + each state body.
  - Effort: M.

- [ ] **Marine park boundary overlay.** Render take-free zones (Port Phillip Heads MNP, Point Cooke, Jawbone, Ricketts Point, etc.) as shaded polygons + a warning when a user attempts a catch report inside one.
  - Competitor reference: VicFishing, OnX Hunt (private land).
  - Data: VFA GIS dataset (shapefile → PostGIS).
  - Effort: M.

---

## Phase 7.5 — POI Layer (promoted from post-v1)

The research flagged this as High priority. Promote to its own mini-phase between 7 and 8.

- [ ] **Boat ramp + bait shop + fuel + jetty POI layer.** Toggleable on the map. Each POI: hours, user 1–5 star ratings, recent "ramp condition" reports (crowded / debris / low-tide closed). Initial data seed from VFA + Australian Boat Ramp Finder + community submissions.
  - Competitor reference: Australian Boat Ramp Finder, Fishbrain, Fishing Spots.
  - Effort: L.

- [ ] **Per-ramp tide-height thresholds.** "Williamstown accessible >1.2 m" — store as metadata on POI row; surface warning when user's current tide height is below threshold.
  - Effort: S (once POI table exists).

- [ ] **User-reported ramp status.** Quick-action buttons on a POI card: "Open / Crowded / Closed." Expire after 6h.
  - Effort: M.

---

## Phase 8 — Profiles (inject)

- [ ] **Bag-limit catch counter + auto-alerts.** Running counter per species for the active session. Amber at 80% of limit, red at 100%. Respects `user.home_state` from Phase 7. Includes clear disclaimer card: "Check VFA before releasing. BiteMap is a guide, not legal advice."
  - Competitor reference: FishVerify, Fish Washington, onX Fish.
  - Effort: M (relies on state-aware regs from Phase 7).

- [ ] **CSV export + email delivery.** "Export my data" button → SQL → CSV → email via Resend. Includes every catch column plus enriched conditions (weather, tide, moon, solunar).
  - Competitor reference: Reelback, CatchStats, Anglers' Log.
  - Effort: S (SQL + edge function).

- [ ] **Personal analytics dashboard.** Species pie, best month, PB per species, hotspot mini-map.
  - Competitor reference: CatchStats, Anglers' Log.
  - Effort: M.

- [ ] **Real-time catch-condition correlation cards.** After N≥50 catches, surface insights: "You catch more flathead on falling tide + air temp >20°C." Show sample size + confidence.
  - Competitor reference: Bite Signal, Fishero, ANGLR Pro.
  - Risk: low-N false correlations → always show N.
  - Effort: M (simple SQL grouping; no ML).

- [ ] **Personal-best record context.** PB card per species showing the exact conditions of that catch (tide, pressure, moon, bait, technique) with a "re-fish this combo" CTA that pre-populates a new catch report.
  - Effort: S.

- [ ] **Photo cloud backup + auto-compression.** Already compress client-side; add opt-in backup to Supabase Storage so users don't lose catches when they switch phones.
  - Effort: S.

---

## Phase 9 — Social (inject)

All three items below share a single Supabase Realtime channel infra — build once, use thrice.

- [ ] **Live trip GPS broadcast to trusted friends.** Explicit opt-in per session; URL expires at trip end; retention ≤24h post-trip. Friends rendered as distinct pin on map with name + last-known pace. Cap friends at 10 per session.
  - Competitor reference: ANGLR Go LIVE, AllTrails Live Share, OnX Hunt Live Location.
  - Risk: stalking → require mutual-follow + explicit approval per trip.
  - Effort: M.

- [ ] **Private DMs + group chat.** 1-to-1 + small-group threads (e.g. "Port Phillip Wed Night Crew"). Supabase Realtime. Moderation: flag + auto-hide at N flags; encrypted at rest; optional E2EE later.
  - Competitor reference: Fishbrain, ANGLR.
  - Effort: M.

- [ ] **Verified-guide peer-review flow.** Guide badge awarded after 3+ verified 5-star reviews from distinct anglers + spot-check of claimed catches. Reviewer criteria transparent on each guide profile ("4 reviews across 18 months, 4.8 avg"). Require verified email + phone. Suppress reviews from accounts <30d old.
  - Competitor reference: eBird Expert, iNaturalist Research Grade, Strava KOM.
  - Risk: bot farms — 1 review per user per guide per 30d.
  - Effort: M.

- [ ] **Angler / spot reputation scores.** Lightweight trust score on angler profiles based on verified-catch count + community flag history. Visible as a subtle badge; never gatekeeps features.
  - Effort: S (rollup query over existing tables).

---

## Phase 10 — Leaderboard (inject)

- [ ] **Rare-catch alerts + rarity scoring.** Per-species, per-region rarity score derived from community data + commercial/rec-catch benchmarks. When a user logs a rare-for-region species, fire an in-app notification + feature it on a "Notable Sightings" feed.
  - Competitor reference: eBird Rare Bird Alerts, iNaturalist Research Grade, Seek.
  - Effort: M (rarity table + simple threshold check).

- [ ] **Expert verification flow for uncertain IDs.** User can flag a catch "species uncertain" → expert queue (VFA / uni partners / trusted community experts). Verified catches weight higher in heatmap + AI forecast.
  - Effort: M.

- [ ] **Species seasonal range maps.** Monthly range heat overlay per species derived from the community catch corpus. Helps trip planning ("where do bream congregate in July?").
  - Competitor reference: eBird migration, BirdLife ranges.
  - Effort: M (reuses heatmap infra from Phase 7).

- [ ] **Historical catch timeline per spot × species.** On a POI or pinned location: "Bream at Williamstown Pier: 247 catches, strongest Dec–Feb." Simple monthly rollup graph.
  - Effort: S.

- [ ] **Taxonomy + scientific names.** Add `scientific_name`, `family`, `order` to species table; render under common name; enables future academic data export.
  - Effort: S (data entry + schema migration).

- [ ] **Photo-to-data Claude Vision with confidence split.** On the catch report screen, run the AI ID on optional photo → show "86% flathead / 12% jewfish / 2% other"; user confirms/corrects; correction feeds back as telemetry to improve prompts.
  - Competitor reference: iNaturalist Seek, Catchr, FishVerify.
  - Effort: M (Claude Vision API already on roadmap; this adds the confidence UX).

- [ ] **Weekly challenges + seasonal tournament import/export.** Import club comp schedules (Williamstown, Sandringham, Black Rock). Weighfish/Score-Fishing-compatible export for managed comps.
  - Competitor reference: Rippton, Weighfish, Score Fishing.
  - Effort: M.

- [ ] **Catch streak + profile XP system.** Daily/weekly streak multipliers on top of the planned Pokédex + badges. XP never gates anything; pure retention hook.
  - Competitor reference: ANGLR, Rippton, Strava KOM.
  - Effort: S.

---

## Phase 10.5 — Citizen Science (new, optional)

Bundle rare-catch + expert-verification + research-export into a single "Citizen Science" sub-phase if it earns enough traction. Positions BiteMap for VFA / Museums Vic / university partnerships.

- [ ] **Seasonal spawning + breeding-condition data layer.** Auto-flag catches during sensitive windows (bream Aug–Nov, flathead juveniles Jan–May) with a catch-and-release nudge and handling guidance.
  - Effort: S (species DB data).

- [ ] **Anonymised research export endpoint.** Bulk download of catch + conditions corpus with PII stripped; requires data-use agreement.
  - Effort: M (RLS policy + Edge Function).

- [ ] **Indigenous knowledge layer (co-designed).** Port Phillip = Kulin Nation Country. Engage VFA Aboriginal-engagement team; co-design species cards with cultural + ecological context. Opt-in surface, never presumptuous.
  - Effort: L (partnership-driven, timeline uncertain).

---

## Phase 11 — Hardening + Launch (inject)

- [ ] **Video-based onboarding tutorials.** Short in-app videos for first-catch, offline use, privacy settings. Reduces support burden at launch.
  - Competitor reference: Omnia Fishing, Smart Fishing Spots.
  - Effort: M (production heavy; content > code).

- [ ] **Shark / marine-hazard alert layer.** Integrate SharkSmart (NSW listening stations, Vic doesn't have official feed yet) + Dorsal crowdsourced + BOM hazard warnings. Port Phillip risk is low but safety halo is valuable.
  - Competitor reference: SharkSmart, Dorsal, SafeWaters.ai.
  - Risk: stale data panic → timestamps + auto-expire after 14d.
  - Effort: M.

- [ ] **Offline map tile download for catch logging in dead zones.** Users can pre-download a tile pack for their fishing region; enables full offline catch flow (not just queue).
  - Competitor reference: AllTrails offline parks, OnX Hunt, FishTrack, iNaturalist.
  - Risk: Mapbox tile costs at scale — rate-limit downloads to once per 30 days per region.
  - Effort: M.

---

## Phase 12 — Monetization (post-v1.0, free-forever compliant)

All items here are opt-in and NEVER gate core features.

- [ ] **Merch shop.** Printful/Shopify dropship. Hats, hoodies, towels. Link from Pokédex milestones + leaderboard. ~40% margin. Only ship if engagement data shows demand.

- [ ] **Tackle shop affiliate links.** "Recommended baits for bream: soft crab (Tackle World $4.99)." Scoped to "Recommended" section on species cards. 5–10% affiliate commission.

- [ ] **Fishing licence renewal deep-link.** No revenue but drives compliance + retention. Pop-up 30 days before expiry if user has stored licence metadata.

- [ ] **Guide-booking referral commission.** Verified guides → Viator/GetYourGuide booking partner. 10–15% BiteMap commission. Optional for guides.

- [ ] **Charity partnerships.** Monthly challenges tied to AMCS / Waterkeeper Australia. Stripe Giving. 100% forwarded. Brand halo.

- [ ] **Bait + tackle brand sponsorship of chrome elements.** "Powered by BOM / WorldTides / TackleCo" in app chrome. $5–20k/yr. Brand covers API costs; never a feature gate.

---

## Cross-cutting, any phase

- [ ] **Regulatory-data annual refresh job.** December cron to sync VFA + NSW DPI + Fisheries Queensland updates. Surface diff notifications to users whose home state changed.

- [ ] **Accessibility audit per injected feature.** Every new card/screen must hit WCAG AA + 44×44 pt targets + respect `prefers-reduced-motion`. Add to Phase 11 launch checklist.

- [ ] **Free-forever audit.** At each phase tag, verify no core feature has drifted behind a paywall. Document this as a release-checklist item.

---

## Backlog log (move here when DONE)

_(empty — populate as items ship; include PR + release tag)_
