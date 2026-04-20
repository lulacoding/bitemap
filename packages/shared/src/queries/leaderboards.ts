import { supabase } from '../supabase/browser';

export interface LeaderboardRow {
  user_id: string;
  catch_count: number;
  best_size_mm: number | null;
  /** Only populated on the overall board */
  species_count: number | undefined;
}

/**
 * Leaderboard for a specific species within the current month.
 */
export async function getSpeciesLeaderboard(
  speciesId: string,
  limit = 50,
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase()
    .from('leaderboard_by_species')
    .select('user_id, catch_count, best_size_mm')
    .eq('species_id', speciesId)
    .order('catch_count', { ascending: false })
    .order('best_size_mm', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

/**
 * Overall leaderboard across all species within the current month.
 */
export async function getOverallLeaderboard(
  limit = 50,
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase()
    .from('leaderboard_overall')
    .select('user_id, catch_count, species_count, best_size_mm')
    .order('catch_count', { ascending: false })
    .order('species_count', { ascending: false, nullsFirst: false })
    .order('best_size_mm', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

/**
 * Port Phillip Bay area leaderboard within the current month.
 */
export async function getPortPhillipLeaderboard(
  limit = 50,
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase()
    .from('leaderboard_port_phillip')
    .select('user_id, catch_count, best_size_mm')
    .order('catch_count', { ascending: false })
    .order('best_size_mm', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

/**
 * Pure comparator matching the SQL ordering, for unit tests + client-side
 * pinning of the current user's row when they're outside the top N.
 */
export function compareLeaderboardRows(
  a: LeaderboardRow,
  b: LeaderboardRow,
): number {
  if (b.catch_count !== a.catch_count) return b.catch_count - a.catch_count;
  if ((b.species_count ?? 0) !== (a.species_count ?? 0)) {
    return (b.species_count ?? 0) - (a.species_count ?? 0);
  }
  return (b.best_size_mm ?? 0) - (a.best_size_mm ?? 0);
}
