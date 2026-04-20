import { z } from 'zod';
import { supabase } from '../supabase/browser';

export const AU_STATES = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'] as const;
export const auStateSchema = z.enum(AU_STATES);
export type AuState = z.infer<typeof auStateSchema>;

export const speciesRegulationSchema = z.object({
  species_id: z.uuid(),
  state: auStateSchema,
  min_legal_size_mm: z.number().int().nonnegative().nullable(),
  bag_limit: z.number().int().nonnegative().nullable(),
  closed_season_start: z.string().nullable(),
  closed_season_end: z.string().nullable(),
  notes: z.string().nullable(),
  source_url: z.string().nullable(),
  last_verified: z.string().nullable(),
});

export type SpeciesRegulation = z.infer<typeof speciesRegulationSchema>;

/**
 * All per-state regulations for a given species.
 * Returns [] when species has no state-specific rows (falls back to `species` table baseline).
 */
export async function getRegulationsForSpecies(
  speciesId: string,
): Promise<SpeciesRegulation[]> {
  const { data, error } = await supabase()
    .from('species_regulations')
    .select('*')
    .eq('species_id', speciesId)
    .order('state');

  if (error) throw error;
  return (data ?? []).map((r) => speciesRegulationSchema.parse(r));
}

/**
 * Regulation for a species in a specific state.
 * Returns null when no row exists.
 */
export async function getRegulationForState(
  speciesId: string,
  state: AuState,
): Promise<SpeciesRegulation | null> {
  const { data, error } = await supabase()
    .from('species_regulations')
    .select('*')
    .eq('species_id', speciesId)
    .eq('state', state)
    .maybeSingle();

  if (error) throw error;
  return data ? speciesRegulationSchema.parse(data) : null;
}

/**
 * Pretty-print deltas between states for UI display.
 * Example: ["VIC: 280mm / bag 3", "NSW: 300mm / bag 10"]
 */
export function formatRegulationRow(r: SpeciesRegulation): string {
  const size = r.min_legal_size_mm != null ? `${r.min_legal_size_mm}mm` : 'no min';
  const bag = r.bag_limit != null ? `bag ${r.bag_limit}` : 'no bag';
  return `${r.state}: ${size} / ${bag}`;
}
