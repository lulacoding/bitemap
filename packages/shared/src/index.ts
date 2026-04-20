export const APP_NAME = 'BiteMap' as const;

export type { Database } from './types/database';
export { supabase, resetSupabaseClient } from './supabase/browser';
