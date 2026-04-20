# BiteMap Phase 13 — Security Hardening (Cybersecurity Audit)

**Purpose:** Treat BiteMap as if attackers are already looking. Audit every data path — client → server → DB — from a red-team mindset. Remediate every finding. v1.0 does not ship until this phase passes a self-audit and an external pen-test pass.

**Tag:** `v0.17.0-security`

**Blocking:** v1.0.0 launch cannot happen until every acceptance item here is green. This is non-negotiable.

**Threat model scope:**
- Authenticated user attackers (standard app user + session token)
- Anonymous / unauthenticated attackers
- Malicious client (compromised or modified app binary)
- Supply-chain attacks (compromised dependency)
- OOB attacks: SSRF, open-redirect, credential stuffing

---

## Task 13.1 — Row Level Security audit (every table)

Write pgTAP tests that attempt every forbidden operation. Each must reject with `42501` (permission denied) or return empty rows.

For every table in `public`:
- [ ] **SELECT**: anon can only read rows that are publicly intended (species, species_regulations, marine_parks, non-hidden non-expired catches). Anon must NOT read profiles (except public fields), saved_spots, follows, catch_likes, catch_comments on private catches.
- [ ] **INSERT**: user can only insert rows with `user_id = auth.uid()`. Attempts with a foreign `user_id` rejected.
- [ ] **UPDATE**: user can only update their own rows (`user_id = auth.uid()`). Catches: user may not change `created_at`, `expires_at`, `like_count`, `comment_count`, `flag_count`, `is_hidden` (these are maintained by triggers/moderation).
- [ ] **DELETE**: user may delete their own rows. Soft-delete preferred for catches (set `is_hidden = true`) so historical records persist.

Write tests in `supabase/tests/security_rls.test.sql`. Structure:
```sql
-- As user A, try to read user B's saved_spot. Must return 0 rows.
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"USER-A-UUID","role":"authenticated"}';
SELECT is_empty($$SELECT * FROM saved_spots WHERE user_id = 'USER-B-UUID'$$,
                'User A cannot read User B saved_spots');
```

- [ ] At least 3 tests per (table × operation) pair. Target: ≥80 new pgTAP tests.

## Task 13.2 — Server-side privacy-snap enforcement (close the Phase 5 hole)

The current `createCatch` applies privacy snap client-side only. A malicious client can send `privacy_level='area'` with raw GPS and bypass the snap.

- [ ] Create DB trigger `trigger_snap_privacy()` that runs `BEFORE INSERT OR UPDATE ON catches`. Trigger re-applies the snap on server side:
  - `area` → round lat/lng to nearest 1 km grid cell
  - `hidden` → set `is_hidden = true`
  - `exact` → leave coords
- [ ] pgTAP test: INSERT with `privacy_level='area'` + raw 6-decimal lat/lng. After INSERT, stored coords match the server-side snap, NOT the client-sent values.
- [ ] Remove client-side snap once trigger is verified (server truth-of-record).

## Task 13.3 — Input validation every boundary

Every external input must parse through a Zod schema. Reject + 400 on parse failure; never pass user bytes directly to Postgres or the UI.

- [ ] Every Supabase query helper already has Zod input validation — audit and confirm coverage for `createCatch`, any future `createProfile`, `createComment`, `toggleLike`, `follow`, `savedSpot` mutations.
- [ ] Every URL query parameter read with `useSearchParams` or `useLocalSearchParams` parses through Zod before use.
- [ ] Every form parses through Zod before calling the mutation; buttons disable on invalid state.
- [ ] No implicit `any` on API boundaries (`pnpm typecheck` already enforces strict).
- [ ] Size limits on every text field: `common_name ≤ 80`, `location_name ≤ 120`, `bait_used ≤ 80`, `technique ≤ 40`, `bio ≤ 280`, `comment ≤ 500`.

## Task 13.4 — Output sanitisation (XSS audit)

