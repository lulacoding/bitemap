# BiteMap Phase 10 — Leaderboards + Rare-Catch Alerts + Citizen Science Hooks

**Tag:** `v0.15.0-leaderboard`

**Goal:** Leaderboards by species, by area, by season (current month). Refreshed every 10 min. Ranks by catch count with size_mm tiebreak. Plus gap injects: rare-catch rarity scoring + alerts, expert ID verification, seasonal range maps, historical timelines, taxonomy, Claude Vision photo ID with confidence, tournament import, streak + XP.

**Tech Stack:** Postgres materialised view, `pg_cron`, `@tanstack/react-query`.

---

## File Structure

```
supabase/migrations/
└── 20260420000009_leaderboards.sql

packages/shared/src/queries/leaderboards.ts

apps/mobile/app/(app)/leaderboard.tsx
apps/web/src/app/(app)/leaderboard/page.tsx
```

---

## Task 10.1 — Materialised Views

- [ ] **Migration:**

```sql
-- Overall by species (current month)
create materialized view public.leaderboard_by_species as
select
  c.species_id,
  c.user_id,
  count(*) as catch_count,
  max(c.size_mm) as best_size_mm,
  date_trunc('month', now()) as month
from public.catches c
where c.is_hidden = false
  and c.created_at >= date_trunc('month', now())
group by c.species_id, c.user_id;

create index lb_species_idx on public.leaderboard_by_species (species_id, catch_count desc, best_size_mm desc);

-- By area (Port Phillip Bay bbox; v1 single area)
create materialized view public.leaderboard_by_area as
select
  c.user_id,
  count(*) as catch_count,
  max(c.size_mm) as best_size_mm
from public.catches c
where c.is_hidden = false
  and c.created_at >= date_trunc('month', now())
  and c.lat between -38.5 and -37.7
  and c.lng between 144.4 and 145.1
group by c.user_id;
create index lb_area_idx on public.leaderboard_by_area (catch_count desc, best_size_mm desc);

-- By season (season = current month for v1 simplicity)
create materialized view public.leaderboard_by_season as
select
  c.user_id,
  count(*) as catch_count,
  max(c.size_mm) as best_size_mm
from public.catches c
where c.is_hidden = false
  and c.created_at >= date_trunc('month', now())
group by c.user_id;
create index lb_season_idx on public.leaderboard_by_season (catch_count desc, best_size_mm desc);

-- Refresh function + cron
create or replace function public.refresh_leaderboards() returns void language plpgsql as $$
begin
  refresh materialized view concurrently public.leaderboard_by_species;
  refresh materialized view concurrently public.leaderboard_by_area;
  refresh materialized view concurrently public.leaderboard_by_season;
end; $$;

select cron.schedule('refresh-leaderboards', '*/10 * * * *', 'select public.refresh_leaderboards();');
```

---

## Task 10.2 — Query Helpers

- [ ] **Step 1: Test**

```ts
test('ranks by catch_count DESC with size tiebreak', async () => {
  const r = await getSpeciesLeaderboard('snapper-id');
  for (let i = 1; i < r.length; i++) {
    const prev = r[i-1], cur = r[i];
    expect(prev.catch_count >= cur.catch_count).toBe(true);
    if (prev.catch_count === cur.catch_count) {
      expect(prev.best_size_mm >= cur.best_size_mm).toBe(true);
    }
  }
});
```

- [ ] **Step 2: Implement**

```ts
// packages/shared/src/queries/leaderboards.ts
export async function getSpeciesLeaderboard(speciesId: string, limit = 50) {
  const { data, error } = await supabase()
    .from('leaderboard_by_species')
    .select('user_id, catch_count, best_size_mm, profile:profiles!inner(username, avatar_url)')
    .eq('species_id', speciesId)
    .order('catch_count', { ascending: false })
    .order('best_size_mm', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
export async function getAreaLeaderboard(limit = 50) { /* ... */ }
export async function getSeasonLeaderboard(limit = 50) { /* ... */ }
```

---

## Task 10.3 — Leaderboard UI

- [ ] Segmented control: By Species | By Area | By Season
- [ ] Ranked list: avatar, username, catch count, best size
- [ ] User's own row pinned at bottom if not in top N
- [ ] Empty state: "Be the first — report a catch!" (when entire leaderboard is empty)

---

## Task 10.4 — Tiebreak Helper

- [ ] **Unit test** a pure `compareEntries(a, b)` that matches SQL ordering so the UI + DB agree.

---

---

## Competitor-gap injects (MUST SHIP in this release)

Merged from `docs/superpowers/plans/2026-04-20-bitemap-competitor-gap-backlog.md`.

### Task 10.5 — Rare-catch alerts + rarity scoring

**Competitor reference:** eBird Rare Bird Alerts, iNaturalist Research Grade, Seek.

- [ ] New table `species_rarity`:
  ```sql
  create table public.species_rarity (
    species_id uuid references public.species(id) on delete cascade,
    region text not null,                   -- 'port_phillip', 'vic_coast', 'nsw_coast'...
    -- Community-corpus rarity: lower count = rarer
    catch_count_90d int default 0,
    -- Static benchmark rarity: from VFA / research literature
    rarity_tier text check (rarity_tier in ('common','uncommon','rare','extraordinary')),
    notes text,
    primary key (species_id, region)
  );
  ```
- [ ] Nightly job refreshes `catch_count_90d` from `catches` history.
- [ ] When a catch is logged and either:
  - `catch_count_90d < 5` in the relevant region, OR
  - `rarity_tier IN ('rare', 'extraordinary')`
  then fire an in-app notification: "Bonefish in Port Phillip is rare — you just contributed to citizen science!"
