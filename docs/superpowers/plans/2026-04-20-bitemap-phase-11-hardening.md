# BiteMap Phase 11 — Hardening + UX Polish (Detailed TDD Plan)

**Tag:** `v0.15.5-hardening`

**Important:** This phase no longer tags `v1.0.0`. The original Phase 11 plan did, but two hard blockers now sit between this phase and launch:
1. **Phase 12 — Production Data Integrity Audit** (`v0.16.0-data-audit`)
2. **Phase 13 — Security Hardening** (`v0.17.0-security`)

Phase 11 focuses on observability, UX polish, content, pipelines, and store-submission prep. The actual v1.0.0 tag happens at the end of Phase 13 once a clean pen-test pass is secured.

**Goal:** Error monitoring, analytics, rate limiting, accessibility, legal pages, deployment pipelines, app-store listings. Execute spec verification plan end-to-end.

**Infra gate (resolved in-repo, Apr 2026):** Phase 11 was intentionally **paused** until operators had Vercel + Sentry + EAS accounts. Sentry (`@sentry/nextjs` + `@sentry/react-native`), `eas.json`, and Dependabot are now in the repo — **resume Phase 11** for PostHog, legal, a11y, remaining gap injects, and tagged verification.

**Tech Stack:** Sentry (mobile + web), PostHog (or Supabase analytics), `jest-axe` + Playwright a11y, EAS Build + TestFlight + Play Internal Testing, Vercel.

---

## File Structure

```
apps/mobile/
├── app.json                 (build number, versionCode bumps)
└── src/telemetry/
    ├── sentry.ts
    └── posthog.ts

apps/web/
├── next.config.ts           (sentry wrap)
└── src/telemetry/

apps/web/src/app/(legal)/
├── privacy/page.mdx
└── terms/page.mdx

eas.json
```

---

## Task 11.1 — Sentry Wiring

- [x] **Mobile:** `@sentry/react-native` + Expo config plugin + Metro `withSentryConfig`; init from `app/_layout.tsx` via `src/observability/sentry.ts`. (Replaces legacy `sentry-expo` naming in older plans.)
- [x] **Web:** `@sentry/nextjs` + `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` + `src/instrumentation.ts` + `global-error.tsx`; **`tunnelRoute: /monitoring`**.
- [x] Env: `EXPO_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` (documented in `.env.example`).
- [ ] **Smoke:** throw a synthetic error → appears in Sentry dashboard (operator run after DSN pasted).
- [ ] **Source maps:** optional `SENTRY_AUTH_TOKEN` + org/project on Vercel / EAS for readable stacks.

---

## Task 11.2 — Product Analytics

- [ ] PostHog project init; install `posthog-react-native`, `posthog-js`.
- [ ] **Events** (minimum):
  - `sign_up`
  - `sign_in`
  - `catch_posted` (with species_category, privacy_level, online/offline)
  - `map_opened`
  - `filter_applied`
  - `follow_added`
  - `comment_posted`
  - `like_added`
- [ ] Respect user opt-out (setting toggle in profile edit).

---

## Task 11.3 — Rate Limiting on `post-catch`

- [ ] **Unit test**

```ts
test('61 reports in one minute: 61st rejected', async () => {
  for (let i = 0; i < 60; i++) await invoke('post-catch', validInput);
  await expect(invoke('post-catch', validInput)).rejects.toThrow(/rate limit/i);
});
```

- [ ] **Implementation:** Supabase Edge Function middleware storing rolling-window counts per user in a `rate_limits` table OR using Supabase KV. Window: 60 requests / 60 seconds.

- [ ] On 429: return JSON `{ error: 'rate_limit', retry_after_seconds: N }`. Client shows "Whoa, slow down" toast.

---

## Task 11.4 — Accessibility Pass

- [ ] **Mobile** — manual VoiceOver + TalkBack walkthrough on:
  - Sign-up flow
  - Map tap + pin → sheet
  - Catch report 3-tap flow
  - Profile edit
- [ ] Every `Pressable` has `accessibilityLabel` + `accessibilityRole`
- [ ] Map pins: `accessibilityLabel` reads "Snapper caught 2 hours ago by @username"

- [ ] **Web** — Playwright + `@axe-core/playwright`:
  - Zero violations on `/`, `/sign-in`, `/species`, `/report`, `/profile/[username]`, `/leaderboard`

