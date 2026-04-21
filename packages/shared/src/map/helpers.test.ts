import { describe, it, expect } from 'vitest';
import {
  alphaForAgeHours,
  pinColorForCategory,
  mapboxStyleForTheme,
  type MapCatchPin,
} from './helpers';

describe('alphaForAgeHours', () => {
  it('fresh catch returns 1.0', () => {
    expect(alphaForAgeHours(0)).toBeCloseTo(1.0);
  });

  it('24h old returns ~0.65', () => {
    expect(alphaForAgeHours(24)).toBeCloseTo(0.65, 2);
  });

  it('48h old returns 0.3', () => {
    expect(alphaForAgeHours(48)).toBeCloseTo(0.3, 2);
  });

  it('>48h clamps to 0.3', () => {
    expect(alphaForAgeHours(72)).toBeCloseTo(0.3, 2);
  });

  it('negative hours clamps to 1.0', () => {
    expect(alphaForAgeHours(-5)).toBeCloseTo(1.0);
  });
});

describe('pinColorForCategory', () => {
  it('returns distinct colors per category', () => {
    const colors = new Set([
      pinColorForCategory('saltwater'),
      pinColorForCategory('freshwater'),
      pinColorForCategory('estuarine'),
      pinColorForCategory('pelagic'),
      pinColorForCategory('other'),
    ]);
    expect(colors.size).toBe(5);
  });
});

describe('mapboxStyleForTheme', () => {
  it('dark scheme returns dark style', () => {
    expect(mapboxStyleForTheme('dark')).toContain('dark-v11');
  });

  it('light scheme returns light style', () => {
    expect(mapboxStyleForTheme('light')).toContain('light-v11');
  });

  it('boolean true returns dark style', () => {
    expect(mapboxStyleForTheme(true)).toContain('dark-v11');
  });

  it('null/undefined defaults to light', () => {
    expect(mapboxStyleForTheme(null)).toContain('light-v11');
    expect(mapboxStyleForTheme(undefined)).toContain('light-v11');
  });
});

/** Test-only fixture — never shipped as user-facing data. */
const SAMPLE_PINS: MapCatchPin[] = [
  { id: 't1', lat: -38.083, lng: 144.875, species: 'Snapper', category: 'saltwater', ageHours: 2 },
  { id: 't2', lat: -38.132, lng: 144.655, species: 'KG Whiting', category: 'saltwater', ageHours: 12 },
];

describe('MapCatchPin sample bounds', () => {
  it('fixture pins sit inside Port Phillip Bay bounds', () => {
    SAMPLE_PINS.forEach((c) => {
      expect(c.lat).toBeGreaterThan(-38.5);
      expect(c.lat).toBeLessThan(-37.7);
      expect(c.lng).toBeGreaterThan(144.4);
      expect(c.lng).toBeLessThan(145.1);
    });
  });
});
