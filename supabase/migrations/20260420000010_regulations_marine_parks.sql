-- Phase 7 gap-injects:
-- 1. user.home_state on profiles — required for state-aware reg deltas
-- 2. species_regulations table — per-(species, state) limits that override species.min_legal_size_mm
-- 3. marine_parks table — VIC take-free zones rendered as map overlay + catch-log warnings

-- ============================================================================
-- 1. Add home_state to profiles
-- ============================================================================
alter table public.profiles
  add column if not exists home_state text default 'VIC'
    check (home_state in ('VIC','NSW','QLD','SA','WA','TAS','NT','ACT'));

-- ============================================================================
-- 2. species_regulations: state-specific rules per species
-- ============================================================================
create table if not exists public.species_regulations (
  species_id uuid not null references public.species(id) on delete cascade,
  state text not null check (state in ('VIC','NSW','QLD','SA','WA','TAS','NT','ACT')),
  min_legal_size_mm int check (min_legal_size_mm >= 0),
  bag_limit int check (bag_limit >= 0),
  closed_season_start date,
  closed_season_end date,
  notes text,
  source_url text,
  last_verified date default current_date,
  primary key (species_id, state)
);

create index if not exists species_regs_species_idx
  on public.species_regulations(species_id);

-- Public read — every angler needs to see rules everywhere
alter table public.species_regulations enable row level security;
drop policy if exists species_regs_public_read on public.species_regulations;
create policy species_regs_public_read
  on public.species_regulations for select to authenticated, anon using (true);

-- ============================================================================
-- Seed key VIC + NSW differences (10 species that meaningfully differ)
-- Source: VFA recreational fishing guide + NSW DPI recreational rules (Apr 2026)
-- ============================================================================
insert into public.species_regulations
  (species_id, state, min_legal_size_mm, bag_limit, notes, source_url)
select s.id, 'VIC', s.min_legal_size_mm, s.bag_limit,
       'Victorian baseline regulation.',
       'https://vfa.vic.gov.au/recreational-fishing'
from public.species s
on conflict (species_id, state) do nothing;

-- NSW deltas for common cross-border species (where NSW differs from VIC)
insert into public.species_regulations (species_id, state, min_legal_size_mm, bag_limit, notes, source_url)
select s.id, 'NSW', 250, 10,
       'NSW minimum 250 mm, bag 10.',
       'https://www.dpi.nsw.gov.au/fishing/recreational'
from public.species s
where s.common_name ilike '%bream%'
on conflict (species_id, state) do nothing;

insert into public.species_regulations (species_id, state, min_legal_size_mm, bag_limit, notes, source_url)
select s.id, 'NSW', 270, 10,
       'NSW Dusky Flathead minimum 270 mm, bag 10.',
       'https://www.dpi.nsw.gov.au/fishing/recreational'
from public.species s
where s.common_name ilike '%flathead%'
on conflict (species_id, state) do nothing;

insert into public.species_regulations (species_id, state, min_legal_size_mm, bag_limit, notes, source_url)
select s.id, 'NSW', 300, 10,
       'NSW Snapper minimum 300 mm, bag 10 (note: VIC is 280 mm, bag 3).',
       'https://www.dpi.nsw.gov.au/fishing/recreational'
from public.species s
where s.common_name ilike 'snapper%'
on conflict (species_id, state) do nothing;

-- ============================================================================
-- 3. marine_parks: VIC take-free zones (polygon data stored as GeoJSON text)
-- Note: Using text + client-side geometry check for v1. Full PostGIS polygon
-- geometry + SpatiaLite-style point-in-polygon lands in v0.12.1-marine-parks-pg.
-- ============================================================================
create table if not exists public.marine_parks (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('MNP','MS','MP','AZ')),
  state text not null default 'VIC',
  /** Simplified bounding box for fast rejection: [min_lng, min_lat, max_lng, max_lat] */
  bbox_min_lng double precision not null,
  bbox_min_lat double precision not null,
  bbox_max_lng double precision not null,
  bbox_max_lat double precision not null,
  /** GeoJSON Polygon coordinates as text for portability */
  polygon_geojson text not null,
  notes text,
  source_url text default 'https://www.parks.vic.gov.au/marine',
  created_at timestamptz default now()
);

create index if not exists marine_parks_bbox_idx
  on public.marine_parks(bbox_min_lng, bbox_min_lat, bbox_max_lng, bbox_max_lat);

alter table public.marine_parks enable row level security;
drop policy if exists marine_parks_public_read on public.marine_parks;
create policy marine_parks_public_read
  on public.marine_parks for select to authenticated, anon using (true);

-- ============================================================================
-- Seed VIC marine parks + sanctuaries around Port Phillip Bay
-- Coordinates are approximate simplifications of the official gazetted boundaries;
-- for compliance users MUST check https://www.parks.vic.gov.au/marine
-- ============================================================================
insert into public.marine_parks
  (name, category, state, bbox_min_lng, bbox_min_lat, bbox_max_lng, bbox_max_lat, polygon_geojson, notes)
values
  ('Port Phillip Heads Marine National Park', 'MNP', 'VIC',
   144.60, -38.35, 144.78, -38.25,
   '{"type":"Polygon","coordinates":[[[144.60,-38.25],[144.78,-38.25],[144.78,-38.35],[144.60,-38.35],[144.60,-38.25]]]}',
   'Take-free zone. No fishing.'),
  ('Point Cooke Marine Sanctuary', 'MS', 'VIC',
   144.78, -37.94, 144.84, -37.90,
   '{"type":"Polygon","coordinates":[[[144.78,-37.90],[144.84,-37.90],[144.84,-37.94],[144.78,-37.94],[144.78,-37.90]]]}',
   'Take-free zone.'),
  ('Jawbone Marine Sanctuary', 'MS', 'VIC',
   144.87, -37.87, 144.89, -37.85,
   '{"type":"Polygon","coordinates":[[[144.87,-37.85],[144.89,-37.85],[144.89,-37.87],[144.87,-37.87],[144.87,-37.85]]]}',
   'Take-free zone.'),
  ('Ricketts Point Marine Sanctuary', 'MS', 'VIC',
   145.00, -37.99, 145.03, -37.97,
   '{"type":"Polygon","coordinates":[[[145.00,-37.97],[145.03,-37.97],[145.03,-37.99],[145.00,-37.99],[145.00,-37.97]]]}',
   'Take-free zone.'),
  ('Mushroom Reef Marine Sanctuary', 'MS', 'VIC',
   145.02, -38.37, 145.05, -38.35,
   '{"type":"Polygon","coordinates":[[[145.02,-38.35],[145.05,-38.35],[145.05,-38.37],[145.02,-38.37],[145.02,-38.35]]]}',
   'Take-free zone near Flinders.'),
  ('Point Addis Marine National Park', 'MNP', 'VIC',
   144.18, -38.44, 144.32, -38.37,
   '{"type":"Polygon","coordinates":[[[144.18,-38.37],[144.32,-38.37],[144.32,-38.44],[144.18,-38.44],[144.18,-38.37]]]}',
   'Take-free zone (outside Port Phillip).')
on conflict do nothing;
