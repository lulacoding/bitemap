import { supabase } from '../supabase/browser';
import { speciesSchema, type Species } from '../schemas/species';

export async function listSpecies(): Promise<Species[]> {
  const { data, error } = await supabase().from('species').select('*').order('common_name');
  if (error) throw error;
  return (data ?? []).map((d) => speciesSchema.parse(d));
}

export async function searchSpecies(q: string): Promise<Species[]> {
  const like = `%${q}%`;
  const { data, error } = await supabase()
    .from('species')
    .select('*')
    .or(`common_name.ilike.${like},scientific_name.ilike.${like}`)
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((d) => speciesSchema.parse(d));
}

export async function getSpeciesById(id: string): Promise<Species | null> {
  const { data, error } = await supabase().from('species').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? speciesSchema.parse(data) : null;
}
