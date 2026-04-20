# BiteMap — Competitor Feature-Gap Analysis

**Date:** 2026-04-20
**Status:** Research complete; prioritized backlog at `docs/superpowers/plans/2026-04-20-bitemap-competitor-gap-backlog.md`
**Source:** Deep research pass across Fishbrain, FishAngler, Navionics, Deeper, ANGLR, FishTrack, Rippton, iAngler, Anglr, Bite Signal, Fishero, FishWeather, FishVerify, Reelback, CatchStats, Anglers' Log, Smart Fishing Spots, Windy, WindHub, Omnia, Weighfish, Score Fishing, Strava, AllTrails, Waze, iNaturalist, eBird, Seek, OnX Hunt, SharkSmart, Dorsal, SafeWaters, VicFishing, Australian Boat Ramp Finder, Fishing Points, Fish Washington, onX Fish (50+ sources; full list at bottom).

---

## 1. Executive Summary

BiteMap's core thesis — free, map-first, community-driven fishing data — is sound and defensible. But several competitor capabilities would materially strengthen market position in Port Phillip Bay and beyond:

1. **Live trip broadcasting to trusted friends** — ANGLR "Go LIVE" + AllTrails "Live Share" prove anglers want real-time buddy participation (safety + social stickiness). BiteMap has activity feed but no synchronised live GPS sharing.
2. **Barometric pressure trend + bite-window UI** — Fishbrain BiteTime™ and Bite Signal's pressure-engine reveal appetite for precise condition-correlation visualisation. BiteMap's planned AI forecast is stronger only if paired with a glanceable pressure card.
3. **Bag-limit catch counter + auto-alerts** — FishVerify + Fish Washington automate limit tracking. BiteMap's species DB has limits but no in-trip counter; users risk $1000+ fines for accidental overages.
4. **Boat ramp + bait shop POI layer with ratings** — Australian Boat Ramp Finder + Fishbrain POIs address critical infrastructure discovery. BiteMap's POI layer is planned but unscheduled.
5. **Expert / verified-guide peer-review credibility** — eBird expert badge + iNaturalist Research Grade build trust via transparent community verification. BiteMap's planned guide badges have no peer-review flow; will be gamed within weeks without one.

---

## 2. Gap Matrix

Only **genuine gaps** — features BiteMap does NOT have and are NOT already on the 0→11 roadmap.