- [ ] New feed tab "Notable Sightings" — surfaces all `rare`/`extraordinary` catches from the last 30 days.
- [ ] Notification batch: digest, not real-time (avoid spam on popular species).

### Task 10.6 — Expert verification flow for uncertain IDs

**Competitor reference:** eBird Expert, iNaturalist Research Grade.

- [ ] `catches` column addition: `id_uncertain boolean default false` + `id_verified_by uuid[]`.
- [ ] Report-screen checkbox: "I'm not 100% sure on the species" → sets `id_uncertain = true` on insert.
- [ ] Expert queue: `profiles.is_expert boolean` (hand-granted for v1, community-elected Phase 10.5). Experts see a feed of `id_uncertain = true` catches and can vote "confirm" / "suggest-different".
- [ ] Verification granted when 2 distinct experts agree on the species (`id_verified_by` has ≥2 entries).
- [ ] Verified catches weight 2× in heatmap + AI forecast (added bias term in the density function).

### Task 10.7 — Species seasonal range maps

**Competitor reference:** eBird migration, BirdLife ranges.

- [ ] Nightly materialised view: aggregate all historical catches per species per 0.1° geohash cell per month, weighted by `flag_count = 0`.
- [ ] Render as a monthly-toggleable heatmap overlay on species detail ("Where bream are caught in July"). Reuses Phase 7 heatmap infra.
- [ ] Fallback "insufficient data" state when < 20 catches in the cell.

### Task 10.8 — Historical catch timeline per spot × species

**Competitor reference:** iNaturalist, Strava segments.

- [ ] On each `saved_spot` or POI detail:
  - Monthly catch-count bar chart (bream caught at Williamstown Pier: Jan 12, Feb 8, …)
  - "Strongest months: Dec–Feb (185 catches)" callout
- [ ] Simple SQL rollup over `catches` within 200m of the spot.

### Task 10.9 — Taxonomy + scientific names

**Competitor reference:** eBird, iNaturalist.

- [ ] Add columns to `species`:
  ```sql
  alter table public.species
    add column family text,
    add column species_order text,
    add column iucn_status text check (iucn_status in ('LC','NT','VU','EN','CR','EW','EX','DD'));
  ```
- [ ] Backfill from seed data (already have `scientific_name`).
- [ ] Render on species detail: Family: Sparidae → Order: Perciformes → IUCN: LC.
- [ ] Enables future anonymised research-corpus export (Phase 10.5 citizen science).

### Task 10.10 — Claude Vision photo-ID with confidence split

**Competitor reference:** iNaturalist Seek, Catchr, FishVerify.

- [ ] Edge Function `identify-catch-photo`: receives photo URL → calls Claude Vision → returns top-5 species with confidence %.
- [ ] Report screen: "Identify from photo" button → returns chip row: `Flathead 86%`, `Jewfish 12%`, `Other 2%`. User taps to confirm or picks their own.
- [ ] User correction logged for future prompt-tuning signal (`photo_id_corrections` telemetry table).
- [ ] Cache: same photo within 24h → free (hashed lookup).
- [ ] Cost ceiling: 500 identifications/day (monitor; raise when usage justifies).

### Task 10.11 — Tournament import/export (Weighfish / Score Fishing compatible)

**Competitor reference:** Weighfish, Score Fishing, Rippton.

- [ ] Minimal v1: import a tournament schedule JSON (Williamstown, Sandringham, Black Rock clubs) → render as calendar in the profile.
- [ ] Export: emit catches-within-tournament-window + standings CSV in a format Weighfish can ingest.
- [ ] Deferred: live leaderboard for a managed tournament (post-v1).

### Task 10.12 — Catch streak + profile XP system

**Competitor reference:** ANGLR, Rippton, Strava KOM.

- [ ] `profiles.xp int default 0`, `profiles.streak_days int default 0`, `profiles.streak_started_at date`.
- [ ] XP rules:
  - Log a catch: +10 XP
  - New species in your Pokédex: +50 XP
  - Verified by expert: +25 XP
  - Flagged or hidden by moderation: -100 XP
  - Daily streak multiplier: +2 XP/day beyond day 3
- [ ] Streak resets when no catch logged that day.
- [ ] Profile shows current streak + total XP + lifetime rank.
- [ ] **XP never gates features.** Pure cosmetic retention hook.

### Task 10.13 — Accessibility audit (cross-cutting)

Every new UI (rarity alerts, expert queue, range maps, photo-ID chips, tournament calendar, streaks) WCAG AA + 44pt + `prefers-reduced-motion`.

---

## Phase 10 Acceptance

Core:
- [ ] Unit: tiebreak function matches SQL ordering
- [ ] Integration: post catch → leaderboard row updates on next `refresh_leaderboards()` run
- [ ] Integration: forcing `select refresh_leaderboards()` manually produces expected counts
- [ ] E2E: switch tabs → correct ordering renders
- [ ] E2E: own row pinned when outside top 50

Gap injects:
- [ ] Log a rare species → in-app notification fires; row appears in Notable Sightings
- [ ] Expert verification: 2 expert votes flips `id_uncertain` false; catch weight doubles in heatmap
- [ ] Species detail: monthly range map renders (insufficient data fallback below threshold)
- [ ] Spot detail: monthly timeline bar chart renders
- [ ] Species detail shows Family / Order / IUCN
- [ ] Photo-ID flow: user uploads photo → top-5 chips render → correction logged
- [ ] Tournament import: upload JSON → calendar renders
- [ ] Streak + XP: log catches 3 days running → streak = 3; log a new species → +50 XP in real time

Release:
- [ ] Tag `v0.15.0-leaderboard`
