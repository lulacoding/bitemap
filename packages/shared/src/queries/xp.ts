import { z } from 'zod';
import { supabase } from '../supabase/browser';

export const xpProfileSchema = z.object({
  id: z.uuid(),
  username: z.string().nullable(),
  xp: z.number().int(),
  streak_days: z.number().int(),
  streak_last_catch: z.string().nullable(),
});

export type XpProfile = z.infer<typeof xpProfileSchema>;

/**
 * Rank tiers for the XP badge. Tuned to feel rewarding but not gate-y.
 * Every tier is purely cosmetic — it NEVER unlocks features.
 */
export type XpTier =
  | 'Rookie'
  | 'Angler'
  | 'Regular'
  | 'Veteran'
  | 'Master'
  | 'Legend';

export function xpTier(xp: number): XpTier {
  if (xp < 100) return 'Rookie';
  if (xp < 500) return 'Angler';
  if (xp < 2_000) return 'Regular';
  if (xp < 5_000) return 'Veteran';
  if (xp < 15_000) return 'Master';
  return 'Legend';
}

/**
 * XP remaining until the next tier (0 when already Legend).
 */
export function xpToNextTier(xp: number): number {
  const thresholds = [100, 500, 2_000, 5_000, 15_000];
  for (const t of thresholds) {
    if (xp < t) return t - xp;
  }
  return 0;
}

/**
 * Fetch the XP + streak fields for the signed-in user.
 */
export async function getMyXp(): Promise<XpProfile | null> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase()
    .from('profiles')
    .select('id, username, xp, streak_days, streak_last_catch')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) throw error;
  return data ? xpProfileSchema.parse(data) : null;
}