- [ ] Search codebase for unsafe HTML-injection APIs (e.g. React's `dangerouslySet` prop, any direct `innerHTML` assignment in browser code, `WebView` with inline HTML). Every hit must pass through DOMPurify or a fixed allow-list builder. Currently used in `apps/web/src/map/MapView.tsx` Mapbox popup — high-priority fix target.
- [ ] Fix the popup: build DOM via `document.createElement` + `textContent` instead of string interpolation, OR pass catch data through `DOMPurify.sanitize()` first.
- [ ] React Native `Text` component is XSS-safe by default — verify no `WebView` with unsafe sources.
- [ ] Content-Security-Policy headers on the Next.js web app:
  `default-src 'self'; img-src 'self' *.supabase.co *.mapbox.com data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' *.supabase.co marine-api.open-meteo.com api.open-meteo.com api.mapbox.com events.mapbox.com`.
  Set via `next.config.js` `headers()`.

## Task 13.5 — Auth hardening

- [ ] Email verification enforced before any INSERT on catches / comments / likes / follows. Add `profile_verified_at` check to RLS policies.
- [ ] Session token storage: mobile uses `expo-secure-store` (already wired), web uses Supabase SSR httpOnly cookies. Verify no session token leaks to `AsyncStorage` / `localStorage`.
- [ ] Sign-out clears all persisted state (react-query cache invalidation + `resetSupabaseClient()` call).
- [ ] OAuth redirect URL whitelist: only official dev + prod URLs. Pin in Supabase Auth settings. Document in `docs/deployment.md`.
- [ ] Rate limit sign-in attempts: Supabase handles baseline; add CAPTCHA (hCaptcha free tier) on the sign-up form to block automated abuse.
- [ ] Password policy: Supabase default (≥6 chars) is weak — require ≥10 chars with a mix of classes. Enforce client-side + add DB check constraint.

## Task 13.6 — Secret management

- [ ] `git log -p -- '**/*.env' '**/secrets.*'` returns empty. Any historical secret is rotated.
- [ ] Commit hooks: pre-commit runs `gitleaks` scan; pre-push blocks on `.env` or private-key patterns.
- [ ] CI uses masked secrets only. No secret echoed to logs.
- [ ] Production service-role key only used in Edge Functions, never shipped to clients.
- [ ] Annual rotation schedule documented: anon key, service role, Mapbox token, Supabase JWT secret.

## Task 13.7 — Rate limiting & abuse controls

- [ ] Supabase rate-limit policy on auth endpoints: already enforced baseline.
- [ ] Custom rate limit on `createCatch`: max 20 catches / user / day, enforced by Edge Function + DB trigger. Humans fish, bots spam.
- [ ] Custom rate limit on `catch_comments`: max 50 / user / day.
- [ ] Custom rate limit on `catch_likes`: max 500 / user / day.
- [ ] Abuse signals: `flag_count ≥ 3` auto-hides a catch pending moderation. Implemented via trigger on `catch_flags` insert (new table).
- [ ] Account shadow-ban flag on profiles: `profiles.is_shadowbanned boolean default false`. Shadowbanned user's new catches visible only to themselves.

## Task 13.8 — Dependency + supply-chain security

- [ ] `pnpm audit` zero high/critical. Document any deferred mediums with mitigation.
- [ ] Enable Dependabot on the GitHub repo: daily JS ecosystem scans, PRs auto-generated.
- [ ] Pin all dependency versions in `package.json` (remove `^` for direct deps; keep for dev deps is OK).
- [ ] `.npmrc` set `package-lock=true` enforce + reproducible installs via `pnpm install --frozen-lockfile` in CI.
- [ ] Verify no typosquat packages: review `package.json` against common typosquat lists.
- [ ] Subresource Integrity (SRI): every `<script src>` or `<link rel="stylesheet">` in web index has `integrity="sha384-..."` attribute.

## Task 13.9 — Network & transport

- [ ] All external APIs hit over HTTPS only (already enforced by Open-Meteo, Supabase, Mapbox). Validate no `http://` anywhere in source.
- [ ] HSTS header on web responses: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
- [ ] Next.js `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.
- [ ] Mobile app: `NSAppTransportSecurity` / `android:usesCleartextTraffic="false"` enforced.

## Task 13.10 — Photo upload hardening (will land when photo upload ships in v0.10.1)

- [ ] MIME type whitelist on Storage bucket: `image/jpeg`, `image/png`, `image/webp` only.
- [ ] File size cap: 5 MB per upload, enforced by bucket policy + client compression (target ≤500 KB after compression).
- [ ] Filename normalised: `catch-photos/{user_id}/{client_uuid}.jpg`. User-provided filenames dropped.
- [ ] Strip EXIF on upload (`expo-image-manipulator` + mozjpeg): prevents GPS leakage through image metadata.
- [ ] Virus scan: Supabase doesn't provide one. Gate uploads through a Cloudflare Worker or similar that runs ClamAV before marking the object public. (Optional for v1 if upload scope is recreational; mandatory if used for any commercial / guide feature.)

## Task 13.11 — Privacy & compliance (AU Privacy Act + GDPR-equivalent)

- [ ] Data retention: catches expire at 48h (already enforced). `catches_archive` table preserves an anonymised record (no lat/lng, no user_id) for 2 years for analytics.
- [ ] User data export: `GET /api/export` endpoint returns a signed-URL ZIP of every row belonging to the authenticated user (profile, catches, saved_spots, comments, follows).
- [ ] User account deletion: hard-deletes profile + cascade (ON DELETE CASCADE already in schema). Photos purged from Storage. Confirmation email sent.
- [ ] Privacy policy + terms written; displayed on sign-up; link in app Settings.
- [ ] Cookie consent banner on web for analytics (opt-in).
- [ ] Notifiable Data Breach (NDB) procedure documented in `docs/incident-response.md`.

## Task 13.12 — Monitoring & incident response

- [ ] Sentry wired on web + mobile (already in Phase 12 scope — integrate here).
- [ ] Structured logging on every Edge Function with request IDs.
- [ ] Supabase Log Explorer alerts:
  - Any RLS denial rate > 10/min (possible attack)
  - Any 5xx rate > 1% sustained 5 min
  - Any auth-sign-in failure rate > 50/min (credential stuffing)
- [ ] Runbook `docs/security/incident-response.md`: on-call, escalation, comms template, rollback steps.
- [ ] Quarterly backups of the DB downloaded to offline storage. Test restore every 6 months.

## Task 13.13 — External pen-test pass

- [ ] Engage a third-party pen-tester (or a trusted security engineer in the community) for a one-week black-box assessment.
- [ ] Give them a dev tenant + a user account. No access to source.
- [ ] Remediate every High / Critical finding before tagging this phase. Document Medium findings as open GitHub issues with timeline.
- [ ] Cross-check findings against OWASP Mobile Top 10 + OWASP API Top 10.

## Phase 13 Acceptance

- [ ] ≥80 new pgTAP tests covering every table × operation pair.
- [ ] Server-side privacy snap trigger installed + tested.
- [ ] XSS audit clean; no unsafe HTML injection APIs without sanitisation.
- [ ] CSP + HSTS + Referrer-Policy headers on every web response.
- [ ] `pnpm audit`: zero high/critical.
- [ ] Dependabot enabled and clean.
- [ ] Rate limits implemented on sign-in, createCatch, comments, likes.
- [ ] Email verification + shadowban flags live.
- [ ] Pen-test report attached: zero High / Critical open, Medium findings documented.
- [ ] Incident-response runbook committed.
- [ ] Tag `v0.17.0-security`.

**Only after this tag may the v1.0.0 tag cut.**

---

## Ongoing after v1.0

Security is a practice, not a phase. These continue forever:

- Dependabot daily
- `pnpm audit` weekly in CI (fail on new high/critical)
- Supabase RLS policy review every release
- Log alert on-call rotation
- Annual secret rotation
- Annual pen-test re-engagement
- Quarterly threat-model review with any new feature category (social DMs, live broadcast, photo upload, guide booking — each reopens parts of this audit)
