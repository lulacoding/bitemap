import { create } from 'zustand';

export type ViewMode = 'pins' | 'heatmap';
export type FreshnessHours = 6 | 24 | 48;

export interface MapLayers {
  /** Render boat ramps / bait shops / fuel POIs (Phase 7.5) */
  pois: boolean;
  /** Render VIC marine national park / sanctuary overlays */
  marineParks: boolean;
}

export interface FiltersState {
  species: string[];
  bait: string | undefined;
  technique: string | undefined;
  freshnessHours: FreshnessHours;
  viewMode: ViewMode;
  layers: MapLayers;

  toggleSpecies: (id: string) => void;
  setBait: (v: string | undefined) => void;
  setTechnique: (v: string | undefined) => void;
  setFreshness: (h: FreshnessHours) => void;
  setViewMode: (m: ViewMode) => void;
  toggleLayer: (key: keyof MapLayers) => void;
  reset: () => void;
}

export const DEFAULT_FILTERS = {
  species: [],
  bait: undefined,
  technique: undefined,
  freshnessHours: 48 as FreshnessHours,
  viewMode: 'pins' as ViewMode,
  layers: { pois: false, marineParks: true },
};

export const useFiltersStore = create<FiltersState>((set) => ({
  ...DEFAULT_FILTERS,

  toggleSpecies: (id: string) =>
    set((s) => ({
      species: s.species.includes(id)
        ? s.species.filter((x) => x !== id)
        : [...s.species, id],
    })),
  setBait: (v) => set({ bait: v }),
  setTechnique: (v) => set({ technique: v }),
  setFreshness: (h) => set({ freshnessHours: h }),
  setViewMode: (m) => set({ viewMode: m }),
  toggleLayer: (key) =>
    set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  reset: () => set(DEFAULT_FILTERS),
}));

/**
 * Heatmap weight from catch age in hours.
 * Fresh (0h) = 1.0 → 48h = 0.1 (linear).
 */
export function weightForAgeHours(h: number): number {
  const clamped = Math.max(0, Math.min(48, h));
  return 1.0 - (clamped / 48) * 0.9;
}

/**
 * Heatmap weight from an ISO created_at timestamp.
 */
export function weightForCreatedAt(iso: string, now: Date = new Date()): number {
  const ageHours = (now.getTime() - new Date(iso).getTime()) / 3_600_000;
  return weightForAgeHours(ageHours);
}
