# BiteMap — UX/UI Research & Design System

**Date:** 2026-04-20
**Status:** Research complete; design system created in Stitch
**Stitch Project:** `projects/7130908085017726434`
**Stitch Design System Asset:** `assets/4590577941356041509`

---

## 1. Competitive Research Summary

### Fishbrain (15M users) — The cautionary tale
- **Map-first UX** works: map is the primary bottom-tab destination (not a feed). This is the right default for BiteMap.
- **Color-coded recency** on pins (orange = recent, green = older) is a glanceable win — no tap required.
- **Progressive disclosure via layer toggles**: depth contours, river gauges, spot predictions stay hidden until asked for.
- **AI "spot prediction" overlay** (yellow heat) is their superpower — community data → inferred hotspots.
- **What to avoid:** aggressive paywalls. Users literally can't see individual catch positions without Pro ($13/mo, $80/yr). Reviews call the app "virtually unusable." Free forever is BiteMap's wedge.

### Waze — The pin-vs-heatmap answer
- Individual reports = **distinct icon pins**, not a heatmap. Each report is *actionable and time-sensitive*, and a heatmap would lose specificity.
- **Zoom-dependent rendering**: orange dots when zoomed out → full iconography when zoomed in. Roadblocks are a direct analog for BiteMap pins.
- **User control over density**: layer toggles let users hide noise. BiteMap should ship a filter bar on day 1.
- Underlying road colour uses **light choropleth semantics** (red/orange = slow) *under* the pins. Translation for BiteMap: tide-state water colouring under the catch pins is a future polish win.

### Strava + AllTrails — Outdoor visual language
- Strava's map team uses **ColorBrewer** and **Adobe Color** for palettes — we will too.
- Strava's pattern: lighten map chrome so the activity/route is the hero. For BiteMap: lighten map chrome so **catch pins are the hero**.
- Mobbin recommends **deep navy blue** as the ideal high-contrast palette for water/outdoors apps. We're using #0E5C8A as primary for exactly this reason.
- **Minimalism + gradient** (light aqua → deep navy for depth) mirrors Strava's grey→green elevation gradient. Applies to our heatmap-mode visualization.

### React Native offline-first — Reporting queue UX
- **Local-first, sync is enhancement** — treat AsyncStorage/MMKV as source of truth.
- **Queue schema:** `id, type, entity, data, timestamp, retryCount, lastError, status` with `MAX_RETRIES` + `isProcessing` flag.
- **Optimistic updates are risky** without feedback — users won't know if a report was lost. We must show a persistent "queued" pill on the catch, and an offline banner at the top of the app.
- **Exponential backoff** on retries. **Permanent failures** (422s) need a UI for user correction.
- **Dismissable queued actions** — if a user edits/deletes before sync, the queue updates, not fires a stale request.

---

## 2. Design Principles (locked)

1. **Map is hero.** Fullscreen, minimal chrome. Nothing overlays unless the user asked.
2. **Report in 3 taps.** Single scroll sheet. No wizards.
3. **Glanceable data.** Species recency via colour opacity. No text to read a pin.
4. **Offline-friendly visual language.** Queued state obvious but not alarming.
5. **Inclusive & accessible.** AA contrast minimum, colour-blind-safe pin palette.

---

## 3. Design System: "BiteMap Ocean"

**Stitch asset ID:** `4590577941356041509`

### Colour

| Token | Hex | Purpose |
|-------|-----|---------|
| **Primary / Deep Harbour Blue** | `#0E5C8A` | Trust, nautical brand. Text on light, CTAs on dark. |
| **Secondary / Seafoam Teal** | `#2BB7A8` | Living water. CTAs, active pins, positive actions. |
| **Tertiary / Golden Bait** | `#F59E0B` | Rewards, badges, urgent callouts (tournaments). |
| Surface Light | `#F5FAFB` | Misty water — main background |
| Surface Dark | `#061822` | Deep night ocean — dark-mode background |
| Success | `#2E9E6A` | Catch posted confirmation |
| Warning | `#D97706` | Offline, queued |
| Danger | `#DC2626` | Destructive, flag |

