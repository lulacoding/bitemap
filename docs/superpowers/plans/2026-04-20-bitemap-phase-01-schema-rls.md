# BiteMap Phase 1 — Supabase Schema + RLS (Detailed TDD Plan)

**Goal:** Define the Postgres schema + Row Level Security policies + generated TypeScript types. pgTAP tests lock every policy.

**Architecture:** Local Supabase via `supabase start` (Docker). Migrations in `supabase/migrations/` (timestamped). pgTAP for policy tests. `supabase gen types` generates `packages/shared/src/types/database.ts`.

**Tech Stack:** Supabase CLI ≥ 1.200, Postgres 15, pgTAP 1.3, PostGIS (for `geography(point)` on catches), TypeScript generated types.

---

## File Structure

```
supabase/
├── config.toml
├── seed.sql                          (empty for Phase 1)
├── migrations/
│   ├── 20260420000001_extensions.sql
│   ├── 20260420000002_profiles.sql
│   ├── 20260420000003_species.sql
│   ├── 20260420000004_catches.sql
│   ├── 20260420000005_saved_spots.sql
│   ├── 20260420000006_social.sql
│   └── 20260420000007_rls_policies.sql
└── tests/
    ├── profiles_rls.test.sql
    ├── species_rls.test.sql
    ├── catches_rls.test.sql
    └── social_rls.test.sql
packages/shared/src/types/database.ts (generated)
```

---

## Task 1.1 — Init Supabase + Extensions

- [ ] **Step 1: `supabase init`** — creates `supabase/config.toml`
- [ ] **Step 2: `supabase start`** — boots local stack
- [ ] **Step 3: Write migration `20260420000001_extensions.sql`**

```sql
create extension if not exists postgis;
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
```

- [ ] **Step 4: `supabase db reset`** — applies cleanly
- [ ] **Step 5: Commit**

---

## Task 1.2 — `profiles` Table + Auto-Create Trigger

- [ ] **Step 1: Write pgTAP failing test**

```sql
-- supabase/tests/profiles_rls.test.sql
begin; select plan(3);
select has_table('public', 'profiles', 'profiles exists');
select col_is_unique('public', 'profiles', 'username', 'username unique');
select col_is_pk('public', 'profiles', 'id', 'id is PK');
select * from finish(); rollback;
```

- [ ] **Step 2: Run — FAIL**

```bash
supabase test db
```

- [ ] **Step 3: Migration**

```sql
-- 20260420000002_profiles.sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  avatar_url text,
  bio text check (char_length(bio) <= 200),
  location text,
  is_guide boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'angler_' || substr(new.id::text, 1, 8));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 4: Re-run pgTAP — PASS**

- [ ] **Step 5: Commit**

---

## Task 1.3 — `species` Table

- [ ] **Step 1: pgTAP test**

```sql
begin; select plan(5);
select has_table('public', 'species');
select has_column('public', 'species', 'common_name');
select has_column('public', 'species', 'min_legal_size_mm');
select has_column('public', 'species', 'bag_limit');
select col_not_null('public', 'species', 'common_name');
select * from finish(); rollback;
```

- [ ] **Step 2: Migration**

```sql
-- 20260420000003_species.sql
create table public.species (
  id uuid primary key default uuid_generate_v4(),
  common_name text not null,
  scientific_name text,
  category text not null check (category in ('saltwater','freshwater','estuarine','pelagic','other')),
  min_legal_size_mm int,
  bag_limit int,
  closed_season_start date,
  closed_season_end date,
  state text,
  image_url text,
  description text,
  created_at timestamptz not null default now(),
  unique (common_name, state)
);
create index species_category_idx on public.species(category);
create index species_common_name_trgm_idx on public.species using gin (common_name gin_trgm_ops);
```

Note: requires `pg_trgm` extension — add to Task 1.1.

- [ ] **Step 3: PASS + commit**

---

## Task 1.4 — `catches` Table (core)

- [ ] **Step 1: pgTAP test**

```sql
begin; select plan(6);
select has_table('public', 'catches');
select has_column('public', 'catches', 'lat');
select has_column('public', 'catches', 'privacy_level');
select has_column('public', 'catches', 'expires_at');
select col_default_is('public', 'catches', 'expires_at', '(created_at + interval ''48 hours'')');
select col_type_is('public', 'catches', 'privacy_level', 'text');
select * from finish(); rollback;
```

- [ ] **Step 2: Migration**

```sql
-- 20260420000004_catches.sql
create table public.catches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  species_id uuid not null references public.species(id),
  quantity int not null default 1 check (quantity > 0),
  size_mm int check (size_mm >= 0),
  bait_used text,
  technique text,
  lat double precision not null,
  lng double precision not null,
  location_name text,
  privacy_level text not null check (privacy_level in ('exact','area','hidden')) default 'exact',
  photo_url text,
  weather_json jsonb,
  tide_json jsonb,
  moon_phase text,
  solunar_rating int check (solunar_rating between 0 and 4),
  like_count int not null default 0,
  comment_count int not null default 0,
  flag_count int not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours')
);
create index catches_created_idx on public.catches(created_at desc);
create index catches_expires_idx on public.catches(expires_at);
create index catches_geo_idx on public.catches using gist (ll_to_earth(lat, lng));
```

- [ ] **Step 3: PASS + commit**

---

## Task 1.5 — `saved_spots`, Social, and Follows

- [ ] **Step 1: pgTAP tests per table**

- [ ] **Step 2: Migrations**

```sql
-- 20260420000005_saved_spots.sql
create table public.saved_spots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  notes text,
  created_at timestamptz not null default now()
);

