import { supabase } from '../supabase/browser';
import { applyPrivacy } from '../geo/privacy';
import {
  catchSchema,
  type Catch,
  type CatchInput,
} from '../schemas/catch';

export interface CatchFilters {
  species?: string[];
  bait?: string | undefined;
  technique?: string | undefined;
  /** Upper-bound of catch age in hours (default 48) */
  freshnessHours?: number;
  limit?: number;
}

/**
 * List recent public catches (excludes expired and hidden).
 * Supports optional filters so the same helper powers both the map and the
 * filtered-view query hook.
 */
export async function listCatches(
  arg: CatchFilters | number = {},
): Promise<Catch[]> {
  const f: CatchFilters = typeof arg === 'number' ? { limit: arg } : arg;
  const limit = f.limit ?? 200;
  const freshnessHours = f.freshnessHours ?? 48;
  const cutoff = new Date(Date.now() - freshnessHours * 3_600_000).toISOString();

  let q = supabase()
    .from('catches')
    .select('*')
    .eq('is_hidden', false)
    .gt('expires_at', new Date().toISOString())
    .gt('created_at', cutoff)
    .neq('privacy_level', 'hidden');

  if (f.species && f.species.length > 0) {
    q = q.in('species_id', f.species);
  }
  if (f.bait) {
    q = q.ilike('bait_used', `%${f.bait}%`);
  }
  if (f.technique) {
    q = q.ilike('technique', `%${f.technique}%`);
  }

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((d) => catchSchema.parse(d));
}

/**
 * Get a single catch by ID (for detail screens).
 */
export async function getCatchById(id: string): Promise<Catch | null> {
  const { data, error } = await supabase()
    .from('catches')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? catchSchema.parse(data) : null;
}

/**
 * Create a catch. Applies client-side privacy snap before insert.
 *
 * NOTE: The server should ALSO re-apply privacy snap in a trigger or
 * Edge Function to prevent a malicious client from sending
 * privacy_level='area' with raw GPS. The current implementation trusts
 * the client; server-side snap will land in Phase 5a.
 */
export async function createCatch(input: CatchInput): Promise<Catch> {
  const snapped = applyPrivacy(input.privacy_level, {
    lat: input.lat,
    lng: input.lng,
  });

  const { data: user } = await supabase().auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const row = {
    user_id: user.user.id,
    species_id: input.species_id,
    quantity: input.quantity,
    size_mm: input.size_mm ?? null,
    bait_used: input.bait_used ?? null,
    technique: input.technique ?? null,
    location_name: input.location_name ?? null,
    lat: snapped.lat,
    lng: snapped.lng,
    privacy_level: input.privacy_level,
    is_hidden: snapped.is_hidden,
    photo_url: input.photo_url ?? null,
  };

  const { data, error } = await supabase()
    .from('catches')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return catchSchema.parse(data);
}