| # | Feature | Which competitors have it | Consumer value | BiteMap status | Priority | Effort |
|---|---------|---------------------------|----------------|----------------|----------|--------|
| 1 | Live trip GPS broadcast to trusted friends | ANGLR (Go LIVE), AllTrails (Live Share), OnX Hunt | Real-time buddy participation, safety, social proof | Not planned | **High** | M |
| 2 | Barometric pressure trend visualization card | Fishbrain BiteTime™, Bite Signal, Fishero | Precision bite-timing correlation | BOM weather + solunar only | **High** | M |
| 3 | Bag-limit catch counter + auto-alert | FishVerify, Fish Washington, onX Fish | Legal compliance, avoid fines | Species DB has limits, no in-trip counter | **High** | M |
| 4 | Boat ramp + fuel + bait shop POI w/ ratings | Fishbrain, Australian Boat Ramp Finder, Fishing Spots | Access-point discovery, infra link | POI layer planned, unscheduled | **High** | L |
| 5 | Expert / verified-guide peer-review UI | eBird expert badges, iNaturalist Research Grade | Trust signal, filter signal from noise | Guide badges planned, no peer-review | **High** | M |
| 6 | Live swell / wave-height forecast | FishTrack, Windy, FishWeather, WindHub | Coastal safety + bite prediction | BOM weather only | **High** | M |
| 7 | Real-time catch-condition correlation cards | Bite Signal (15+ auto-logged), Fishero, ANGLR Pro | Pattern-learning, skill improvement | Auto-logging only | Med | M |
| 8 | CSV export + personal analytics dashboard | Reelback, CatchStats, Anglers' Log | Data portability, research value, retention | Private logbook only | Med | M |
| 9 | Private DMs + group chat | Fishbrain, ANGLR | Trip coordination, local knowledge | Likes + comments only | Med | M |
| 10 | Rare-catch alerts + citizen-science status | eBird Rare Bird Alerts, iNaturalist Research Grade, Seek | Community excitement, data quality | Not planned | Med | L |
| 11 | Offline map tile download for logging offline | AllTrails, OnX Hunt, FishTrack, iNaturalist | Reliability in cell dead zones | Offline queue only; no offline map | Med | M |
| 12 | Solunar minor/major feed-time callouts | eBird, Bite Signal, ANGLR Pro | Bite-window precision | Moon phase only | Med | S |
| 13 | Species seasonal range maps (by month) | eBird, BirdLife ranges | Trip planning, education | Species DB lacks range maps | Low | M |
| 14 | Angler / spot reputation scores | Strava segments (KOM/QOM), AllTrails ratings, Rippton | Credibility, combat misinfo | Flag/hide moderation only | Low | M |
| 15 | Shark / marine hazard alert integration | SharkSmart, Dorsal, SafeWaters.ai | Safety halo, brand signal | Not planned | Low | L |
| 16 | Cloud photo backup + auto-compression | Deeper, FishAngler | Media management | 500KB cap only, no backup | Low | S |
| 17 | Video-based tutorial onboarding | Omnia Fishing, Smart Fishing Spots, onX Fish | Feature adoption, retention | Static help only | Low | M |
| 18 | Catch streak badges + profile XP system | ANGLR, Rippton, Strava KOM | Daily/weekly retention hooks | Pokédex + badges planned Phase 7 — XP not | Med | L |
| 19 | Integrated tackle shop affiliate links | ANGLR shop, Fishbrain partners | Optional revenue, discovery | Not planned | Low | L |
| 20 | Tournament-manager import/export | Weighfish, Score Fishing | Club tie-ins, managed comps | Tournaments planned Phase 8, no import | Low | M |

---

## 3. Deep Dives — High Priority

### 3.1 Live Trip GPS Broadcast to Trusted Friends

**What it is:** Real-time GPS + catch stream shared with a small circle (5–10 friends) while a trip is active. Friends see pin, catches-as-they-happen, tide/weather, ETA.

**Best-in-class:**
- **ANGLR "Go LIVE"** — broadcast GPS + catches + photos + weather to selected friends during a trip.
- **AllTrails Live Share** (Premium) — unique URL; friends see position, pace, mileage, ETA, battery %, cell signal.
- **OnX Hunt Live Location** — up to 10 group members; also Offline Sharing (AirDrop-style waypoint/route/track sharing with no cell required).

**Why it matters here:** Port Phillip anglers fish solo often; family wants safety tracking; groups want loose coordination without phone calls. Creates social proof ("I saw Jai pull a bream just now, still 45 mins of falling tide").

**Fits BiteMap principles:**
- Free forever — no paywall; cap at 5–10 friends per session (cost control, not monetization).
- Map-first — friend pins rendered as distinct icon on main map.
- Privacy-respecting — explicit opt-in per session; URL/session expires when trip ends; no background tracking.
- Offline-friendly — queues position updates locally, syncs on reconnect.

**Risks / costs:** Push infra (~$500–2k/mo at scale). Supabase Realtime handles broadcast channel. Abuse vector: stalking — require mutual follow or explicit per-trip approval. GDPR/Privacy Act AU: retention policy (delete trip track within 24h of trip end).

**Roadmap placement:** Phase 9 (Social) — bundle with DMs since both need Realtime channel infra.

---

### 3.2 Barometric Pressure Trend + Bite-Window Card

