# BiteMap — How to run it

This doc is the fastest path from "fresh checkout" to "app loads in a browser".

## Prerequisites

- Node 20+ (via nvm or similar)
- pnpm 9+ — `npm i -g pnpm`
- Docker Desktop running
- Supabase CLI — `brew install supabase/tap/supabase`
- Xcode (iOS simulator) or Android Studio (emulator) if you want to run mobile

## One-time setup

```bash
cd "portphilipfishtracker app"
pnpm install                 # installs monorepo workspaces
supabase start               # boots local Postgres + GoTrue + Storage + Realtime + Studio
supabase db reset            # applies every migration + seed.sql
```

Env files are provided already wired to the local Supabase stack:
- `apps/web/.env.local`
- `apps/mobile/.env`

Both have the Supabase URL + anon key pre-populated. Mapbox token is blank —
the map will render a "Map not available" placeholder until you paste a token
from https://account.mapbox.com/access-tokens.

## Run the web app

```bash
pnpm --filter web dev
```

Open http://localhost:3000

Sign up → check the Supabase Studio Inbucket tab (http://localhost:54324)
for the confirmation email, click the link, you're in.

## Production web (Vercel)

Deployed app: https://bitemap-joz2xyiia-lulacodings-projects.vercel.app

Use the same `NEXT_PUBLIC_*` env vars in the Vercel project as in `apps/web/.env.local`. In **Supabase → Authentication → URL configuration**, add this origin to **Redirect URLs** (and set **Site URL** to it if production is the primary entry). In **Mapbox → token URL restrictions**, allow this exact origin (wildcards are not supported).

## Run the mobile app (iOS simulator)

**Important:** Expo’s native project must live under `apps/mobile/`, not the monorepo root. If you ever ran `expo prebuild` or `expo run:ios` from the repo root, delete stray folders first:

```bash
# from the monorepo root (same folder as this repo's package.json)
rm -rf ios android
```

**First native build (Mapbox + custom dev client):** from the repo root:

```bash
pnpm ios
```

That runs `expo run:ios` with `PROJECT_ROOT` = `apps/mobile` (fixes `EXConstants` “Generate app.config” failures caused by a root-level `app.json` stub).

**Metro only (after a dev build is installed):**

```bash
pnpm --filter mobile start
```

Expo dev tools open. Press `i` for iOS simulator, `a` for Android emulator.

For a **physical device** you need to replace `127.0.0.1` in `apps/mobile/.env`
with your Mac's LAN IP (find via `ipconfig getifaddr en0`). Phones cannot
reach 127.0.0.1 on your Mac.

## What's running where

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| Supabase API | http://127.0.0.1:54321 |
| Supabase Studio | http://127.0.0.1:54323 |
| Mailpit (dev mail inbox) | http://127.0.0.1:54324 |
| Supabase DB (direct) | postgresql://postgres:postgres@127.0.0.1:54322/postgres |

## Useful checks

```bash
pnpm turbo typecheck                  # everything
pnpm --filter @bitemap/shared test    # 124 unit tests
supabase test db                      # 47 pgTAP tests
pnpm --filter web build               # production build sanity
```

## First run — no catches yet

When the DB is fresh, the map shows "No catches logged yet — head to /report
to be the first." Sign up, log a catch, it should appear on the map within 5s
via Supabase Realtime.

## Before shipping to production

The items blocked on external accounts (pen-test, Sentry, Vercel, EAS, app
stores) are listed in `.claude/context/status.md`. Do not tag `v1.0.0` until
the Phase 13 pen-test passes.
