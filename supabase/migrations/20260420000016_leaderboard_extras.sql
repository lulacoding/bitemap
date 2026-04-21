-- Phase 10.1: Leaderboard extras shipped in v0.15.1-leaderboard-extras.
--
-- 1. Taxonomy + IUCN columns on species (backfilled for the 30 seeded species)
-- 2. Streak + XP columns on profiles with transactional update via catch trigger
-- 3. Rare-catch rarity scoring table + seed for Port Phillip Bay baseline

-- ============================================================================
-- 1. Taxonomy
-- ============================================================================
alter table public.species
  add column if not exists family text,
  add column if not exists species_order text,
  add column if not exists iucn_status text
    check (iucn_status in ('LC','NT','VU','EN','CR','EW','EX','DD'));

-- Backfill family/order/iucn for the seeded species. Sources: IUCN Red List +
-- FishBase. IUCN defaults to 'LC' (Least Concern) unless otherwise noted.
update public.species set family = 'Sparidae',       species_order = 'Spariformes',     iucn_status = 'LC' where common_name = 'Snapper';
update public.species set family = 'Sillaginidae',   species_order = 'Perciformes',     iucn_status = 'LC' where common_name = 'King George Whiting';
update public.species set family = 'Platycephalidae',species_order = 'Scorpaeniformes', iucn_status = 'LC' where common_name ilike '%Flathead%';
update public.species set family = 'Arripidae',      species_order = 'Perciformes',     iucn_status = 'LC' where common_name = 'Australian Salmon';
update public.species set family = 'Sparidae',       species_order = 'Spariformes',     iucn_status = 'LC' where common_name ilike 'Bream%' or common_name = 'Black Bream' or common_name = 'Yellowfin Bream';
update public.species set family = 'Sciaenidae',     species_order = 'Perciformes',     iucn_status = 'LC' where common_name ilike 'Mulloway%';
update public.species set family = 'Triakidae',      species_order = 'Carcharhiniformes', iucn_status = 'LC' where common_name = 'Gummy Shark';
update public.species set family = 'Hemiramphidae',  species_order = 'Beloniformes',    iucn_status = 'LC' where common_name = 'Garfish';
update public.species set family = 'Loliginidae',    species_order = 'Myopsida',        iucn_status = 'DD' where common_name = 'Southern Calamari Squid';
update public.species set family = 'Carangidae',     species_order = 'Carangiformes',   iucn_status = 'LC' where common_name = 'Silver Trevally';
update public.species set family = 'Gempylidae',     species_order = 'Scombriformes',   iucn_status = 'LC' where common_name = 'Barracouta';
update public.species set family = 'Palinuridae',    species_order = 'Decapoda',        iucn_status = 'LC' where common_name = 'Rock Lobster';
update public.species set family = 'Haliotidae',     species_order = 'Archaeogastropoda', iucn_status = 'LC' where common_name = 'Abalone';
update public.species set family = 'Mytilidae',      species_order = 'Mytiloida',       iucn_status = 'LC' where common_name = 'Mussel';
update public.species set family = 'Scombridae',     species_order = 'Scombriformes',   iucn_status = 'LC' where common_name = 'Southern Bluefin Tuna';
update public.species set family = 'Carangidae',     species_order = 'Carangiformes',   iucn_status = 'LC' where common_name = 'Yellowtail Kingfish';
update public.species set family = 'Monacanthidae',  species_order = 'Tetraodontiformes', iucn_status = 'LC' where common_name = 'Leatherjacket';
update public.species set family = 'Callorhinchidae',species_order = 'Chimaeriformes',  iucn_status = 'LC' where common_name = 'Elephant Fish';
update public.species set family = 'Labridae',       species_order = 'Labriformes',     iucn_status = 'LC' where common_name = 'Blue Throat Wrasse';
update public.species set family = 'Sparidae',       species_order = 'Spariformes',     iucn_status = 'LC' where common_name = 'Pink Snapper';
update public.species set family = 'Percichthyidae', species_order = 'Perciformes',     iucn_status = 'EN' where common_name = 'Murray Cod';
update public.species set family = 'Percichthyidae', species_order = 'Perciformes',     iucn_status = 'NT' where common_name ilike '%Golden Perch%' or common_name = 'Yellowbelly';
update public.species set family = 'Salmonidae',     species_order = 'Salmoniformes',   iucn_status = 'LC' where common_name = 'Brown Trout';
update public.species set family = 'Salmonidae',     species_order = 'Salmoniformes',   iucn_status = 'LC' where common_name = 'Rainbow Trout';
update public.species set family = 'Percidae',       species_order = 'Perciformes',     iucn_status = 'LC' where common_name = 'Redfin Perch';
update public.species set family = 'Cyprinidae',     species_order = 'Cypriniformes',   iucn_status = 'VU' where common_name = 'Common Carp';
update public.species set family = 'Percichthyidae', species_order = 'Perciformes',     iucn_status = 'LC' where common_name = 'Estuary Perch';
update public.species set family = 'Kyphosidae',     species_order = 'Perciformes',     iucn_status = 'LC' where common_name ilike '%Luderick%' or common_name = 'Blackfish';
update public.species set family = 'Mugilidae',      species_order = 'Mugiliformes',    iucn_status = 'LC' where common_name = 'Sea Mullet';
update public.species set family = 'Sparidae',       species_order = 'Spariformes',     iucn_status = 'LC' where common_name = 'Tarwhine';

