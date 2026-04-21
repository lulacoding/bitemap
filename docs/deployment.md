# BiteMap — deployment & environments

## Web (Vercel)

- **Root directory:** `apps/web`
- **Install / build:** configured in `apps/web/vercel.json` (monorepo `pnpm` + Turborepo).
- **Required environment variables (production):**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_MAPBOX_TOKEN`
  - `NEXT_PUBLIC_SENTRY_DSN` (optional but recommended)
  - `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` (optional product analytics)
  - `NEXT_PUBLIC_WEB_APP_URL` (optional; defaults to production Vercel URL in shared `getWebAppBaseUrl()`)

## Mobile (EAS)

- Project directory: `apps/mobile` (`eas.json` present).
- **Required:** `EXPO_PUBLIC_SUPABASE_*`, `EXPO_PUBLIC_MAPBOX_TOKEN`, `EXPO_PUBLIC_WEB_APP_URL` (legal links), optional `EXPO_PUBLIC_POSTHOG_*`, `EXPO_PUBLIC_SENTRY_DSN`.
- **Mapbox native SDK:** set `RNMapboxMapsDownloadToken` (EAS secret + app config) for reliable iOS builds.

## Supabase (hosted)

- Apply migrations: `supabase link` then `supabase db push`.
- **Auth:** add every deployed web origin (Vercel + localhost) to redirect allow list.
- Migrations are **not** applied by Vercel; run CLI or CI after schema changes.

## CI

- `pnpm turbo lint typecheck test build`
- `node scripts/phase12-text-audit.mjs` — blocks `mockCatches` / `MockCatch` / raw `TODO:` in app and package source.

## Local dev

See `RUNBOOK.md`. Copy `.env.example` to `apps/web/.env.local` and `apps/mobile/.env`.
