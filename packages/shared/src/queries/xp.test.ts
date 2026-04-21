import { describe, it, expect } from 'vitest';
import { xpTier, xpToNextTier } from './xp';

describe('xpTier', () => {
  it.each([
    [0, 'Rookie'],
    [50, 'Rookie'],
    [99, 'Rookie'],
    [100, 'Angler'],
    [499, 'Angler'],
    [500, 'Regular'],
    [1_999, 'Regular'],
    [2_000, 'Veteran'],
    [4_999, 'Veteran'],
    [5_000, 'Master'],
    [14_999, 'Master'],
    [15_000, 'Legend'],
    [99_000, 'Legend'],
  ])('xp %i → %s', (xp, expected) => {
    expect(xpTier(xp)).toBe(expected);
  });
});

describe('xpToNextTier', () => {
  it('returns the gap to the next threshold', () => {
    expect(xpToNextTier(0)).toBe(100);
    expect(xpToNextTier(50)).toBe(50);
    expect(xpToNextTier(100)).toBe(400);
    expect(xpToNextTier(499)).toBe(1);
  });

  it('returns 0 at the top tier', () => {
    expect(xpToNextTier(15_000)).toBe(0);
    expect(xpToNextTier(100_000)).toBe(0);
  });
});
