create table public.species (
  id uuid primary key default gen_random_uuid(),
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
