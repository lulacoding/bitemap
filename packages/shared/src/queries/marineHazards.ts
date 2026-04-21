import type { Database } from '../types/database';
import { supabase } from '../supabase/browser';

export type MarineHazard = Database['public']['Tables']['marine_hazards']['Row'];

export async function listMarineHazards(): Promise<MarineHazard[]> {
  const { data, error } = await supabase()
    .from('marine_hazards')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('severity', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
