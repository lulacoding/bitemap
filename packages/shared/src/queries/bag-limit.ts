import {
  getRegulationForState,
  type AuState,
  type SpeciesRegulation,
} from '../regulations/regulations';

export type BagLimitTier = 'safe' | 'warn' | 'reached';

export interface BagLimitStatus {
  species_id: string;
  /** Running count today (respecting user's quantity per catch) */
  count_today: number;
  regulation: SpeciesRegulation | null;
  tier: BagLimitTier;
  /** Human-readable hint for the UI */
  message: string;
}

/**
 * Classify a species' today-count against the user's home-state bag limit.
 * Returns 'reached' when count >= limit, 'warn' at ≥80% of limit, else 'safe'.
 */
export function classifyBagLimit(
  speciesId: string,
  countToday: number,
  regulation: SpeciesRegulation | null,
): BagLimitStatus {
  if (!regulation || regulation.bag_limit == null) {
    return {
      species_id: speciesId,
      count_today: countToday,
      regulation,
      tier: 'safe',
      message: 'No bag limit recorded for this state.',
    };
  }

  const limit = regulation.bag_limit;
  if (limit === 0) {
    return {
      species_id: speciesId,
      count_today: countToday,
      regulation,
      tier: 'safe',
      message: 'No bag limit (invasive / unlimited).',
    };
  }

  if (countToday >= limit) {
    return {
      species_id: speciesId,
      count_today: countToday,
      regulation,
      tier: 'reached',
      message: `${countToday}/${limit} — you've hit the ${regulation.state} bag limit.`,
    };
  }

  if (countToday >= Math.ceil(limit * 0.8)) {
    return {
      species_id: speciesId,
      count_today: countToday,
      regulation,
      tier: 'warn',
      message: `${countToday}/${limit} — approaching the ${regulation.state} bag limit.`,
    };
  }

  return {
    species_id: speciesId,
    count_today: countToday,
    regulation,
    tier: 'safe',
    message: `${countToday}/${limit}`,
  };
}

/**
 * Fetch + classify bag-limit status for a single (species, state) pair.
 */
export async function getBagLimitStatusForSpecies(
  speciesId: string,
  state: AuState,
  countToday: number,
): Promise<BagLimitStatus> {
  const regulation = await getRegulationForState(speciesId, state);
  return classifyBagLimit(speciesId, countToday, regulation);
}
