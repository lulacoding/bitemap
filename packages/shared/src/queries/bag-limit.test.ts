import { describe, it, expect } from 'vitest';
import { classifyBagLimit } from './bag-limit';
import type { SpeciesRegulation } from '../regulations/regulations';

const reg = (bag_limit: number | null): SpeciesRegulation => ({
  species_id: '11111111-1111-4111-8111-111111111111',
  state: 'VIC',
  min_legal_size_mm: 280,
  bag_limit,
  closed_season_start: null,
  closed_season_end: null,
  notes: null,
  source_url: null,
  last_verified: null,
});

describe('classifyBagLimit', () => {
  it('returns safe when no regulation exists', () => {
    const r = classifyBagLimit('abc', 5, null);
    expect(r.tier).toBe('safe');
  });

  it('returns safe when bag_limit is null', () => {
    const r = classifyBagLimit('abc', 5, reg(null));
    expect(r.tier).toBe('safe');
  });

  it('returns safe when bag_limit is 0 (invasive / unlimited)', () => {
    const r = classifyBagLimit('abc', 100, reg(0));
    expect(r.tier).toBe('safe');
  });

  it('returns safe when count is below 80% of limit', () => {
    expect(classifyBagLimit('abc', 1, reg(5)).tier).toBe('safe');
    expect(classifyBagLimit('abc', 3, reg(5)).tier).toBe('safe');
  });

  it('returns warn at exactly 80% of limit', () => {
    // 80% of 5 = 4, 80% of 10 = 8
    expect(classifyBagLimit('abc', 4, reg(5)).tier).toBe('warn');
    expect(classifyBagLimit('abc', 8, reg(10)).tier).toBe('warn');
  });

  it('returns reached at or above limit', () => {
    expect(classifyBagLimit('abc', 5, reg(5)).tier).toBe('reached');
    expect(classifyBagLimit('abc', 6, reg(5)).tier).toBe('reached');
    expect(classifyBagLimit('abc', 11, reg(10)).tier).toBe('reached');
  });

  it('includes state in messages', () => {
    const nsw: SpeciesRegulation = { ...reg(10), state: 'NSW' };
    expect(classifyBagLimit('abc', 10, nsw).message).toContain('NSW');
  });
});
