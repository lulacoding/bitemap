import { supabase } from '../supabase/browser';

export interface UserStats {
  total_catches: number;
  distinct_species: number;
  catches_this_month: number;
}

export interface SpeciesBreakdown {
  species_id: string;
  common_name: string;
  count: number;
  best_size_mm: number | null;
}

export interface MonthlyBucket {
  month: string;
  count: number;
}

/**
 * Aggregate stats for one user. Only counts own catches (no privacy filter).
 * For other viewers, use listVisibleCatches + client aggregation.
 */
export async function getMyStats(): Promise<UserStats> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) {
    return { total_catches: 0, distinct_species: 0, catches_this_month: 0 };
  }

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const [{ count: totalCount }, { count: monthCount }, distinctRes] =
    await Promise.all([
      supabase()
        .from('catches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.id),
      supabase()
        .from('catches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.id)
        .gte('created_at', firstOfMonth.toISOString()),
      supabase()
        .from('catches')
        .select('species_id')
        .eq('user_id', auth.user.id),
    ]);

  const distinctSpecies = new Set(
    (distinctRes.data ?? []).map((r) => (r as { species_id: string }).species_id),
  );

  return {
    total_catches: totalCount ?? 0,
    distinct_species: distinctSpecies.size,
    catches_this_month: monthCount ?? 0,
  };
}

/**
 * Species breakdown: count + best size per species for the signed-in user.
 */
export async function getMySpeciesBreakdown(): Promise<SpeciesBreakdown[]> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await supabase()
    .from('catches')
    .select('species_id, size_mm, species:species(common_name)')
    .eq('user_id', auth.user.id);

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    species_id: string;
    size_mm: number | null;
    species: { common_name: string } | null;
  }>;

  const agg = new Map<string, SpeciesBreakdown>();
  for (const r of rows) {
    const existing = agg.get(r.species_id);
    const name = r.species?.common_name ?? 'Unknown';
    if (existing) {
      existing.count += 1;
      if (
        r.size_mm != null &&
        (existing.best_size_mm == null || r.size_mm > existing.best_size_mm)
      ) {
        existing.best_size_mm = r.size_mm;
      }
    } else {
      agg.set(r.species_id, {
        species_id: r.species_id,
        common_name: name,
        count: 1,
        best_size_mm: r.size_mm,
      });
    }
  }

  return Array.from(agg.values()).sort((a, b) => b.count - a.count);
}

/**
 * Monthly catch counts for the signed-in user (last 12 months).
 */
export async function getMyMonthlyCounts(): Promise<MonthlyBucket[]> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) return [];

  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const { data, error } = await supabase()
    .from('catches')
    .select('created_at')
    .eq('user_id', auth.user.id)
    .gte('created_at', since.toISOString());

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const r of (data ?? []) as Array<{ created_at: string }>) {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Today's catch counts for the signed-in user, grouped by species.
 * Drives the bag-limit counter.
 */
export async function getTodaysCatchCountsBySpecies(): Promise<
  Map<string, number>
> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) return new Map();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase()
    .from('catches')
    .select('species_id, quantity')
    .eq('user_id', auth.user.id)
    .gte('created_at', startOfDay.toISOString());

  if (error) throw error;

  const map = new Map<string, number>();
  for (const r of (data ?? []) as Array<{ species_id: string; quantity: number }>) {
    map.set(r.species_id, (map.get(r.species_id) ?? 0) + r.quantity);
  }
  return map;
}
