import { describe, it, expect } from 'vitest';
import {
  moonPhase,
  moonIllumination,
  solunarRating,
  moonAgeFraction,
  MOON_PHASES,
} from './moon';

describe('moonAgeFraction', () => {
  it('returns value between 0 and 1', () => {
    for (let i = 0; i < 30; i++) {
      const d = new Date(2026, 3, i + 1);
      const f = moonAgeFraction(d);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it('advances monotonically within a lunar month', () => {
    const d1 = new Date('2026-03-10T00:00:00Z');
    const d2 = new Date('2026-03-15T00:00:00Z');
    const d3 = new Date('2026-03-20T00:00:00Z');
    const f1 = moonAgeFraction(d1);
    const f2 = moonAgeFraction(d2);
    const f3 = moonAgeFraction(d3);
    // Either monotonic or wrapped through a new moon
    const ordered =
      (f2 > f1 && f3 > f2) || (f2 > f1 && f3 < f2) || (f2 < f1 && f3 > f2);
    expect(ordered).toBe(true);
  });
});

describe('moonIllumination', () => {
  it('is between 0 and 1 at any date', () => {
    for (let i = 0; i < 10; i++) {
      const d = new Date(2026, 0, 1 + i * 3);
      const lum = moonIllumination(d);
      expect(lum).toBeGreaterThanOrEqual(0);
      expect(lum).toBeLessThanOrEqual(1);
    }
  });
});

describe('moonPhase', () => {
  it('returns one of the 8 named phases', () => {
    const p = moonPhase(new Date());
    expect(MOON_PHASES).toContain(p);
  });

  it('is deterministic for the same date', () => {
    const d = new Date('2026-03-03T12:00:00Z');
    expect(moonPhase(d)).toBe(moonPhase(d));
  });
});

describe('solunarRating', () => {
  it('returns value in 0..4', () => {
    const r = solunarRating(new Date(), -38.1, 144.85);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(4);
  });

  it('dawn on new/full moon gets max rating', () => {
    // Find a full moon in our dataset, check rating at 06:00
    let found = false;
    for (let i = 0; i < 60; i++) {
      const d = new Date(2026, 2, 1 + i);
      if (moonPhase(d) === 'full') {
        d.setHours(6, 0, 0, 0);
        expect(solunarRating(d, -38.1, 144.85)).toBe(4);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('midday on non-peak phase gets base rating', () => {
    // Find a waxing_crescent day, check rating at noon
    for (let i = 0; i < 30; i++) {
      const d = new Date(2026, 2, 1 + i);
      if (moonPhase(d) === 'waxing_crescent') {
        d.setHours(12, 0, 0, 0);
        expect(solunarRating(d, -38.1, 144.85)).toBe(2);
        return;
      }
    }
  });
});
