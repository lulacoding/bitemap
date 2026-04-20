create table public.saved_spots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  notes text,
  created_at timestamptz not null default now()
);

create index saved_spots_user_idx on public.saved_spots(user_id);
