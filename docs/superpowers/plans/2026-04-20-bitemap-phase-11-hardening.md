# BiteMap Phase 11 — Hardening + Launch (Detailed TDD Plan)

**Goal:** Ship-readiness. Error monitoring, analytics, rate limiting, accessibility, legal pages, deployment pipelines, app-store listings. Execute spec verification plan end-to-end.

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

- [ ] **Mobile:** install `sentry-expo`, init in `App.tsx`; capture unhandled JS + native crashes; sourcemaps uploaded via EAS post-build hook.
- [ ] **Web:** `@sentry/nextjs`, `sentry.client.config.ts`, `sentry.server.config.ts`; tunnel route to avoid ad-block.
- [ ] Env: `EXPO_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`.
- [ ] Smoke: throw a synthetic error → appears in Sentry dashboard.

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

- [ ] **Web:** Vercel project linked; `main` auto-deploys to production; PRs deploy preview.
- [ ] **Mobile:** EAS Build profiles — `development`, `preview`, `production`. `eas.json`:

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

- [ ] **Submit:** `eas submit --platform ios` (TestFlight), `--platform android` (Play Internal Testing).

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

## Task 11.10 — Tag & Ship

- [ ] `git tag v1.0.0`
- [ ] Announce to Port Phillip Bay fishing Facebook groups
- [ ] Monitor Sentry + PostHog for 72 hours

---

## Phase 11 Acceptance

- [ ] All 7 spec-verification items pass on TestFlight + Play Internal builds
- [ ] Sentry reports zero unhandled errors on 30-min smoke
- [ ] Rate-limit test passes
- [ ] Playwright axe: zero violations
- [ ] Legal pages live + linked from Settings
- [ ] Vercel production deploy green
- [ ] TestFlight build installable + catch flow succeeds end-to-end
- [ ] `v1.0.0` tag pushed
