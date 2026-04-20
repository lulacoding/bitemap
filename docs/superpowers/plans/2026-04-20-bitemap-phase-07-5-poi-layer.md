# BiteMap Phase 7.5 — POI Layer (Boat Ramps, Bait Shops, Fuel, Jetties)

**Promoted from post-v1:** the competitor-gap analysis flagged this as HIGH priority. Australian Boat Ramp Finder covers 1500+ ramps across AU, Fishbrain Pro ships ramps + bait shops + licence vendors. Missing this is a friction wall for casual → frequent angler conversion.

**Tag:** `v0.12.5-pois`

**Sits between:** Phase 7 (filters + heatmap, DONE) and Phase 8 (profiles).

---

## File Structure

```
supabase/migrations/
└── 20260420000011_pois.sql

packages/shared/src/
├── queries/pois.ts
└── schemas/poi.ts

apps/mobile/src/map/
├── POILayer.tsx
└── POIDetailSheet.tsx

apps/web/src/map/POILayer.tsx
```

---

## Task 7.5.1 — DB schema

```sql
create table public.pois (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('boat_ramp','bait_shop','fuel','jetty','boat_hire','charter')),
  lat double precision not null,
  lng double precision not null,
  address text,
  phone text,
  hours text,            -- freeform "Mon-Sat 6am-6pm" etc
  website text,
  /** user 1-5 star ratings rollup (maintained by trigger on poi_reviews) */
  rating_avg numeric(3,2),
  rating_count int default 0,
  /** tide-height threshold in metres (NULL = no threshold) */
  tide_min_m numeric(4,2),
  /** open-to-community flag. Seeded POIs false, user-submitted true */
  user_submitted boolean default false,
  /** Source attribution (VFA, ABRF, community_submission) */
  source text default 'community_submission',
  state text default 'VIC',
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create index pois_geo_idx on public.pois using gist (ll_to_earth(lat, lng));
create index pois_category_idx on public.pois(category);
create index pois_state_idx on public.pois(state);

-- Reviews table
create table public.poi_reviews (
  id uuid primary key default uuid_generate_v4(),
  poi_id uuid not null references public.pois(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz default now(),
  unique (poi_id, user_id)  -- one review per user per POI
);

-- Quick "ramp status" pulse reports (expire 6h)
create table public.poi_status_reports (
  id uuid primary key default uuid_generate_v4(),
  poi_id uuid not null references public.pois(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('open','crowded','debris','closed')),
  notes text check (char_length(notes) <= 200),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '6 hours')
);

create index poi_status_expires_idx on public.poi_status_reports(expires_at);
create index poi_status_poi_idx on public.poi_status_reports(poi_id);

-- RLS: public read, authenticated insert
alter table public.pois enable row level security;
alter table public.poi_reviews enable row level security;
alter table public.poi_status_reports enable row level security;

create policy pois_public_read on public.pois for select to authenticated, anon using (true);
create policy pois_auth_insert on public.pois for insert to authenticated with check (auth.uid() = created_by);

create policy poi_reviews_public_read on public.poi_reviews for select to authenticated, anon using (true);
create policy poi_reviews_auth_insert on public.poi_reviews for insert to authenticated with check (auth.uid() = user_id);
create policy poi_reviews_own_update on public.poi_reviews for update to authenticated using (auth.uid() = user_id);
create policy poi_reviews_own_delete on public.poi_reviews for delete to authenticated using (auth.uid() = user_id);

create policy poi_status_public_read on public.poi_status_reports for select to authenticated, anon using (true);
create policy poi_status_auth_insert on public.poi_status_reports for insert to authenticated with check (auth.uid() = user_id);

-- Trigger: keep pois.rating_avg + rating_count in sync
create or replace function public.refresh_poi_rating() returns trigger language plpgsql as $$
begin
  update public.pois set
    rating_avg = (select avg(rating)::numeric(3,2) from public.poi_reviews where poi_id = coalesce(new.poi_id, old.poi_id)),
    rating_count = (select count(*) from public.poi_reviews where poi_id = coalesce(new.poi_id, old.poi_id))
  where id = coalesce(new.poi_id, old.poi_id);
  return coalesce(new, old);
end; $$;

create trigger poi_reviews_rating_sync
  after insert or update or delete on public.poi_reviews
  for each row execute function public.refresh_poi_rating();
```

## Task 7.5.2 — Seed: Port Phillip Bay ramps + bait shops

Seed ≥30 known boat ramps around Port Phillip Bay (from the public Parks Vic and council datasets). Examples:
- Williamstown (fee), Portsea (free), Sorrento, Mornington, Frankston, Altona, Queenscliff, St Kilda Pier.
- Add 10+ well-known bait shops (Compleat Angler chains, VFA-listed vendors).
- `source = 'vfa'` or `'parks_vic'` where known; `user_submitted = false`.

Document seeding source in a migration comment block so the Dec annual refresh cron knows where to re-sync.

## Task 7.5.3 — Query helpers

`packages/shared/src/queries/pois.ts`:
- `listPOIs({ category?, bbox?, limit? })` — bbox-scoped list
- `getPOIById(id)` — single POI with latest status reports (unexpired only) + top 5 reviews
- `submitPOI({name, category, lat, lng, ...})` — user-submitted entries (`user_submitted = true`)
- `postPOIStatus(poiId, status, notes?)` — community pulse reports
- `postPOIReview(poiId, rating, comment?)` — star ratings

All inputs Zod-validated. Types exported from `@bitemap/shared`.

## Task 7.5.4 — Map layer (mobile + web)

- Toggle via `filtersStore.layers.pois` (already wired in Phase 7).
- Render differentiated pins per category (icon set in `packages/ui/icons/poi/`):
  - Boat ramp: anchor icon, blue
  - Bait shop: fish icon, orange
  - Fuel: pump icon, yellow
  - Jetty: pier icon, grey
- Cluster at zoom < 10 to avoid visual noise.
- Tap → `POIDetailSheet` opens with:
  - Name, category, address, hours, phone, website
  - Star rating + review count
  - Latest status pulse with "x hours ago"
  - CTA: "Post status" (open/crowded/debris/closed)
  - Reviews list (up to 5, paginate)
  - CTA: "Write review" (logged-in only)

## Task 7.5.5 — Per-ramp tide-height threshold warning

When `poi.tide_min_m` is not null AND the current tide (from Phase 6 `fetchMarine`) is below the threshold, render a warning banner on the POI detail:

> "Williamstown ramp: accessible above 1.2 m. Currently 0.8 m — not safely usable for trailer boats."

Only applies to `category = 'boat_ramp'`.

## Task 7.5.6 — Regulatory-data annual refresh job

New Supabase Edge Function `refresh-poi-seed` — runs via `pg_cron` on Dec 1 each year:
- Pull latest VFA + parks_vic POI lists
- Diff against current `pois` table (match on name + proximity)
- Upsert changed rows; flag deletions for admin review
- Send Slack/email notification to operators with diff summary

## Phase 7.5 Acceptance

- [ ] ≥30 seeded boat ramps + ≥10 bait shops render on the map
- [ ] POI layer toggleable via filter bar (already wired, just exercise it)
- [ ] User can submit a new POI (admin approval gate optional for v1)
- [ ] User can post a 6h status report; it renders on detail + expires correctly
- [ ] User can post a 1-star → 5-star review; rating_avg + rating_count update via trigger
- [ ] Tide-threshold warning renders when tide below threshold
- [ ] pgTAP: RLS forbids editing another user's review / status
- [ ] Tag `v0.12.5-pois`
