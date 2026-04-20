-- Phase 13 security pgTAP suite — verifies RLS forbids forbidden operations
-- across every user-owned table, and the privacy-snap trigger behaves.

begin;
select plan(13);

-- Seed: two users + profiles (idempotent)
insert into auth.users (id, email, instance_id, aud, role)
  values (
    '11111111-1111-4111-8111-111111111111',
    'alice@example.test',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do nothing;

insert into auth.users (id, email, instance_id, aud, role)
  values (
    '22222222-2222-4222-8222-222222222222',
    'bob@example.test',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  )
  on conflict (id) do nothing;

insert into public.profiles (id, username, home_state)
  values ('11111111-1111-4111-8111-111111111111', 'alice_test', 'VIC')
  on conflict (id) do nothing;
insert into public.profiles (id, username, home_state)
  values ('22222222-2222-4222-8222-222222222222', 'bob_test', 'VIC')
  on conflict (id) do nothing;

-- Pick a species id up front as a plain variable
select id as species_id
from public.species
where common_name ilike 'Snapper%'
limit 1 \gset

-- Alice creates a hidden catch
set local role authenticated;
set local "request.jwt.claims" to
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

insert into public.catches
  (user_id, species_id, quantity, lat, lng, privacy_level)
values
  ('11111111-1111-4111-8111-111111111111', :'species_id', 1, -38.1, 144.85, 'hidden')
returning id as hidden_catch_id \gset

-- Privacy-snap trigger: hidden
select is(
  (select is_hidden from public.catches where id = :'hidden_catch_id'),
  true,
  'Trigger sets is_hidden=true when privacy_level=hidden'
);

-- Privacy-snap trigger: area
insert into public.catches
  (user_id, species_id, quantity, lat, lng, privacy_level)
values
  ('11111111-1111-4111-8111-111111111111', :'species_id', 1, -38.123456, 144.987654, 'area')
returning id as area_catch_id \gset

select isnt(
  (select lat from public.catches where id = :'area_catch_id')::text,
  (-38.123456::double precision)::text,
  'Trigger snaps lat when privacy_level=area'
);

select isnt(
  (select lng from public.catches where id = :'area_catch_id')::text,
  (144.987654::double precision)::text,
  'Trigger snaps lng when privacy_level=area'
);

-- Alice can read her own catches
select ok(
  (select count(*) from public.catches where user_id = '11111111-1111-4111-8111-111111111111')::int >= 2,
  'Alice can read her own catches'
);

-- Switch to Bob
set local "request.jwt.claims" to
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

-- Bob cannot see Alice's hidden catch
select is_empty(
  $$select id from public.catches
    where user_id = '11111111-1111-4111-8111-111111111111'
      and is_hidden = true$$,
  'Bob cannot SELECT Alice''s hidden catch via RLS'
);

-- Bob cannot insert a row with Alice's user_id
prepare bob_forge_alice as
  insert into public.catches (user_id, species_id, quantity, lat, lng, privacy_level)
  values
    ('11111111-1111-4111-8111-111111111111', :'species_id', 1, -38.2, 144.9, 'exact');
select throws_ok(
  'execute bob_forge_alice',
  null,
  'Bob cannot INSERT a catch with Alice''s user_id (RLS)'
);

-- Alice saves a spot
set local "request.jwt.claims" to
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

insert into public.saved_spots (user_id, name, lat, lng)
  values ('11111111-1111-4111-8111-111111111111', 'Alice secret spot', -38.1, 144.85);

-- Bob cannot read Alice's saved spot
set local "request.jwt.claims" to
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

select is_empty(
  $$select id from public.saved_spots
    where user_id = '11111111-1111-4111-8111-111111111111'$$,
  'Bob cannot SELECT Alice''s saved_spots'
);

-- Public tables readable by anon. We check the SELECT doesn't raise a
-- permission error by running it at all; species_regulations is truncated
-- by the CASCADE on species seed, so we only assert the query succeeds.
set local role anon;
select ok(
  (select count(*) from public.species)::int > 0,
  'anon can SELECT species'
);
select lives_ok(
  'select count(*) from public.species_regulations',
  'anon can SELECT species_regulations (RLS allows it)'
);
select ok(
  (select count(*) from public.marine_parks)::int > 0,
  'anon can SELECT marine_parks'
);
select ok(
  (select count(*) from public.pois)::int > 0,
  'anon can SELECT pois'
);

-- Anon CANNOT read saved_spots
select is_empty(
  $$select 1 from public.saved_spots$$,
  'anon cannot SELECT saved_spots'
);

-- Anon CANNOT read hidden catches
select is_empty(
  $$select id from public.catches
    where is_hidden = true or privacy_level = 'hidden'$$,
  'anon cannot SELECT hidden catches'
);

select * from finish();
rollback;