-- ============================================================================
-- 2. Streak + XP
-- ============================================================================
alter table public.profiles
  add column if not exists xp int not null default 0,
  add column if not exists streak_days int not null default 0,
  add column if not exists streak_last_catch date;

-- Trigger fires on every new catch. XP rules:
--   +10 XP per catch
--   +50 XP bonus if this is a new species for the user (first time ever)
--   +streak_days XP bonus (capped at 10) for multi-day streaks
-- Streak logic:
--   same day → no change
--   yesterday → streak_days += 1
--   else → streak resets to 1
create or replace function public.on_catch_insert_update_xp()
returns trigger
language plpgsql
as $$
declare
  v_is_new_species boolean;
  v_bonus int;
  v_last date;
  v_today date := (new.created_at at time zone 'utc')::date;
  v_streak int;
begin
  -- Check if this species is new for the user
  select not exists (
    select 1 from public.catches
    where user_id = new.user_id
      and species_id = new.species_id
      and id <> new.id
  )
  into v_is_new_species;

  v_bonus := 10
    + case when v_is_new_species then 50 else 0 end;

  -- Streak update
  select streak_last_catch, streak_days
    into v_last, v_streak
    from public.profiles
    where id = new.user_id;

  if v_last is null then
    v_streak := 1;
  elsif v_last = v_today then
    -- already logged today, streak unchanged
    null;
  elsif v_last = v_today - interval '1 day' then
    v_streak := coalesce(v_streak, 0) + 1;
  else
    v_streak := 1;
  end if;

  -- Streak multiplier (cap at +10/catch)
  v_bonus := v_bonus + least(10, greatest(0, v_streak - 3));

  update public.profiles
     set xp = xp + v_bonus,
         streak_days = v_streak,
         streak_last_catch = v_today
   where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists catches_xp_sync on public.catches;
create trigger catches_xp_sync
  after insert on public.catches
  for each row execute function public.on_catch_insert_update_xp();

-- Penalty trigger: flagged catches deduct XP.
create or replace function public.on_catch_flagged_penalty()
returns trigger
language plpgsql
as $$
begin
  if new.flag_count >= 3 and (old.flag_count is null or old.flag_count < 3) then
    update public.profiles
       set xp = greatest(0, xp - 100)
     where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists catches_flag_penalty on public.catches;
create trigger catches_flag_penalty
  after update of flag_count on public.catches
  for each row execute function public.on_catch_flagged_penalty();

-- ============================================================================
-- 3. Rare-catch rarity scoring
-- ============================================================================
create table if not exists public.species_rarity (
  species_id uuid not null references public.species(id) on delete cascade,
  region text not null,   -- 'port_phillip', 'vic_coast', 'nsw_coast'
  catch_count_90d int not null default 0,
  rarity_tier text not null default 'common'
    check (rarity_tier in ('common','uncommon','rare','extraordinary')),
  notes text,
  primary key (species_id, region)
);

alter table public.species_rarity enable row level security;
drop policy if exists species_rarity_read on public.species_rarity;
create policy species_rarity_read on public.species_rarity
  for select to authenticated, anon using (true);

-- Seed Port Phillip baseline rarity (research-grounded defaults for our 30 species).
-- Tiers:
--   common: you'll hook one in a session (Snapper, Flathead, Bream)
--   uncommon: planned target species (Mulloway, Kingfish, Gummy)
--   rare: shows up but rare for the bay (Bluefin Tuna, Murray Cod — not expected here)
--   extraordinary: citizen-science notable (Abalone, Rock Lobster if caught recreationally)
insert into public.species_rarity (species_id, region, rarity_tier)
select id, 'port_phillip',
  case
    when common_name in ('Snapper','King George Whiting','Australian Salmon','Silver Trevally','Garfish','Southern Calamari Squid','Sea Mullet','Luderick','Tarwhine','Pink Snapper','Leatherjacket','Barracouta') then 'common'
    when common_name in ('Mulloway','Yellowtail Kingfish','Gummy Shark','Elephant Fish','Blue Throat Wrasse','Estuary Perch','Tarwhine') then 'uncommon'
    when common_name ilike '%Flathead%' or common_name ilike 'Bream%' or common_name = 'Black Bream' or common_name = 'Yellowfin Bream' then 'common'
    when common_name in ('Southern Bluefin Tuna','Murray Cod','Golden Perch','Yellowbelly','Redfin Perch','Brown Trout','Rainbow Trout','Common Carp') then 'rare'
    when common_name in ('Abalone','Rock Lobster','Mussel') then 'extraordinary'
    else 'uncommon'
  end
from public.species
on conflict (species_id, region) do nothing;

-- Nightly-refresh function for catch_count_90d (runs via pg_cron if available)
create or replace function public.refresh_species_rarity_counts()
returns void
language plpgsql
as $$
begin
  update public.species_rarity r
     set catch_count_90d = (
       select count(*)::int
       from public.catches c
       where c.species_id = r.species_id
         and c.is_hidden = false
         and c.privacy_level <> 'hidden'
         and c.created_at >= now() - interval '90 days'
     );
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'refresh-species-rarity',
      '15 3 * * *',
      $cron$select public.refresh_species_rarity_counts();$cron$
    );
  end if;
end $$;
