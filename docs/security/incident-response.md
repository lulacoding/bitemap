# BiteMap — Incident Response Runbook

Phase 13 artefact. Owner: primary maintainer (initial: @lulacoding). Update roster every 6 months.

## Severity tiers

| Tier | Example | Target time to first response |
|------|---------|-------------------------------|
| SEV-1 | Active data breach, credential leak, RLS bypass in the wild | < 30 min |
| SEV-2 | 5xx rate > 5% for 15 min, auth sign-in storm > 200/min, RLS denial storm > 50/min | < 2 hours |
| SEV-3 | Elevated error rate (1-5%), single-user outage, delayed Realtime | < 1 business day |
| SEV-4 | Cosmetic / a11y regression, minor query slowdown | next release |

## On-call rotation

- v1.0 → primary maintainer on-call 24/7.
- When a secondary maintainer joins: rotate weekly.
- Pager: SMS + email from Supabase Log Alerts + Sentry issue-grade rules.

## SEV-1 checklist

1. **Declare.** Post "SEV-1 incident: {one-line summary}" in the team channel. Start a Google Doc log.
2. **Contain.** Rotate the affected secret(s) immediately:
   - Supabase anon key (if leaked) → regenerate in dashboard; deploy new env var
   - Supabase service role (if leaked) → regenerate; rotate Edge Function env vars
   - Mapbox token (if leaked) → regenerate at account.mapbox.com/access-tokens
3. **Evidence.** Snapshot Supabase logs for the relevant 4-hour window. Export Sentry issue to PDF.
4. **Comms.** If user data exposure is confirmed → NDB (Notifiable Data Breach) obligation under the AU Privacy Act 1988 kicks in. 30-day assessment window. Email template: `docs/security/ndb-template.md` (draft when first incident hits).
5. **Fix.** Patch the root cause. Add a regression test.
6. **Post-mortem.** Within 7 days. Public write-up on the release notes if user data was affected.

## SEV-2 checklist

1. Acknowledge in the team channel within 2 hours.
2. Open a GitHub issue tagged `sev-2`.
3. Identify root cause via Supabase Log Explorer + Sentry.
4. Patch + deploy within 48 hours or escalate to SEV-1.

## Supabase Log Alerts (install when production account is provisioned)

- **RLS denial storm**: `rls_denied_count > 50 per minute for 5 minutes` → SEV-2 alert.
- **5xx rate**: `http_5xx / http_total > 0.05 for 15 minutes` → SEV-2 alert.
- **Auth sign-in storm**: `auth_failure_count > 200 per minute` (possible credential stuffing) → SEV-1 alert.
- **Catches INSERT storm**: `catches_insert_count > 60 per minute for any single user` → investigate rate-limit circumvention.

## Rollback

- **Database migration**: `supabase db reset` locally + fast-forward restore from the most recent backup via the Supabase dashboard. Never run `DROP TABLE` in prod.
- **Web**: `vercel rollback` to the previous deployment.
- **Mobile**: OTA rollback via EAS Update. If an app-binary ships a regression, TestFlight + Play Internal → pull + resubmit; users on the live binary receive the rollback via OTA until the new binary is reviewed.

## Quarterly backups

- `pg_dump` the full DB to encrypted offline storage (S3 with SSE-KMS).
- Test restore every 6 months to a throwaway Supabase project. Document the test in `docs/security/backup-restore-test-{year}-{quarter}.md`.

## External dependencies — what can take us down

| Provider | Risk | Fallback |
|----------|------|----------|
| Supabase | Full outage | No fallback; users see an offline banner |
| Mapbox | Tile outage | Fallback to OSM raster if Mapbox token is revoked (unimplemented; add to P13.1) |
| Open-Meteo | Outage | Tide + weather cards show "data unavailable" with cached last-known values |
| Resend (email) | Outage | Email-based flows (CSV export delivery) queue with retry |

## Annual review

Every April, re-read this runbook with fresh eyes + the latest incident log. Update severity definitions and on-call roster.