**What it is:** Glanceable card: pressure trend over 12–24h (rising/falling/stable) + colour-coded bars showing forecast bite strength by hour and species at user's location.

**Best-in-class:**
- **Fishbrain BiteTime™ (Pro, $13/mo)** — colour-coded bars; ML on 2.5M catches; 30+ input attributes.
- **Bite Signal** — real-time bite score 1–10 updated hourly; separates saltwater/freshwater algorithms.
- **Fishero** — proprietary pressure engine blended with lunar cycles; hourly bite-strength.

**Why it matters here:** Port Phillip anglers fish tide-driven bays; rising pressure = clearing weather (often good bite); falling pressure hours before a front arriving can trigger bite spikes. Visual "next 3h best" drives trip planning.

**Fits BiteMap principles:**
- Free forever — BOM pressure data is free; AI forecast already planned.
- Map-first — float a slim card above pins; swipe to full 24h forecast per species.
- Glanceable — one colour bar, one number.

**Risks / costs:** Claude cost if tied to AI forecast (~$500–1.5k/mo at scale — already budgeted in planned AI forecast). Accuracy liability → "for reference" disclaimer.

**Roadmap placement:** Phase 6 (Weather + Tide) — ship alongside the BOM/WorldTides integration. Cheap to add once BOM pressure is already fetched.

---

### 3.3 Bag-Limit Catch Counter + Auto-Alerts

**What it is:** In-trip counter per species vs. user's state limits, with amber/red warning when approaching/hitting limit. "⚠️ Flathead 5/5 — you've hit the daily bag limit for VIC."

**Best-in-class:**
- **FishVerify ($3.99/mo Pro, free tier available)** — digital license storage, expiry alerts, species bag-limits + seasonal closures searchable.
- **Fish Washington (free, state-govt)** — harvest limits by waterbody + species; electronic catch-record cards (mandatory for salmon/sturgeon).
- **onX Fish Midwest (paid)** — lake-specific bag limits + seasonal restrictions inline.

**Why it matters here:** VIC has strict limits (flathead 5/day, bream 10/day, snapper 3 over 40cm). Fines up to ~$1000 per over-limit fish. Compliance is table-stakes in Australia, not a nice-to-have.

**Fits BiteMap principles:**
- Free forever — universal compliance utility.
- Map-first — not map-related; gauge under the species tile on catch-report flow + summary card on today's session.
- Offline-friendly — limits are JSON in species DB; checks run offline.

**Risks / costs:** Regulatory accuracy — need annual refresh (Dec–Jan when VFA updates). Liability — disclaimer: "Check VFA before releasing. BiteMap is a guide, not legal advice." Must support state-aware differences (NSW bream limit ≠ VIC bream limit).

**Roadmap placement:** Phase 8 (Profiles) — needs "home state" selector first. Could also live in a minor Phase 7.5 (regulations polish).

---

### 3.4 Boat Ramp + Bait Shop + Fuel POI Layer with Ratings

**What it is:** Toggleable map layer showing ramps, bait shops, fuel docks, jetties. Each POI: hours, user 1–5 star ratings, recent "ramp condition" reports (crowded / debris / low-tide closed).

**Best-in-class:**
- **Australian Boat Ramp Finder** — 1500+ ramps, 95% AU coverage, map + list, community missing-ramp reporting.
- **Fishbrain Pro** — boat ramps, bait shops, licence vendors on map; local-business + community flags.
- **Fishing Spots (free)** — instant locate with depth charts.

**Why it matters here:** Port Phillip users want to know (a) which ramps are free vs. fee ($5–10 Williamstown vs. free Portsea), (b) ramp condition (low tide / storm debris / maintenance closure), (c) nearest Sunday-morning open bait shop. Removes friction → casual → frequent angler conversion.

**Fits BiteMap principles:**
- Free forever — no paywall for bait-shop directory.
- Map-first — toggle layer, tap POI for details.
- Community-driven — ratings + condition reports are user-generated.
- Offline-friendly — cache POIs offline, sync new reviews when back online.