**Pin palette (ColorBrewer, colour-blind safe):**

| Category | Hex |
|----------|-----|
| Saltwater | `#2B5D9B` |
| Freshwater | `#2BB7A8` |
| Estuarine | `#7A5FD1` |
| Pelagic | `#E4572E` |
| Other | `#6B7280` |

**Recency encoding:** pin alpha ramps from 100% (just posted) → 30% (48h old) over time. No text required.

### Typography

- **Display** — Plus Jakarta Sans 32/40 bold (hero only)
- **Headline** — Plus Jakarta Sans 24/32 semibold
- **Title** — Plus Jakarta Sans 18/24 semibold
- **Body** — Inter 15/22 regular
- **Caption** — Inter 13/18 regular
- **Micro** — Inter 11/14 medium uppercase (chips/tags)

### Shape

- Corners: 12px (cards, sheets, inputs); 8px (chips); full round (avatars, map CTAs)
- Elevation: subtle. Map provides depth; UI sits on top without competing.

### Motion

- Pin drop: 200 ms spring
- Sheet open: 250 ms ease-out
- Offline-queued badge: slow breath pulse at 1.5 Hz — signals waiting, not broken
- Never block interaction >300 ms

### Voice

- Casual, proud-angler warm. Celebrate catches. Never judge techniques.
- Empty states: fishing puns sparingly. Errors: plain English.

---

## 4. Key Screens (generated in Stitch)

| Screen | Stitch ID | Status |
|--------|-----------|--------|
| Map Home | `8c9941556e004e208807c2284480a42e` | ✅ Generated |
| Species Detail (Snapper) | `c81107f0bc1642268c340543e8a7fd26` | ✅ Generated |
| Catch Report Sheet | — | ⏳ To regenerate (timed out; spec below) |
| Profile | — | ⏳ To generate in Phase 8 |
| Activity Feed | — | ⏳ To generate in Phase 9 |

### Map Home — layout spec

- **Fullscreen Mapbox**. Centred on Port Phillip Bay (-38.10, 144.85, zoom 9).
- **Pins:** category colour × recency alpha. Newest bright, oldest faded.
- **Floating top search bar** — "Search locations, species…". Filter chips underneath: Species, Bait, Freshness (6h/24h/48h), Layers.
- **Top-right pill** — Pins ↔ Heatmap toggle.
- **User location dot** — blue dot with compass cone when available.
- **Floating bottom tab bar** — 5 tabs: Map (active), Feed, **Report (+ big seafoam circle, raised)**, Species, Profile.
- **Tapping a pin** — opens bottom sheet with species, user, time-ago, bait, and "View profile" action.

### Catch Report — single scroll sheet

Avoiding multi-step wizard; single scroll respects the "3-tap" brief by keeping progress visible.

1. **Header** — "Log a Catch" + close X + progress ring (filled as fields complete)
2. **Species picker** — large tile, "Snapper" + silhouette + swap. Secondary "Use AI photo ID" button.
3. **Quantity stepper** + **Size input** with cm/in toggle.
4. **Bait** — text input with recent-bait chips shortcut.
5. **Technique** — chip group (Drift, Anchor, Troll, Jig, Cast, Fly).
6. **Conditions auto-attached** — GPS accuracy, tide height + state, wind, air temp, moon phase, solunar. Read-only card.
7. **Privacy** — segmented control: Exact GPS / Area only / Hidden. Inline explainer.
8. **Photo upload** — optional, 500 KB cap, compressed client-side.
9. **Sticky bottom CTA** — "Post Catch" (seafoam, full width, pill).

**Offline affordance:** if offline, CTA reads "Queue Catch" (tertiary orange), and a persistent banner says "You're offline — catches will sync when you're back."

### Species Detail — layout spec

- Hero photo.
- Title + scientific name.
- Category chip.
- **Regulation card** — min legal size, bag limit, closed season (state-aware).
- Description paragraph.
- Recent catches nearby (horizontal scroll).
- Primary CTA "Log a Snapper catch" → opens Catch Report pre-filled.
- Ghost CTA "Report regulation change".

