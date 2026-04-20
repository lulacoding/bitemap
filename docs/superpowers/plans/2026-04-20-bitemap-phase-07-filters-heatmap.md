# BiteMap Phase 7 — Map Filters + Heatmap + Decay (Detailed TDD Plan)

**Goal:** Make the map fully interactive. Filter bar, heatmap toggle, realtime updates from other users, 48-hour decay.

**Tech Stack:** Mapbox heatmap layer, Supabase Realtime, Zustand (client state), `@tanstack/react-query`.

---

## File Structure

```
apps/mobile/src/map/
├── FilterBar.tsx
├── HeatmapLayer.tsx
├── PinsLayer.tsx
├── ViewModeToggle.tsx
├── filtersStore.ts
└── useFilteredCatches.ts

apps/web/src/map/   (mirrors mobile)
```

---

## Task 7.1 — `filtersStore` (Zustand)

- [ ] **Step 1: Test**

```ts
import { useFiltersStore } from './filtersStore';
test('default state', () => {
  const { species, freshnessHours, viewMode } = useFiltersStore.getState();
  expect(species).toEqual([]);
  expect(freshnessHours).toBe(48);
  expect(viewMode).toBe('pins');
});
test('setSpecies toggles', () => {
  useFiltersStore.getState().toggleSpecies('snapper-id');
  expect(useFiltersStore.getState().species).toContain('snapper-id');
  useFiltersStore.getState().toggleSpecies('snapper-id');
  expect(useFiltersStore.getState().species).not.toContain('snapper-id');
});
```

- [ ] **Step 2: Implement**

```ts
import { create } from 'zustand';
type ViewMode = 'pins' | 'heatmap';
type FreshnessHours = 6 | 24 | 48;
interface FiltersState {
  species: string[];
  bait?: string;
  technique?: string;
  freshnessHours: FreshnessHours;
  viewMode: ViewMode;
  layers: { tackleShops: boolean };
  toggleSpecies: (id: string) => void;
  setFreshness: (h: FreshnessHours) => void;
  setViewMode: (m: ViewMode) => void;
  reset: () => void;
}
export const useFiltersStore = create<FiltersState>((set) => ({
  species: [], freshnessHours: 48, viewMode: 'pins', layers: { tackleShops: false },
  toggleSpecies: (id) => set((s) => ({
    species: s.species.includes(id) ? s.species.filter(x => x !== id) : [...s.species, id],
  })),
  setFreshness: (h) => set({ freshnessHours: h }),
  setViewMode: (m) => set({ viewMode: m }),
  reset: () => set({ species: [], bait: undefined, technique: undefined, freshnessHours: 48, viewMode: 'pins' }),
}));
```

---

## Task 7.2 — `useFilteredCatches` Query

- [ ] **Step 1: Test**

```ts
test('filter by species narrows result set', async () => {
  useFiltersStore.setState({ species: ['snapper-id'] });
  const { result } = renderHook(() => useFilteredCatches());
  await waitFor(() => {
    result.current.data?.forEach(c => expect(c.species_id).toBe('snapper-id'));
  });
});
```

- [ ] **Step 2: Implement**

```ts
export function useFilteredCatches() {
  const filters = useFiltersStore();
  return useQuery({
    queryKey: ['catches', 'map', filters],
    queryFn: async () => {
      let q = supabase().from('catches').select('id, species_id, lat, lng, created_at').lt('expires_at', 'infinity').gt('expires_at', new Date().toISOString()).eq('is_hidden', false).neq('privacy_level', 'hidden');
      if (filters.species.length) q = q.in('species_id', filters.species);
      if (filters.bait) q = q.ilike('bait_used', `%${filters.bait}%`);
      const cutoff = new Date(Date.now() - filters.freshnessHours * 3600 * 1000).toISOString();
      q = q.gt('created_at', cutoff);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });
}
```

---

## Task 7.3 — `FilterBar` UI

Reference Stitch `bitemap-ux-research.md` §4 Map Home.

- [ ] Horizontal scrollable chip row below search: Species, Bait, Technique, Freshness (6h/24h/48h).
- [ ] Tapping Species opens a bottom sheet multi-select.
- [ ] Freshness is a segmented control.
- [ ] Active filters have filled background; inactive are outline.
- [ ] Chip "Clear all" appears when any filter active.

---

## Task 7.4 — `ViewModeToggle` (Pins ↔ Heatmap)

- [ ] Top-right floating pill. Default "Pins". Tap switches to "Heatmap".
- [ ] State lives in `filtersStore`.

---

## Task 7.5 — `HeatmapLayer` (Mapbox)

Mobile:

```tsx
import { HeatmapLayer, ShapeSource } from '@rnmapbox/maps';

export function HeatmapLayerView({ catches }: { catches: Catch[] }) {
  const features = catches.map(c => ({
    type: 'Feature', geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
    properties: { weight: weightFor(c.created_at) },
  }));
  return (
    <ShapeSource id="catches-src" shape={{ type: 'FeatureCollection', features }}>
      <HeatmapLayer id="catches-heat" style={{
        heatmapWeight: ['get', 'weight'],
        heatmapIntensity: 1,
        heatmapRadius: 30,
        heatmapColor: [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(43,183,168,0)',
          0.3, 'rgba(43,183,168,0.3)',
          0.6, 'rgba(14,92,138,0.6)',
          1, 'rgba(228,87,46,0.85)',
        ],
      }} />
    </ShapeSource>
  );
}
```

Web: equivalent `mapbox-gl` heatmap layer config.

- [ ] Weight formula: `weightFor(created_at)` returns 1.0 for fresh → 0.1 at 48h.

---

## Task 7.6 — Realtime Live Updates

Already wired in Phase 5 (`useCatchSubscription`). In this phase, extend to:

- [ ] On `INSERT`: invalidate `catches.map` query key
- [ ] On `UPDATE` (e.g., `is_hidden = true` from moderation): also invalidate
- [ ] E2E: two devices side-by-side. Device A posts → Device B pin appears <5s.

---

## Task 7.7 — Decay Verification

The query in 7.2 already filters `expires_at > now()`. Additional test:

- [ ] Insert row with `expires_at = now() + 1 minute`
- [ ] Map shows it
- [ ] Wait 61s → map no longer shows it (after next refetch window)

---

## Task 7.8 — Tackle Shop / POI Layer (wired but empty)

- [ ] `layers.tackleShops` in store
- [ ] When true: query `poi` table (empty in v1) → render as different pin style
- [ ] In v1 the list is empty; this layer is a placeholder so UX + code path are already in place for Phase 2+

---

## Phase 7 Acceptance

- [ ] Unit: filter reducer actions work
- [ ] Unit: `weightFor(new Date())` ≈ 1.0; 48h old ≈ 0.1
- [ ] E2E: filter by species narrows pins visually
- [ ] E2E: heatmap toggle changes render, no errors
- [ ] E2E: two-device realtime under 5s
- [ ] Integration: expired row auto-disappears (spec verification item 3)
- [ ] Tag `v0.7.0-map-filters`
