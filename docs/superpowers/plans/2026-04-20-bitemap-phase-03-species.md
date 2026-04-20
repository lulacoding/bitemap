# BiteMap Phase 3 — Species Database + Seed (Detailed TDD Plan)

**Goal:** Seed ~100 AU species with regulations. Ship searchable list + detail screens on mobile + web.

**Tech Stack:** Supabase Storage (`species-images` bucket), `@tanstack/react-query`, Zod for runtime validation, FlatList (mobile), virtualised list (web if >100 items later).

---

## File Structure

```
supabase/
├── seed.sql                        (species INSERT statements + bucket setup)
└── seed-data/
    └── species-au.json             (curated data source)

packages/shared/src/
├── schemas/species.ts              (Zod)
└── queries/species.ts              (list, search, getById)

apps/mobile/app/(app)/
├── species/index.tsx
└── species/[id].tsx

apps/web/src/app/(app)/
├── species/page.tsx
└── species/[id]/page.tsx
```

---

## Task 3.1 — Curate 100 Species JSON

- [ ] **Step 1: Create `supabase/seed-data/species-au.json`** with 100 entries

Each entry:
```json
{
  "common_name": "Snapper",
  "scientific_name": "Chrysophrys auratus",
  "category": "saltwater",
  "min_legal_size_mm": 280,
  "bag_limit": 3,
  "closed_season_start": null,
  "closed_season_end": null,
  "state": "VIC",
  "image_url": "https://supabase.local/storage/v1/object/public/species-images/snapper.jpg",
  "description": "Iconic Australian reef fish, prized by recreational anglers."
}
```

Minimum starter list: Snapper, King George Whiting, Flathead, Bream, Salmon (Australian), Mulloway, Tuna (Southern Bluefin), Garfish, Squid (Southern Calamari), Gummy Shark, Elephant Fish, Pinkie (Pink Snapper juvenile), Silver Trevally, Barracouta, Mackerel, Trout (Brown, Rainbow), Redfin, Carp, Murray Cod (NSW/VIC — closed season!), Golden Perch.

- [ ] **Step 2: Image pipeline**

Download CC-BY images → upload to Supabase Storage bucket `species-images` via `supabase storage cp`.

- [ ] **Step 3: Build `seed.sql`** — generated from JSON

```bash
# tools/build-species-seed.ts
# Reads species-au.json → emits INSERT statements → writes supabase/seed.sql
```

- [ ] **Step 4: `supabase db reset`** reseeds cleanly

- [ ] **Step 5: Commit**

---

## Task 3.2 — Zod Schemas

- [ ] **Step 1: Failing test**

```ts
import { speciesSchema } from './species';
test('rejects invalid category', () => {
  expect(() => speciesSchema.parse({ category: 'banana' })).toThrow();
});
```

- [ ] **Step 2: Implement**

```ts
// packages/shared/src/schemas/species.ts
import { z } from 'zod';
export const speciesCategorySchema = z.enum(['saltwater','freshwater','estuarine','pelagic','other']);
export const speciesSchema = z.object({
  id: z.string().uuid(),
  common_name: z.string().min(1),
  scientific_name: z.string().nullable(),
  category: speciesCategorySchema,
  min_legal_size_mm: z.number().int().nonnegative().nullable(),
  bag_limit: z.number().int().nonnegative().nullable(),
  closed_season_start: z.string().nullable(),
  closed_season_end: z.string().nullable(),
  state: z.string().nullable(),
  image_url: z.string().url().nullable(),
  description: z.string().nullable(),
});
export type Species = z.infer<typeof speciesSchema>;
```

---

## Task 3.3 — Query Helpers

- [ ] **Step 1: Failing tests**

```ts
import { searchSpecies, getSpeciesById } from './species';
test('searchSpecies snapper returns result', async () => {
  const r = await searchSpecies('snapper');
  expect(r.length).toBeGreaterThan(0);
});
test('getSpeciesById nonexistent returns null', async () => {
  const r = await getSpeciesById('00000000-0000-0000-0000-000000000000');
  expect(r).toBeNull();
});
```