**Risks / costs:** Data sourcing — partnership with VFA (they publish bait shops + ramps) + community submissions. Moderation — light flag-system sufficient. Liability — "closed" data staleness → show "last reported Xh ago."

**Roadmap placement:** Already on roadmap as "Tackle shop / POI Finder" post-v1 — **promote to Phase 7.5** (wedged between filters/heatmap and profiles). Ship with user-reported ramp-condition reports in Phase 9 with social.

---

### 3.5 Expert / Verified-Guide Peer-Review UX

**What it is:** Badge awarded after peer review: e.g. 3+ verified 5-star reviews from distinct anglers + spot-check of claimed catches. Only verified guides appear in "Recommended" carousels or guide-only filter.

**Best-in-class:**
- **eBird Expert** — users with 3+ improving-identifications (community-agreed first IDs) get Expert tag.
- **iNaturalist Research Grade** — observations with 2+ agreeing community IDs reach Research Grade; eligible for research export + atlas integration.
- **Strava Segments (KOM/QOM)** — auto-calculated leaderboard; no forgery (GPS-logged).

**Why it matters here:** When Phase 6+ launches paid-guide profiles, ~90% of sign-ups will be spammers or casuals. Verified badges separate the signal.

**Fits BiteMap principles:**
- Free forever — badges are credibility, not a paywall.
- Community-driven — reviewers are real anglers, transparent criteria.
- Privacy-respecting — badge criteria visible ("4 reviews across 18 months, 4.8 avg").

**Risks / costs:** Gaming — bot farms 5-starring each other. Mitigate: require verified email + phone + 1 review per user per guide per 30d, and suppress reviews from accounts <30 days old. Disputes create ~5–10 tickets / 100 guides → budget moderation.

**Roadmap placement:** When "Verified Guide Profiles" ships (currently unscheduled post-v1). Suggest bundling with Phase 9 (Social) since peer-review is a social flow.

---

### 3.6 Live Swell / Wave-Height Forecast (Coastal Saltwater)

**What it is:** Marine wave-forecast card: swell height (m), period (s), direction, 7-day outlook. Port Phillip Heads and outside waters are swell-driven for safety + bite.

**Best-in-class:**
- **FishTrack** — SST + chlorophyll layers, swell/wind overlays, offshore-focused, Aus coverage.
- **Windy.app** — animated wind/wave maps, 30k+ sports spots, wave period + height + storm tracker.
- **FishWeather** — wave height, wave period, water temp, barometric pressure.

**Why it matters here:** Heads anglers + rock fishers rely on swell data for safety (small craft warnings 2–4h lead time) and bite (big swell = fish suspended; small swell = reef on). Fewer Port Phillip users need it, but liability reduction is worth it.

**Fits BiteMap principles:**
- Free — BOM + WorldTides include swell; no paywall.
- Map-first — card alongside tide card.
- Offline-friendly — cache 7d forecast.

**Risks / costs:** BOM API rate-limited; add NOAA/GEBCO fallback. "For reference. Always check BOM marine warnings."

**Roadmap placement:** Phase 6 (Weather + Tide) — ship in the same Edge Function as BOM weather fetch.

---

### 3.7 Real-Time Catch-Condition Correlation Cards

**What it is:** After N catches (50+), app surfaces "You catch more flathead on falling tide + >20°C air temp" or "Neap-tide drift works best for you."

**Best-in-class:**
- **Bite Signal** — auto-logs 15+ conditions per catch, back-fills past catches, learns user's best conditions.
- **Fishero** — detailed analytics on pressure + lunar correlation.
- **ANGLR Pro ($2.50/mo)** — trip analysis with environmental data.

**Why it matters here:** Anglers fish "by feel" and folklore. Data-driven insights drive re-engagement + skill improvement. Gamified learning.

