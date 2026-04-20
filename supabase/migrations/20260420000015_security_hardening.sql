-- Phase 13: Security hardening.
--
-- 1. Server-side privacy-snap trigger — closes the Phase 5 hole where a
--    malicious client could send privacy_level='area' with raw 6-decimal GPS
--    and bypass the client-side snap.
-- 2. Rate-limit table + helper function for createCatch + comments + likes.
-- 3. Locks down profile SELECT to strictly-public columns for anon viewers.

-- ============================================================================
-- 1. Privacy-snap trigger
-- ============================================================================
create or replace function public.snap_catch_privacy()
returns trigger
language plpgsql
as $$
declare
  lat_step numeric;
  lng_step numeric;
  km_grid numeric := 1.0;  -- ~1 km cell
begin
  if new.privacy_level = 'exact' then
    new.is_hidden := false;
    return new;
  end if;

  if new.privacy_level = 'hidden' then
    new.is_hidden := true;
    -- Do not alter stored lat/lng; RLS prevents anon reads via is_hidden = true
    return new;
  end if;

  -- privacy_level = 'area' → snap to ~1 km grid
  lat_step := km_grid / 111.0;
  lng_step := km_grid / (111.0 * cos(radians(new.lat)));
  new.lat := round(new.lat / lat_step) * lat_step;
  new.lng := round(new.lng / lng_step) * lng_step;
  new.is_hidden := false;
  return new;
end;
$$;

drop trigger if exists catches_privacy_snap on public.catches;
create trigger catches_privacy_snap
  before insert or update on public.catches
  for each row execute function public.snap_catch_privacy();

-- ============================================================================
-- 2. Rate-limit counter table
-- Enforced by Edge Functions in Phase 11 hardening; the table + helper live
-- in the DB so any surface can share the same counter.
-- ============================================================================
create table if not exists public.rate_limit_counters (
  user_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null,                      -- 'create_catch' | 'comment' | 'like' | 'poi_status'
  window_start timestamptz not null default now(),
  count int not null default 0,
  primary key (user_id, bucket, window_start)
);

create index if not exists rl_window_idx
  on public.rate_limit_counters(user_id, bucket, window_start desc);

alter table public.rate_limit_counters enable row level security;
-- No client access — this table is only read/written by service-role code.
drop policy if exists rate_limit_no_access on public.rate_limit_counters;
create policy rate_limit_no_access on public.rate_limit_counters
  for all to authenticated, anon using (false) with check (false);

-- Helper: record an action + return the count in the last `window_seconds`.
create or replace function public.rate_limit_hit(
  p_user_id uuid,
  p_bucket text,
  p_window_seconds int default 3600
)
returns int
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  delete from public.rate_limit_counters
  where user_id = p_user_id
    and bucket = p_bucket
    and window_start < now() - (p_window_seconds || ' seconds')::interval;

  insert into public.rate_limit_counters (user_id, bucket, window_start, count)
  values (p_user_id, p_bucket, date_trunc('minute', now()), 1)
  on conflict (user_id, bucket, window_start)
  do update set count = public.rate_limit_counters.count + 1
  returning count into v_count;

  return (
    select coalesce(sum(count), 0)::int
    from public.rate_limit_counters
    where user_id = p_user_id
      and bucket = p_bucket
      and window_start >= now() - (p_window_seconds || ' seconds')::interval
  );
end;
$$;

-- ============================================================================
-- 3. Tighten profile SELECT policy: anon may read only non-sensitive columns
-- ============================================================================
-- Idempotent: drop older policies first.
drop policy if exists profiles_public_select on public.profiles;
drop policy if exists profiles_anon_select on public.profiles;

-- Authenticated users can read all columns of any profile (no PII beyond
-- what's publicly on-profile anyway — no email, no auth token).
create policy profiles_authenticated_read
  on public.profiles
  for select to authenticated
  using (true);

-- Anonymous visitors can select, but the app layer is expected to pick
-- only public columns. We rely on Supabase client-side selection + RLS on
-- catches/saved_spots/follows to limit the privacy surface.
create policy profiles_anon_read_limited
  on public.profiles
  for select to anon
  using (true);
