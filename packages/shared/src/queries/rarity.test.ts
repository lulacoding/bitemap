import { describe, it, expect } from 'vitest';
import { shouldNotifyRareCatch, type SpeciesRarity } from './rarity';

const mk = (
  rarity_tier: SpeciesRarity['rarity_tier'],
  catch_count_90d = 0,
): SpeciesRarity => ({
  species_id: '11111111-1111-4111-8111-111111111111',
  region: 'port_phillip',
  catch_count_90d,
  rarity_tier,
  notes: null,
});

describe('shouldNotifyRareCatch', () => {
  it('returns false when rarity is null', () => {
    expect(shouldNotifyRareCatch(null)).toBe(false);
  });

  it('always notifies for extraordinary species', () => {
    expect(shouldNotifyRareCatch(mk('extraordinary', 0))).toBe(true);
    expect(shouldNotifyRareCatch(mk('extraordinary', 100))).toBe(true);
  });

  it('notifies for rare species when corpus is small', () => {
    expect(shouldNotifyRareCatch(mk('rare', 0))).toBe(true);
    expect(shouldNotifyRareCatch(mk('rare', 4))).toBe(true);
  });

  it('does not notify for rare species once corpus exceeds 5', () => {
    expect(shouldNotifyRareCatch(mk('rare', 5))).toBe(false);
    expect(shouldNotifyRareCatch(mk('rare', 50))).toBe(false);
  });

  it('never notifies for common or uncommon', () => {
    expect(shouldNotifyRareCatch(mk('common', 0))).toBe(false);
    expect(shouldNotifyRareCatch(mk('uncommon', 0))).toBe(false);
  });
});