**Fits BiteMap principles:**
- Free — no premium analytics gate.
- Community-driven — aggregate cross-user insights also possible ("Anglers catch bream best on falling tide in autumn").
- Privacy-respecting — personal patterns stay on device until user opts in to share.

**Risks / costs:** Low-N false correlations ("5 catches, 80% falling tide → falling tide is best"). Mitigate by showing sample size + confidence. No ML needed for v1 — simple SQL grouping by condition bucket.

**Roadmap placement:** Phase 8 (Profiles) — lives on the logbook/stats screen.

---

### 3.8 CSV Export + Personal Analytics Dashboard

**What it is:** "Export" button on logbook → CSV (date, species, length, weight, lat/lng, bait, technique, weather, tide, moon, conditions). Dashboard: total catches, species pie chart, best month, PB per species, hotspot map.

**Best-in-class:**
- **Reelback (Pro $19.99/yr)** — CSV export, correlations, personal bests.
- **CatchStats** — PDF export, Google Sheets sync.
- **Anglers' Log (Pro $11.99/yr)** — CSV export, species breakdown, catch stats.

**Why it matters here:** Serious anglers want data ownership (Privacy Act compliance). Research export → potential VFA / uni partnerships. Retrospective "look back 5 years" aspirational value.

**Fits BiteMap principles:**
- Free — ships export free (no premium gate).
- Privacy-respecting — user's own data; reinforces ownership.
- Offline-friendly — export works from local DB.

**Risks / costs:** Minimal backend — SQL → CSV → email via Resend (~$0.01/export).

**Roadmap placement:** Phase 8 (Profiles) — drop into "Logbook → Settings → Export my data."

---

### 3.9 Private DMs + Group Chat

**What it is:** 1-to-1 and small-group messaging for trip coordination ("Port Phillip Wed Night Crew"), questions, last-minute catch tips.

**Best-in-class:**
- **Fishbrain** — DMs + groups (free to 10 members, Pro unlimited).
- **ANGLR** — closed social network = built-in DM + groups.

**Why it matters here:** Comments on a catch post ≠ coordinating a trip. Groups = local-knowledge glue.

**Fits BiteMap principles:**
- Free — unlimited DMs + groups, no paywall.
- Community-driven — groups self-organise.
- Privacy-respecting — flag + auto-hide at N flags; encrypted-at-rest; optional E2EE later.

**Risks / costs:** Moderation (spam, harassment, spot-hoarding feuds). Supabase Realtime or custom WebSocket (~$500–2k/mo at scale).

**Roadmap placement:** Phase 9 (Social) — bundle with activity feed and live-trip broadcast on shared Realtime infra.

---

### 3.10 Rare-Catch Alerts + Citizen Science (iNaturalist / eBird model)

**What it is:** When user logs an unusual-for-the-region species, app notifies ("Bonefish in Port Phillip is rare — you just contributed to citizen science!"). "Notable Sightings" feed surfaces them for community and potential research export.

**Best-in-class:**
- **eBird Rare Bird Alerts** — nearby rare sightings, custom filters, 30-min lag for expert review.
- **iNaturalist Research Grade** — 2+ community-agreed IDs → research-grade, eligible for academic export.
- **Seek** — gamified species discovery + badges + kid-safe.

**Why it matters here:** Low-frequency but high-excitement. Brings in conservation-minded anglers + positions BiteMap for data partnerships (VFA, Museums Vic, research unis).

**Fits BiteMap principles:**
- Free — no premium gate on rarity alerts.
- Community-driven — rarity scores derived from community data + historical commercial/rec-catch benchmarks.

**Risks / costs:** Requires rarity scoring table per species per region. Moderation for fraud ("claim rare species for clout"). Expert-review queue (bundle with expert-ID verification from 3.5).

**Roadmap placement:** Phase 10 (Leaderboard) or a dedicated "Citizen Science" Phase 10.5 — pairs with Pokédex gamification.

