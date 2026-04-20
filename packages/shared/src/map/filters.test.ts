import { describe, it, expect, beforeEach } from 'vitest';
import {
  useFiltersStore,
  DEFAULT_FILTERS,
  weightForAgeHours,
  weightForCreatedAt,
} from './filters';

describe('useFiltersStore', () => {
  beforeEach(() => {
    useFiltersStore.setState(DEFAULT_FILTERS);
  });

  it('has expected default state', () => {
    const s = useFiltersStore.getState();
    expect(s.species).toEqual([]);
    expect(s.freshnessHours).toBe(48);
    expect(s.viewMode).toBe('pins');
    expect(s.layers.marineParks).toBe(true);
    expect(s.layers.pois).toBe(false);
  });

  it('toggleSpecies adds then removes an id', () => {
    useFiltersStore.getState().toggleSpecies('snapper-id');
    expect(useFiltersStore.getState().species).toContain('snapper-id');
    useFiltersStore.getState().toggleSpecies('snapper-id');
    expect(useFiltersStore.getState().species).not.toContain('snapper-id');
  });

  it('setFreshness updates freshnessHours', () => {
    useFiltersStore.getState().setFreshness(6);
    expect(useFiltersStore.getState().freshnessHours).toBe(6);
  });

  it('setViewMode updates viewMode', () => {
    useFiltersStore.getState().setViewMode('heatmap');
    expect(useFiltersStore.getState().viewMode).toBe('heatmap');
  });

  it('toggleLayer flips layer flag', () => {
    useFiltersStore.getState().toggleLayer('pois');
    expect(useFiltersStore.getState().layers.pois).toBe(true);
    useFiltersStore.getState().toggleLayer('marineParks');
    expect(useFiltersStore.getState().layers.marineParks).toBe(false);
  });

  it('reset restores defaults', () => {
    useFiltersStore.getState().toggleSpecies('x');
    useFiltersStore.getState().setFreshness(6);
    useFiltersStore.getState().reset();
    expect(useFiltersStore.getState().species).toEqual([]);
    expect(useFiltersStore.getState().freshnessHours).toBe(48);
  });
});

describe('weightForAgeHours', () => {
  it('fresh → 1.0', () => expect(weightForAgeHours(0)).toBeCloseTo(1.0));
  it('24h → 0.55', () => expect(weightForAgeHours(24)).toBeCloseTo(0.55, 2));
  it('48h → 0.1', () => expect(weightForAgeHours(48)).toBeCloseTo(0.1, 2));
  it('>48h clamps to 0.1', () => expect(weightForAgeHours(72)).toBeCloseTo(0.1, 2));
});

describe('weightForCreatedAt', () => {
  it('recent catch → near 1.0', () => {
    const iso = new Date(Date.now() - 60_000).toISOString();
    expect(weightForCreatedAt(iso)).toBeGreaterThan(0.95);
  });

  it('stale 48h catch → 0.1', () => {
    const iso = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    expect(weightForCreatedAt(iso)).toBeCloseTo(0.1, 1);
  });
});
