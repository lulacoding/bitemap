import { describe, it, expect } from 'vitest';
import { tideBelowRampThreshold } from './queries';
import type { Poi } from './schemas';

const base: Poi = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Test Ramp',
  category: 'boat_ramp',
  lat: -37.86,
  lng: 144.89,
  address: null,
  phone: null,
  hours: null,
  website: null,
  rating_avg: null,
  rating_count: 0,
  tide_min_m: 1.0,
  user_submitted: false,
  source: 'council',
  state: 'VIC',
  created_at: '2026-04-20T00:00:00Z',
  created_by: null,
};

describe('tideBelowRampThreshold', () => {
  it('returns false when tide is above threshold', () => {
    expect(tideBelowRampThreshold(base, 1.2)).toBe(false);
  });

  it('returns true when tide is below threshold', () => {
    expect(tideBelowRampThreshold(base, 0.7)).toBe(true);
  });

  it('returns false when threshold is null', () => {
    const noThresh = { ...base, tide_min_m: null };
    expect(tideBelowRampThreshold(noThresh, 0.5)).toBe(false);
  });

  it('edge case: exact threshold does not trigger', () => {
    expect(tideBelowRampThreshold(base, 1.0)).toBe(false);
  });
});