---

## 4. Australia-Specific Gaps

Features Australian-built apps or AU-specific data sources offer that BiteMap lacks:

### 4.1 VFA integration
- Deep-link to VFA recreational fishing licence renewal.
- Seasonal closure calendar per species per zone (bream closed Jun 1–Aug 31 some areas; snapper closed windows).
- Marine park boundary overlay (Port Phillip Heads Marine National Park, Point Cooke MS, Jawbone MS etc. — take-free zones).
- Auto "closing in 2 weeks" reminders per species.

### 4.2 State-aware regulation deltas
- NSW vs. VIC vs. QLD vs. SA limits differ for the same species.
- Need user "home state" selector + geofenced override when crossing borders.
- Cross-reference inline on species card ("Bream: 10 VIC / 8 NSW").

### 4.3 Boat ramp + access condition reports (AU-specific data)
- Australian Boat Ramp Finder has 1500+ ramps — integrate or replicate.
- User-reported "ramp status" (open/closed/crowded/low-tide-inaccessible).
- Per-ramp tide-height thresholds ("Williamstown accessible >1.2 m").

### 4.4 BOM marine warnings overlay
- Small-craft warnings in-app (users currently check BOM separately).
- Marine-hazard alerts (strong currents, rips, underwater structures).
- Swell forecasts via BOM marine boundary layer.

### 4.5 Barometric pressure + trend (BOM has it, just needs UI — see 3.2)

### 4.6 Fishing club + tournament integration
- Williamstown, Sandringham, Black Rock angling club comp calendars.
- Event auto-advertising in-app.
- DNR-style catch reporting for managed tournaments.

### 4.7 Indigenous knowledge layer (long-tail, brand halo)
- Port Phillip = Kulin Nation Country; opportunity for co-designed species cards.
- Seasonal/cultural context (e.g., "Bream spawning Aug–Nov; low-stress handling critical").
- Links to Fisheries Aboriginal-engagement programs.

---

## 5. "Pokédex++" / Community-Intelligence Gaps

Features iNaturalist/eBird/Strava do that amplify BiteMap's community-data moat:

1. **Expert verification flow (iNaturalist Research Grade model)** — users flag uncertain catches → ichthyologists/VFA review → "Expert Verified" badge weights higher in heatmap + forecasts.
2. **Rare-catch alerts + rarity scoring** (see 3.10).
3. **Seasonal spawning / breeding-condition data** — auto-flag catches during sensitive windows; nudge catch-and-release.
4. **Historical catch timeline per spot × species** — "Bream at Williamstown Pier: 200+ catches, strongest Dec–Feb."
5. **Personal-best record context** — "Your PB conditions: falling tide + overcast + soft crab. Match them next trip?"
6. **Taxonomy + scientific names** — common → *Acanthopagrus butcheri* → Family Sparidae; enables research export.
7. **Photo-to-data linking with confidence score** — Claude Vision suggests species with 86/12 % split; user correction feeds back as training signal.

---

## 6. Monetization-Adjacent Gaps (Free-Forever Compliant)

Revenue sources that DO NOT gate core features:

1. **Merch shop** — Printful/Shopify dropship hats/hoodies, linked from Pokédex completion milestones. ~40% margin. Only ship if community demand exists.
2. **Tackle shop affiliate links** — "Soft crab for bream: Tackle World $4.99" → partner link, 5–10% commission. Scoped to "Recommended" section of species cards, not intrusive.
3. **Fishing licence renewal deep-link** — VFA doesn't pay, but drives compliance + retention.
4. **Guide-booking referral commission** — verified guides → Viator/GetYourGuide booking, 10–15% split. Optional for guides.
5. **Charity partnerships** — monthly challenges tied to AMCS or Waterkeeper Australia; Stripe Giving; 100% forwarded; brand halo.
6. **Sponsorship from bait + tackle brands** — non-invasive "Powered by BOM / WorldTides / VFA / TackleCo" chrome; $5–20k/yr; brand covers API costs.

