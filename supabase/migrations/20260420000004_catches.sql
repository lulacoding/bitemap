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
create index catches_user_idx on public.catches(user_id);
create index catches_species_idx on public.catches(species_id);
