# BiteMap Phase 10 — Leaderboard (Detailed TDD Plan)

**Goal:** Leaderboards by species, by area, by season (current month). Refreshed every 10 min. Ranks by catch count with size_mm tiebreak.

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

## Phase 10 Acceptance

- [ ] Unit: tiebreak function matches SQL ordering
- [ ] Integration: post catch → leaderboard row updates on next `refresh_leaderboards()` run
- [ ] Integration: forcing `select refresh_leaderboards()` manually produces expected counts
- [ ] E2E: switch tabs → correct ordering renders
- [ ] E2E: own row pinned when outside top 50
- [ ] Tag `v0.10.0-leaderboard`