---

## Task 11.5 — Legal Pages

- [ ] `/legal/privacy` — drafted in MDX. Must state:
  - What data is collected (email, GPS, photos, usage)
  - Retention of catches (48h visible, indefinite in own logbook)
  - Third parties: Supabase, Mapbox, BOM, WorldTides, Sentry, PostHog
  - User rights: delete account, export data (Supabase auth admin API)
- [ ] `/legal/terms` — drafted in MDX. Community code of conduct, flagging, admin moderation rights.
- [ ] Mobile app: link to web-hosted legal from Settings.

---

## Task 11.6 — Deployment Pipelines

- [ ] **Web:** Vercel project linked; `main` auto-deploys to production; PRs deploy preview (operator-owned; `apps/web/vercel.json` sets monorepo install/build).
- [x] **Mobile:** EAS Build profiles — `development`, `preview`, `production` in `apps/mobile/eas.json` (CLI ≥ 16; `appVersionSource: remote`). Profiles differ slightly from the sketch below — keep `eas.json` as source of truth.
- [ ] **Submit:** `eas submit --platform ios` (TestFlight), `--platform android` (Play Internal Testing).

<details>
<summary>Reference `eas.json` sketch (older plan — compare to repo)</summary>

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "ios": { "simulator": false }, "android": { "buildType": "apk" } },
    "production": { "autoIncrement": true }
  },
  "submit": { "production": {} }
}
```

</details>

---

## Task 11.7 — App-Store Listings (draft — submission manual)

**iOS App Store:**
- Name: BiteMap — Fishing Tracker
- Subtitle: Free. Community. Real-time.
- Keywords: fishing, tides, species, port phillip, anglers, reports, snapper, whiting, flathead
- Screenshots: map, report, species, profile, leaderboard (6.5" + 5.5" sizes)
- Description: 4 paragraphs; explicit "free forever, no paywall" wedge

**Google Play:** equivalent assets and descriptions.

---

## Task 11.8 — Execute Spec Verification Plan End-to-End

Run all 7 items from `docs/superpowers/specs/2026-04-20-bitemap-design.md` Verification Plan:

- [ ] 1. Post a catch on mobile → pin appears on map within 5s
- [ ] 2. Post with "area" privacy → exact GPS not exposed in API response
- [ ] 3. Catch with `expires_at = now() + 1m` disappears from map after 61s
- [ ] 4. Anonymous user: map readable without login; "+" button requires auth
- [ ] 5. Offline: disable network, create report, re-enable → auto-syncs
- [ ] 6. Tap a species → correct VIC legal size + bag limit
- [ ] 7. Tide chart loads for nearest tidal station

All 7 must pass on a **TestFlight / Play Internal** build (not local dev).

---

## Task 11.9 — 30-min Smoke Test

- [ ] Open app
- [ ] Sign up
- [ ] Post 5 catches across all privacy levels
- [ ] Follow another user
- [ ] Like + comment on their catch
- [ ] Check Sentry for errors: must be **zero** unhandled
- [ ] Check Storage: avatars + photos stored as expected

---

## Task 11.10 — Tag Phase 11 and hand off to Phase 12

- [ ] `git tag v0.15.5-hardening`
- [ ] **Do NOT ship to public app stores yet.** Phase 12 (data audit) and Phase 13 (security) are hard blockers for v1.0.
- [ ] TestFlight / Play Internal builds are fine for private beta.
- [ ] Open the Phase 12 plan at `docs/superpowers/plans/2026-04-20-bitemap-phase-12-data-audit.md` and begin the data-audit sweep.

---

## Competitor-gap injects (MUST SHIP in this release)

Merged from `docs/superpowers/plans/2026-04-20-bitemap-competitor-gap-backlog.md`.

### Task 11.11 — Video-based onboarding tutorials

**Competitor reference:** Omnia Fishing, Smart Fishing Spots, onX Fish.

- [ ] 3 short (≤30s each) in-app video clips:
  - Logging your first catch
  - Using offline mode / reconnection
  - Privacy settings (exact / area / hidden)
- [ ] Host on Supabase Storage bucket `onboarding-videos/` (public-read) or YouTube unlisted with fallback.
- [ ] First-run: auto-play the "first catch" video on the post-signup landing; subsequent two play on natural contextual triggers (first offline queue, first time opening privacy setting).
- [ ] Skip + "don't show again" persisted per profile.
- [ ] Content production effort > engineering. Budget 2 days filming.

### Task 11.12 — Shark / marine-hazard alert layer

**Competitor reference:** SharkSmart, Dorsal, SafeWaters.ai.

- [ ] Edge Function `fetch-marine-hazards`: polls SharkSmart NSW (official feed), Dorsal (community crowdsourced), BOM small-craft warnings. Normalises into a single `marine_hazards` table:
  ```sql
  create table public.marine_hazards (
    id uuid primary key default uuid_generate_v4(),
    source text not null check (source in ('sharksmart_nsw','dorsal','bom')),
    kind text not null,     -- 'shark_sighting','strong_current','warning','rip'...
    lat double precision,
    lng double precision,
    radius_km numeric(6,2),
    title text,
    details text,
    fetched_at timestamptz default now(),
    expires_at timestamptz default (now() + interval '14 days')
  );
  ```
- [ ] Cron: every 15 min.
- [ ] Map overlay: discrete amber band for warnings, red dot for sightings. Tap → detail card with source + freshness timestamp.
- [ ] Auto-expire at 14 days to avoid stale panic.
- [ ] Port Phillip specific: VIC doesn't have an official SharkSmart feed yet — show BOM + Dorsal only. Document gap.

### Task 11.13 — Offline map tile download

**Competitor reference:** AllTrails offline parks, OnX Hunt, FishTrack, iNaturalist.

- [ ] User picks a region (zoom 8 to zoom 14) → Mapbox Offline Regions API downloads tile pack (~20-50 MB per region).
- [ ] Persisted in mobile app storage; 5 regions max per user.
- [ ] Rate limit: 1 download per region per 30 days to keep Mapbox tile costs bounded.
- [ ] Settings screen shows downloaded regions + size + "Delete" button.
- [ ] Full offline catch flow (not just queue) works within downloaded regions — map renders, existing cached catches render, new catches enqueue. Web: deferred (desktop usage patterns differ).

### Task 11.14 — Regulatory-data annual refresh job (cross-cutting)

**Source:** competitor-gap backlog "cross-cutting" bullet.

- [ ] Supabase cron `regs-annual-refresh`: runs Dec 1 each year.
- [ ] Pulls latest VFA + NSW DPI + QLD Fisheries public data (manual URLs listed in the migration).
- [ ] Diffs against `species_regulations`; upserts changed rows; marks affected species.
- [ ] In-app banner for affected users on next launch: "Fishing regulations updated for VIC on Dec 1, 2026 — review changes on [species]." (retained 14 days then auto-clears.)

### Task 11.15 — Free-forever audit (cross-cutting release checklist)

**Source:** competitor-gap backlog "cross-cutting" bullet.

Before every release tag, run the following checklist and commit the result as `docs/qa/free-forever-audit-{tag}.md`:
- [ ] Every core feature (map, catch report, species, tide, leaderboard, profile) is fully available with zero payment.
- [ ] No Pro-only feature rendered as a locked UI affordance anywhere in the app.
- [ ] Any paid surface (merch shop, affiliate links, guide booking) is clearly separated from the feature chrome.
- [ ] The "Settings → About" screen lists the free-forever commitment verbatim.

---

## Phase 11 Acceptance

Core:
- [ ] All 7 spec-verification items pass on TestFlight + Play Internal builds
- [ ] Sentry reports zero unhandled errors on 30-min smoke
- [ ] Rate-limit test passes
- [ ] Playwright axe: zero violations
- [ ] Legal pages live + linked from Settings
- [ ] Vercel production deploy green
- [ ] TestFlight build installable + catch flow succeeds end-to-end

Gap injects:
- [ ] 3 onboarding videos play inline (skip + don't-show-again persist)
- [ ] Marine-hazard layer toggles on map; BOM warnings render; stale data auto-expires at 14d
- [ ] Offline map tile download + full offline catch logging verified in airplane mode
- [ ] Regulatory refresh cron dry-run succeeds (test mode against fixture data)
- [ ] Free-forever audit checklist committed

Release:
- [ ] `v0.15.5-hardening` tag pushed
- [ ] Phase 12 (data audit) plan opened