### Profile — layout spec (for Phase 8)

- Hero: avatar + username + bio + follow/unfollow.
- Stats row: catches, species, streak (hidden in v1 until gamification phase).
- Tabs: Catches | Species Caught | Saved Spots (own only) | Tournaments (Phase 2+).
- Catch grid — thumbnails, taps to detail.
- Pokédex grid (Phase 2+) — species silhouettes, greyed until caught.

### Activity Feed — layout spec (for Phase 9)

- Segmented control: Following | Nearby.
- Catch cards: user row, photo, species + conditions, like/comment/share.
- Empty states: "Follow anglers to see their catches here" + CTA to discover.

### Leaderboard — layout spec (for Phase 10)

- Segmented control: By Species | By Area | By Season.
- Ranked list with avatar, username, catch count, best size.
- User's own row pinned at bottom if not in top N.

---

## 5. Accessibility Requirements

- All colour/alpha combinations pass **WCAG AA** (4.5:1 for body, 3:1 for large).
- **Colour is never the only signal** — pins also vary by shape/icon glyph for category.
- Tap targets **≥44×44 pt** minimum.
- **VoiceOver + TalkBack** traversal tested for map pins, catch form, profile.
- `prefers-reduced-motion` disables pin-drop spring + pulse animation.
- Text scales with OS setting; layout reflows to accommodate 200% text.

---

## 6. Platform Conventions

| Concern | iOS | Android |
|---------|-----|---------|
| Bottom tab bar | Yes | Yes (NavigationBar material) |
| Sheet presentation | Native half/full sheet | BottomSheetScaffold |
| Haptics | UISelectionFeedback on pin tap, UINotificationFeedback on catch post | HapticFeedback equivalents |
| Location permission prompt | `NSLocationWhenInUseUsageDescription` with copy "BiteMap uses your location to log catches where you caught them and show nearby activity." | `ACCESS_FINE_LOCATION` + runtime rationale dialog |
| Photo picker | PHPicker (iOS 14+) | ActivityResultContract PickVisualMedia |

---

## 7. Sources (Research)

- [Fishbrain UX & Map Features](https://fishbrain.com/features) — map-first layout, layered data, color-coded recency
- [Fishbrain Help Center — Map](https://fishbrain.helpshift.com/hc/en/3-fishbrain---social-fishing-forecast-app/faq/141-the-fishbrain-map---what-it-is-and-how-to-use-it/) — AI spot prediction, drill-down UX
- [Map UI Patterns — Cluster Marker](https://mapuipatterns.com/cluster-marker/) — zoom-dependent clustering
- [UX Patterns for Maps — Heatmap](https://ux-patterns.webgeodatavore.com/heatmap/index.html) — when heatmap beats pins
- [Waze Icons & Symbols — Ridester](https://www.ridester.com/waze-icons/) — discrete iconography for actionable reports
- [Waze New Hazard Icons 2024 — HAAS Alert](https://www.haasalert.com/blog/new-waze-icons-2024) — modern iconography conventions
- [Offline-First Request Handling — Medium](https://medium.com/@abdurrehman1/offline-first-request-handling-in-react-native-online-calls-queues-automatic-sync-dca53708e863) — RN queue architecture
- [React Native Offline First App Development — Relevant](https://relevant.software/blog/react-native-offline-first/) — sync engine patterns
- [Creating an offline-first React Native app — LogRocket](https://blog.logrocket.com/creating-offline-first-react-native-app/) — UX feedback patterns
- [Strava Brand Color Palette — Mobbin](https://mobbin.com/colors/brand/strava) — navy-blue recommendation for water/outdoors
- [Outdoor Map Design with Strava — Mapbox Blog](https://blog.mapbox.com/outdoor-map-design-and-styling-with-strava-133929a40398) — ColorBrewer, gradient-based styling

---

## 8. Next Step

Feed this document into Phase 0.5 implementation plan: build `packages/ui` with these tokens + Storybook + primitive components before any feature code.
