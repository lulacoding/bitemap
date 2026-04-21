import { z } from 'zod';
import { supabase } from '../supabase/browser';

export const rarityTierSchema = z.enum([
  'common',
  'uncommon',
  'rare',
  'extraordinary',
]);
export type RarityTier = z.infer<typeof rarityTierSchema>;

export const speciesRaritySchema = z.object({
  species_id: z.uuid(),
  region: z.string(),
  catch_count_90d: z.number().int(),
  rarity_tier: rarityTierSchema,
  notes: z.string().nullable(),
});

export type SpeciesRarity = z.infer<typeof speciesRaritySchema>;

/**
 * Read the rarity row for a single species in a region.
 * Returns null when the species has no row for that region.
 */
export async function getSpeciesRarity(
  speciesId: string,
  region = 'port_phillip',
): Promise<SpeciesRarity | null> {
  const { data, error } = await supabase()
    .from('species_rarity')
    .select('*')
    .eq('species_id', speciesId)
    .eq('region', region)
    .maybeSingle();
  if (error) throw error;
  return data ? speciesRaritySchema.parse(data) : null;
}

/**
 * List all species in a region with a given rarity tier.
 * Used for the "Notable sightings" feed in Phase 10.
 */
export async function listSpeciesByRarity(
  tier: RarityTier,
  region = 'port_phillip',
): Promise<SpeciesRarity[]> {
  const { data, error } = await supabase()
    .from('species_rarity')
    .select('*')
    .eq('region', region)
    .eq('rarity_tier', tier);
  if (error) throw error;
  return (data ?? []).map((r) => speciesRaritySchema.parse(r));
}

/**
 * Pure helper: should a user see a rare-catch notification for this species?
 */
export function shouldNotifyRareCatch(
  rarity: SpeciesRarity | null,
): boolean {
  if (!rarity) return false;
  if (rarity.rarity_tier === 'extraordinary') return true;
  if (rarity.rarity_tier === 'rare' && rarity.catch_count_90d < 5) return true;
  return false;
}