- [ ] **Step 2: Implement**

```ts
// packages/shared/src/queries/species.ts
import { supabase } from '../supabase/browser';
import { speciesSchema, type Species } from '../schemas/species';

export async function listSpecies(): Promise<Species[]> {
  const { data, error } = await supabase().from('species').select('*').order('common_name');
  if (error) throw error;
  return (data ?? []).map(d => speciesSchema.parse(d));
}

export async function searchSpecies(q: string): Promise<Species[]> {
  const like = `%${q}%`;
  const { data, error } = await supabase()
    .from('species')
    .select('*')
    .or(`common_name.ilike.${like},scientific_name.ilike.${like}`)
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(d => speciesSchema.parse(d));
}

export async function getSpeciesById(id: string): Promise<Species | null> {
  const { data, error } = await supabase().from('species').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? speciesSchema.parse(data) : null;
}
```

- [ ] **Step 3: PASS + commit**

---

## Task 3.4 — Mobile Species List

- [ ] **Step 1: Test**

```tsx
// Uses MSW-style Supabase mock
test('renders 100 species rows with search', async () => {
  const { getByText, getByPlaceholderText } = render(<SpeciesList />);
  await waitFor(() => expect(getByText('Snapper')).toBeTruthy());
  fireEvent.changeText(getByPlaceholderText('Search species'), 'whiting');
  await waitFor(() => expect(getByText('King George Whiting')).toBeTruthy());
});
```

- [ ] **Step 2: Implement**

```tsx
// apps/mobile/app/(app)/species/index.tsx
import { FlatList, View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listSpecies, searchSpecies } from '@bitemap/shared/queries/species';
import { Input, Chip } from '@bitemap/ui';
import { useRouter } from 'expo-router';

export default function SpeciesScreen() {
  const [q, setQ] = useState('');
  const { data } = useQuery({
    queryKey: ['species', q],
    queryFn: () => q ? searchSpecies(q) : listSpecies(),
  });
  const r = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <Input placeholder="Search species" value={q} onChange={setQ} />
      <FlatList
        data={data ?? []}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => r.push(`/species/${item.id}`)} style={{ padding: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>{item.common_name}</Text>
            <Chip label={item.category} color={item.category} />
          </Pressable>
        )}
      />
    </View>
  );
}
```

- [ ] **Step 3: PASS + commit**

---

## Task 3.5 — Mobile Species Detail

Based on Stitch reference (asset `c81107f0bc1642268c340543e8a7fd26`).

- [ ] Hero Image + title + scientific name + category Chip
- [ ] Regulation Card: min legal size, bag limit, closed season
- [ ] Description
- [ ] Primary CTA "Log a {species} catch" → routes to `/report?species={id}` (Phase 5)
- [ ] Ghost CTA "Report regulation change" → deep link mail/form

**E2E Assertion:** Tap "Snapper" → detail shows min_legal_size_mm=280, bag_limit=3 for VIC. (Matches spec verification item 6.)

---

## Task 3.6 — Web Parity

- [ ] `apps/web/src/app/(app)/species/page.tsx` — Server Component fetches `listSpecies()`; filter is client component.
- [ ] `apps/web/src/app/(app)/species/[id]/page.tsx` — Server Component fetches + renders.
- [ ] Playwright asserts same VIC snapper regulations.

---

## Phase 3 Acceptance

- [ ] `supabase db reset` seeds 100 species
- [ ] Unit: `searchSpecies('snapper')` → ≥1 result
- [ ] Unit: `searchSpecies('Chrysophrys')` (scientific) → Snapper
- [ ] Unit: `getSpeciesById(bad-uuid)` → null
- [ ] Mobile FPS: 100 rows scroll at 60fps on mid-tier Android
- [ ] Mobile E2E: search "whiting" narrows list
- [ ] Mobile E2E: Snapper detail shows VIC bag limit 3 + min size 28cm
- [ ] Web Playwright: parity assertions pass
- [ ] Tag `v0.3.0-species`

**If all pass → proceed to Phase 4 (Map read-only).**