-- 20260420000006_social.sql
create table public.catch_likes (
  catch_id uuid references public.catches(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (catch_id, user_id)
);
create table public.catch_comments (
  id uuid primary key default uuid_generate_v4(),
  catch_id uuid not null references public.catches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
```

---

## Task 1.6 — Denormalised Count Triggers

```sql
create or replace function inc_catch_likes() returns trigger language plpgsql as $$
begin update public.catches set like_count = like_count + 1 where id = new.catch_id; return new; end; $$;
create trigger trg_inc_catch_likes after insert on public.catch_likes for each row execute function inc_catch_likes();

create or replace function dec_catch_likes() returns trigger language plpgsql as $$
begin update public.catches set like_count = like_count - 1 where id = old.catch_id; return old; end; $$;
create trigger trg_dec_catch_likes after delete on public.catch_likes for each row execute function dec_catch_likes();

-- Same pattern for catch_comments (inc/dec comment_count)
-- Same pattern for catches.flag_count when we add flagging table in Phase 11
```

---

## Task 1.7 — RLS Policies

**All tables have RLS enabled.**

- [ ] **Step 1: pgTAP failing tests**

```sql
-- supabase/tests/catches_rls.test.sql
begin;
set local role anon;
prepare check_anon_select as select count(*) from public.catches;
select plan(4);
select lives_ok('execute check_anon_select', 'anon can SELECT public catches');
-- ... more assertions
select * from finish(); rollback;
```

- [ ] **Step 2: Write policies**

```sql
-- 20260420000007_rls_policies.sql
alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

alter table public.species enable row level security;
create policy species_read on public.species for select using (true);
-- species writes restricted to service_role (admin via Next.js only)

alter table public.catches enable row level security;
create policy catches_read on public.catches for select
  using (is_hidden = false and expires_at > now() and privacy_level <> 'hidden');
create policy catches_insert_self on public.catches for insert
  with check (auth.uid() = user_id);
create policy catches_update_own on public.catches for update using (auth.uid() = user_id);
create policy catches_delete_own on public.catches for delete using (auth.uid() = user_id);

alter table public.saved_spots enable row level security;
create policy saved_spots_owner on public.saved_spots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.catch_likes enable row level security;
create policy likes_read on public.catch_likes for select using (true);
create policy likes_insert on public.catch_likes for insert with check (auth.uid() = user_id);
create policy likes_delete_own on public.catch_likes for delete using (auth.uid() = user_id);

alter table public.catch_comments enable row level security;
create policy comments_read on public.catch_comments for select using (true);
create policy comments_insert on public.catch_comments for insert with check (auth.uid() = user_id);
create policy comments_delete_own on public.catch_comments for delete using (auth.uid() = user_id);

alter table public.follows enable row level security;
create policy follows_read on public.follows for select using (true);
create policy follows_insert on public.follows for insert with check (auth.uid() = follower_id);
create policy follows_delete_own on public.follows for delete using (auth.uid() = follower_id);
```

- [ ] **Step 3: Re-run pgTAP — PASS**

- [ ] **Step 4: Privacy=hidden verification**

Add a policy-specific test:

```sql
-- Insert catch as user A with privacy='hidden'
-- Assert: anon SELECT does NOT return this row
-- Assert: user A SELECT DOES return this row
```

- [ ] **Step 5: Expired catches verification**

```sql
-- Insert catch with expires_at = now() - 1 minute
-- Assert: anon SELECT count = 0 for this row
```

- [ ] **Step 6: Commit**

---

## Task 1.8 — Generated TypeScript Types

- [ ] **Step 1: `supabase gen types typescript --local > packages/shared/src/types/database.ts`**

- [ ] **Step 2: Add script in shared package**

```json
"scripts": { "gen-types": "supabase gen types typescript --local > src/types/database.ts" }
```

- [ ] **Step 3: Import test**

```ts
import type { Database } from './types/database';
type Catch = Database['public']['Tables']['catches']['Row'];
const x: Catch['privacy_level'] = 'exact'; // compile-time test
```

- [ ] **Step 4: `pnpm --filter @bitemap/shared typecheck` passes**

- [ ] **Step 5: Commit**

---

## Task 1.9 — CI Runs pgTAP

- [ ] Add step to `.github/workflows/ci.yml`:

```yaml
- name: Start Supabase
  run: supabase start
- name: pgTAP
  run: supabase test db
```

- [ ] Commit + PR — CI green

---

## Phase 1 Acceptance

- [ ] `supabase db reset` clean
- [ ] `supabase test db` — all pgTAP suites pass (minimum 30 assertions)
- [ ] `pnpm --filter @bitemap/shared typecheck` green with generated types
- [ ] CI green including pgTAP step
- [ ] Tag `v0.1.0-schema`

**If all pass → proceed to Phase 2.**
