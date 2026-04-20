import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

let _client: SupabaseClient<Database> | null = null;

export function supabase(): SupabaseClient<Database> {
  if (_client) return _client;
  const url =
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    '';
  const key =
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    '';
  _client = createClient<Database>(url, key, {
    auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
  });
  return _client;
}

export function resetSupabaseClient() {
  _client = null;
}