---

## 7. NOT recommended

Already on the 0→11 roadmap — don't re-flag these as gaps:

- Offline catch queue (Phase 5 / 5a)
- AI-powered fishing forecast (Phase 7+)
- Claude Vision species ID (post-v1)
- Species Pokédex (Phase 7)
- Seasonal tournaments (Phase 8)
- Shareable catch cards (Satori, post-v1)
- POI layer (currently post-v1 → recommend promotion to Phase 7.5)
- Verified guide profiles (currently post-v1 → bundle with Phase 9 social + peer-review)
- Push notifications (Phase 11)
- Admin dashboard (Phase 11)

---

## 8. Sources

1. [Fishbrain Features](https://fishbrain.com/features) — depth maps, waypoints, 20M catch locations, community groups.
2. [Fishbrain Pro](https://fishbrain.com/pro) — exact catch locations, bait recommendations, HD depth maps, regulations.
3. [Fishbrain Group Chat Help](https://fishbrain.helpshift.com/hc/en/3-fishbrain---social-fishing-forecast-app/faq/225-what-is-a-fishbrain-group-and-how-to-manage-it/) — private groups + messaging.
4. [Fishbrain App Store reviews](https://justuseapp.com/en/app/477967747/fishbrain-fishing-app/reviews) — paywall frustration, privacy defaults.
5. [Fishbrain BiteTime blog](https://fishbrain.com/blog/fishbrain/bitetime-is-the-right-time) — 30+ inputs, ML on 2.5M catches.
6. [FishAngler](https://www.fishangler.com/) — 45+ attributes, privacy controls (private/friends/public).
7. [Navionics Community Edits](https://www.navionics.com/fin/charts/features/community-edits) — ActiveCaptain, SonarChart HD bathymetry.
8. [ANGLR Features](https://www.anglr.com/features) — Go LIVE trips, closed social, GPS broadcast.
9. [ANGLR Pro](https://www.anglr.com/pro.html) — 14 mapping layers, weather overlays, Bullseye waypoint tracker.
10. [ANGLR App Store](https://apps.apple.com/us/app/fishing-app-anglr-logbook/id1142347232) — closed social, trip recording, challenges.
11. [FishTrack](https://www.fishtrack.com/) — SST, chlorophyll, bathymetry, swell/wind, Aus coverage.
12. [iAngler](https://angleractionfoundation.org/iangler) — private logbook, weather, AIS ship data, conservation.
13. [Rippton](https://www.rippton.com/app) — journal, GPS, forecast, rankings, events.
14. [Australian Boat Ramp Finder](https://fishingworld.com.au/boats/boating-bits/australian-boat-ramp-finder/) — 1500+ ramps, 95% AU coverage.
15. [Fishing Points](https://play.google.com/store/apps/details?id=com.gregacucnik.fishingpoints&hl=en_AU) — 50k boat ramps, forecasts.
16. [Strava Segments](https://support.strava.com/hc/en-us/articles/216918167-Strava-Segments) — KOM/QOM leaderboards.
17. [AllTrails Offline Parks](https://support.alltrails.com/hc/en-us/articles/32259897942036-Introducing-Offline-Parks) — offline maps.
18. [AllTrails Live Share](https://www.alltrails.com/press/alltrails-launches-live-share-real-time-location-sharing) — real-time location sharing.
19. [Waze community reporting](https://support.google.com/waze/answer/13739290?hl=en) — conversational AI reporting.
20. [iNaturalist Research Grade](https://www.inaturalist.org/posts/26549-what-is-a-verifiable-observation-and-how-does-it-reach-research-grade/) — community ID consensus.
21. [iNaturalist Expert Identifiers](https://www.inaturalist.org/posts/9260-identification-quality-experiment-update) — improving IDs → expert badge.
22. [Seek by iNaturalist](https://www.inaturalist.org/seek) — real-time CV, AR-guided, kid-safe.
23. [eBird Mobile](https://ebird.org/about/ebird-mobile/) — checklists, rare alerts, hotspots, life lists.
24. [eBird Alert App](https://apps.apple.com/ca/app/ebird-alert/id6745479305) — nearby rare sightings, 30-min verification lag.
25. [OnX Hunt Features](https://www.onxmaps.com/hunt/app/features) — offline maps, 152M property data, live location groups.
26. [OnX Hunt Offline Sharing](https://www.onxmaps.com/hunt/app/features/offline-sharing) — AirDrop-like waypoint sharing.
27. [Deeper Smart Sonar](https://www.deepersonar.com/en-all/pages/fish-deeper-app-1) — catch logging, community depth maps.
28. [Catchr](https://www.getcatchr.com/) — AI ID of 500+ species.
29. [FishVerify](https://www.fishverify.com/) — AI species ID, regulations, licence storage, expiry alerts.
30. [CatchStats](https://catchstats.com/) — CSV + Sheets export, correlations.
31. [Anglers' Log](https://apps.apple.com/us/app/anglers-log-fishing-journal/id959989008) — CSV export, species stats.
32. [Reelback](https://www.reelback.app/) — CSV export, pressure/bait/moon correlations.
33. [Bite Signal](https://apps.apple.com/us/app/bite-signal/id6760796117) — bite scores, 15+ conditions, pressure engine.
34. [Fishero](https://fishero.app/) — pressure engine, lunar cycles, hourly bite-strength.
35. [FishWeather](https://play.google.com/store/apps/details?id=com.windalert.android.fishweather&hl=en_US) — wave height, pressure, marine.
36. [Fishing GPS](https://apps.apple.com/us/app/fishing-gps-spot-share-log/id6754788235) — private group sharing, boat nav.
37. [Smart Fishing Spots tutorial](https://www.saltstrong.com/articles/smart-fishing-spots-app-tutorial/) — tide/wind-based map updates, Strike Score, 15-min refresh.
38. [Windy App](https://www.windy.app/) — live wind maps, wave forecasts, storm tracker.
39. [WindHub](https://windhub.com/) — charts, tides, waves, pressure maps.
40. [Fish Washington](https://fishwashington.com/) — licence privileges, harvest limits, electronic catch cards.
41. [onX Fish Regulations](https://www.onxmaps.com/fish/app/features/fishing-regulations) — lake-specific bag limits, seasonal restrictions.
42. [SharkSmart NSW](https://www.sharksmart.nsw.gov.au/sharksmart-app) — 37 listening stations, drone observations, alerts.
43. [Dorsal Shark Reports](https://www.dorsalwatch.com/) — GPS proximity alerts, crowdsourced + govt sightings.
44. [VicFishing App](https://vfa.vic.gov.au/recreational-fishing/recreational-fishing-guide/recreational-fishing-application-for-smartphones) — 70+ species, size/bag limits, closed seasons, marine parks, licence purchasing.
45. [Weighfish](https://weighfish.com/) — tournament discovery, real-time leaderboards, offline support.
46. [Score Fishing](https://www.scorefishing.com/) — automated registration, leaderboards, photo verification.
47. [Omnia Fishing tutorials](https://www.omniafishing.com/omnia-videos/getting-started-in-the-app) — video onboarding.
48. [Modulai × Fishbrain case](https://modulai.io/case/global-forecasting-model-for-worlds-largest-fishing-app/) — global forecasting model trained on 2.5M catches.
49. [Waze icons reference](https://www.ridester.com/waze-icons/) — discrete iconography for actionable reports.
50. [Offline-first React Native](https://medium.com/@abdurrehman1/offline-first-request-handling-in-react-native-online-calls-queues-automatic-sync-dca53708e863) — queue architecture patterns.
