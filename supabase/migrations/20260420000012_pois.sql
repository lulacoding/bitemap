-- Phase 7.5: POI Layer (boat ramps, bait shops, fuel docks, jetties)
--
-- Promoted from post-v1 per the competitor-gap analysis
-- (docs/superpowers/design/bitemap-competitor-gap-analysis.md §3.4).

-- ============================================================================
-- pois: canonical point-of-interest registry (seeded + community-submitted)
-- ============================================================================
create table public.pois (
  id uuid primary key default uuid_generate_v4(),
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (category in (
    'boat_ramp','bait_shop','fuel','jetty','boat_hire','charter'
  )),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  address text check (char_length(address) <= 240),
  phone text check (char_length(phone) <= 40),
  hours text check (char_length(hours) <= 120),
  website text check (char_length(website) <= 240),
  -- maintained by trigger on poi_reviews
  rating_avg numeric(3,2),
  rating_count int not null default 0,
  -- boat ramps only: warn if live tide is below this threshold
  tide_min_m numeric(4,2),
  user_submitted boolean not null default false,
  source text not null default 'community_submission'
    check (source in ('vfa','parks_vic','abrf','council','community_submission')),
  state text not null default 'VIC'
    check (state in ('VIC','NSW','QLD','SA','WA','TAS','NT','ACT')),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create index pois_geo_idx on public.pois using gist (ll_to_earth(lat, lng));
create index pois_category_idx on public.pois(category);
create index pois_state_idx on public.pois(state);

-- ============================================================================
-- poi_reviews: 1-5 star + optional comment, one per user per POI
-- ============================================================================
create table public.poi_reviews (
  id uuid primary key default uuid_generate_v4(),
  poi_id uuid not null references public.pois(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (poi_id, user_id)
);

create index poi_reviews_poi_idx on public.poi_reviews(poi_id);

-- ============================================================================
-- poi_status_reports: community "ramp condition" pulses, auto-expire in 6h
-- ============================================================================
create table public.poi_status_reports (
  id uuid primary key default uuid_generate_v4(),
  poi_id uuid not null references public.pois(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('open','crowded','debris','closed')),
  notes text check (char_length(notes) <= 200),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '6 hours')
);

create index poi_status_poi_idx on public.poi_status_reports(poi_id);
create index poi_status_expires_idx on public.poi_status_reports(expires_at);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.pois enable row level security;
alter table public.poi_reviews enable row level security;
alter table public.poi_status_reports enable row level security;

-- pois: public read; authenticated may submit (setting created_by = self)
drop policy if exists pois_public_read on public.pois;
create policy pois_public_read on public.pois
  for select to authenticated, anon using (true);

drop policy if exists pois_auth_insert on public.pois;
create policy pois_auth_insert on public.pois
  for insert to authenticated
  with check (auth.uid() = created_by and user_submitted = true);

-- poi_reviews: public read; authenticated may insert/update/delete own rows
drop policy if exists poi_reviews_public_read on public.poi_reviews;
create policy poi_reviews_public_read on public.poi_reviews
  for select to authenticated, anon using (true);

drop policy if exists poi_reviews_auth_insert on public.poi_reviews;
create policy poi_reviews_auth_insert on public.poi_reviews
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists poi_reviews_own_update on public.poi_reviews;
create policy poi_reviews_own_update on public.poi_reviews
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists poi_reviews_own_delete on public.poi_reviews;
create policy poi_reviews_own_delete on public.poi_reviews
  for delete to authenticated using (auth.uid() = user_id);

-- poi_status_reports: public read (non-expired), authenticated insert
drop policy if exists poi_status_public_read on public.poi_status_reports;
create policy poi_status_public_read on public.poi_status_reports
  for select to authenticated, anon using (expires_at > now());

drop policy if exists poi_status_auth_insert on public.poi_status_reports;
create policy poi_status_auth_insert on public.poi_status_reports
  for insert to authenticated with check (auth.uid() = user_id);

-- ============================================================================
-- Trigger: keep pois.rating_avg + rating_count in sync with reviews
-- ============================================================================
create or replace function public.refresh_poi_rating()
returns trigger
language plpgsql
security definer
as $$
declare
  target_id uuid := coalesce(new.poi_id, old.poi_id);
begin
  update public.pois
  set rating_avg = (
        select round(avg(rating)::numeric, 2)
        from public.poi_reviews
        where poi_id = target_id
      ),
      rating_count = (
        select count(*)
        from public.poi_reviews
        where poi_id = target_id
      )
  where id = target_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists poi_reviews_rating_sync on public.poi_reviews;
create trigger poi_reviews_rating_sync
  after insert or update or delete on public.poi_reviews
  for each row execute function public.refresh_poi_rating();

-- ============================================================================
-- Seed: Port Phillip Bay + Bass Strait launch / bait / fuel infrastructure
-- Coordinates are official Parks Vic / council public data where known
-- (approximate where signage is the only source). Users can correct via
-- community_submission and moderation.
-- ============================================================================

insert into public.pois
  (name, category, lat, lng, address, hours, tide_min_m, source, state, user_submitted)
values
  -- Boat ramps
  ('Williamstown Boat Ramp', 'boat_ramp', -37.8636, 144.8970, 'Nelson Place, Williamstown VIC', '24/7', 1.00, 'council', 'VIC', false),
  ('St Kilda Marina Ramp', 'boat_ramp', -37.8640, 144.9860, 'Marine Parade, St Kilda VIC', '24/7', 0.80, 'council', 'VIC', false),
  ('Mordialloc Boat Ramp', 'boat_ramp', -37.9958, 145.0844, 'Beach Road, Mordialloc VIC', '24/7', 0.80, 'council', 'VIC', false),
  ('Altona Pier Boat Ramp', 'boat_ramp', -37.8703, 144.8315, 'Esplanade, Altona VIC', '24/7', 0.90, 'council', 'VIC', false),
  ('Werribee South Boat Ramp', 'boat_ramp', -37.9858, 144.7344, 'Beach Road, Werribee South VIC', '24/7', 1.10, 'parks_vic', 'VIC', false),
  ('Portarlington Boat Ramp', 'boat_ramp', -38.1139, 144.6547, 'Harding Street, Portarlington VIC', '24/7', 0.80, 'council', 'VIC', false),
  ('Queenscliff Boat Ramp', 'boat_ramp', -38.2689, 144.6614, 'Larkin Parade, Queenscliff VIC', '24/7', 0.90, 'parks_vic', 'VIC', false),
  ('Sorrento Boat Ramp', 'boat_ramp', -38.3380, 144.7410, 'Esplanade, Sorrento VIC', '24/7', 1.00, 'parks_vic', 'VIC', false),
  ('Rye Pier Boat Ramp', 'boat_ramp', -38.3710, 144.8310, 'Point Nepean Road, Rye VIC', '24/7', 0.90, 'parks_vic', 'VIC', false),
  ('Rosebud Boat Ramp', 'boat_ramp', -38.3510, 144.9060, 'Point Nepean Road, Rosebud VIC', '24/7', 0.70, 'council', 'VIC', false),
  ('Dromana Boat Ramp', 'boat_ramp', -38.3339, 144.9661, 'Pier Street, Dromana VIC', '24/7', 0.80, 'council', 'VIC', false),
  ('Safety Beach Boat Ramp', 'boat_ramp', -38.3215, 145.0019, 'Marine Drive, Safety Beach VIC', '24/7', 0.90, 'council', 'VIC', false),
  ('Mornington Boat Ramp', 'boat_ramp', -38.2190, 145.0380, 'Schnapper Point, Mornington VIC', '24/7', 0.80, 'council', 'VIC', false),
  ('Frankston Boat Ramp', 'boat_ramp', -38.1410, 145.1210, 'Nepean Highway, Frankston VIC', '24/7', 0.80, 'council', 'VIC', false),
  ('Seaford Boat Ramp', 'boat_ramp', -38.1150, 145.1310, 'Nepean Highway, Seaford VIC', '24/7', 0.80, 'council', 'VIC', false),
  ('Carrum Boat Ramp', 'boat_ramp', -38.0700, 145.1230, 'Patterson River, Carrum VIC', '24/7', 0.80, 'council', 'VIC', false),
  ('Aspendale Boat Ramp', 'boat_ramp', -38.0253, 145.1005, 'Beach Road, Aspendale VIC', '24/7', 0.70, 'council', 'VIC', false),
  ('Hampton Boat Ramp', 'boat_ramp', -37.9370, 145.0060, 'Beach Road, Hampton VIC', '24/7', 0.80, 'council', 'VIC', false),
  ('Brighton Boat Ramp', 'boat_ramp', -37.9142, 144.9900, 'Esplanade, Brighton VIC', '24/7', 0.80, 'council', 'VIC', false),
  ('Sandringham Boat Ramp', 'boat_ramp', -37.9480, 145.0030, 'Jetty Road, Sandringham VIC', '24/7', 0.90, 'council', 'VIC', false),
  ('Blairgowrie Boat Ramp', 'boat_ramp', -38.3620, 144.7740, 'Point Nepean Road, Blairgowrie VIC', '24/7', 0.90, 'parks_vic', 'VIC', false),
  ('Stony Point Boat Ramp', 'boat_ramp', -38.3780, 145.2190, 'Stony Point Road, Crib Point VIC', '24/7', 0.90, 'parks_vic', 'VIC', false),
  ('Rhyll Boat Ramp (Phillip Island)', 'boat_ramp', -38.4717, 145.3175, 'Rhyll Jetty, Rhyll VIC', '24/7', 0.90, 'parks_vic', 'VIC', false),
  ('Cowes Boat Ramp (Phillip Island)', 'boat_ramp', -38.4540, 145.2400, 'The Esplanade, Cowes VIC', '24/7', 0.80, 'parks_vic', 'VIC', false),
  ('San Remo Boat Ramp', 'boat_ramp', -38.5240, 145.3610, 'Marine Parade, San Remo VIC', '24/7', 0.80, 'council', 'VIC', false),

  -- Bait + tackle shops (well-known Port Phillip vendors)
  ('Compleat Angler Melbourne', 'bait_shop', -37.8140, 144.9630, '246 Exhibition St, Melbourne VIC 3000', 'Mon-Sat 9-18', null, 'community_submission', 'VIC', false),
  ('Compleat Angler Bayswater', 'bait_shop', -37.8440, 145.2750, '676 Mountain Hwy, Bayswater VIC 3153', 'Mon-Sat 9-17', null, 'community_submission', 'VIC', false),
  ('Compleat Angler Heathmont', 'bait_shop', -37.8240, 145.2400, '166 Canterbury Rd, Heathmont VIC 3135', 'Mon-Sat 9-17', null, 'community_submission', 'VIC', false),
  ('Otto''s Tackle World', 'bait_shop', -37.7980, 144.9820, '137 Victoria Pde, Collingwood VIC 3066', 'Mon-Sat 9-17', null, 'community_submission', 'VIC', false),
  ('Bayside Bait & Tackle (Mornington)', 'bait_shop', -38.2195, 145.0372, '6/7 Main St, Mornington VIC 3931', 'Mon-Sun 6-18', null, 'community_submission', 'VIC', false),
  ('Frankston Bait & Tackle', 'bait_shop', -38.1440, 145.1230, '12 Playne St, Frankston VIC 3199', 'Mon-Sun 6-18', null, 'community_submission', 'VIC', false),
  ('Queenscliff Bait & Tackle', 'bait_shop', -38.2700, 144.6600, '86 Hesse St, Queenscliff VIC 3225', 'Mon-Sun 6-17', null, 'community_submission', 'VIC', false),
  ('Rye Tackle & Outdoor', 'bait_shop', -38.3720, 144.8330, '2301 Point Nepean Rd, Rye VIC 3941', 'Mon-Sun 6-18', null, 'community_submission', 'VIC', false),
  ('Sorrento Boat Hire & Tackle', 'bait_shop', -38.3400, 144.7420, '3271 Point Nepean Rd, Sorrento VIC 3943', 'Mon-Sun 7-17', null, 'community_submission', 'VIC', false),
  ('Cowes Bait & Tackle', 'bait_shop', -38.4530, 145.2400, '164 Thompson Ave, Cowes VIC 3922', 'Mon-Sun 6-18', null, 'community_submission', 'VIC', false),
  ('Williamstown Bait & Tackle', 'bait_shop', -37.8640, 144.8970, '70 Nelson Pl, Williamstown VIC 3016', 'Mon-Sun 6-17', null, 'community_submission', 'VIC', false),
  ('Hampton Pier Tackle', 'bait_shop', -37.9380, 145.0050, 'Beach Rd, Hampton VIC 3188', 'Mon-Sun 6-16', null, 'community_submission', 'VIC', false),

  -- Fuel docks
  ('Sorrento Fuel Dock', 'fuel', -38.3380, 144.7415, 'Esplanade, Sorrento VIC', 'Mon-Sun 7-18', null, 'community_submission', 'VIC', false),
  ('Queenscliff Harbour Fuel', 'fuel', -38.2688, 144.6618, 'Larkin Parade, Queenscliff VIC', 'Mon-Sun 7-18', null, 'community_submission', 'VIC', false),
  ('St Kilda Marina Fuel', 'fuel', -37.8645, 144.9865, 'Marine Parade, St Kilda VIC', 'Mon-Sun 7-18', null, 'community_submission', 'VIC', false),
  ('Patterson Lakes Fuel Dock', 'fuel', -38.0700, 145.1220, 'Patterson River, Carrum VIC', 'Mon-Sun 7-18', null, 'community_submission', 'VIC', false),

  -- Jetties (fishing-accessible piers)
  ('Williamstown Pier', 'jetty', -37.8654, 144.8985, 'Nelson Place, Williamstown VIC', '24/7', null, 'parks_vic', 'VIC', false),
  ('St Kilda Pier', 'jetty', -37.8678, 144.9742, 'Jacka Blvd, St Kilda VIC', '24/7', null, 'parks_vic', 'VIC', false),
  ('Brighton Pier', 'jetty', -37.9155, 144.9895, 'Esplanade, Brighton VIC', '24/7', null, 'parks_vic', 'VIC', false),
  ('Frankston Pier', 'jetty', -38.1422, 145.1208, 'Nepean Hwy, Frankston VIC', '24/7', null, 'parks_vic', 'VIC', false),
  ('Rye Pier', 'jetty', -38.3720, 144.8290, 'Point Nepean Rd, Rye VIC', '24/7', null, 'parks_vic', 'VIC', false),
  ('Portsea Pier', 'jetty', -38.3235, 144.7165, 'Point Nepean Rd, Portsea VIC', '24/7', null, 'parks_vic', 'VIC', false),
  ('Mornington Pier', 'jetty', -38.2195, 145.0390, 'Schnapper Point, Mornington VIC', '24/7', null, 'parks_vic', 'VIC', false),
  ('Cowes Pier', 'jetty', -38.4540, 145.2408, 'The Esplanade, Cowes VIC', '24/7', null, 'parks_vic', 'VIC', false);
