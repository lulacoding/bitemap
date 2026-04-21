import { z } from 'zod';
import { supabase } from '../supabase/browser';
import { auStateSchema } from '../regulations/regulations';

export const profileSchema = z.object({
  id: z.uuid(),
  username: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  home_state: auStateSchema.nullable(),
  is_guide: z.boolean(),
  is_verified: z.boolean(),
  photo_backup_enabled: z.boolean(),
  analytics_opt_out: z.boolean(),
  created_at: z.string(),
});

export type Profile = z.infer<typeof profileSchema>;

export const profileUpdateSchema = z.object({
  username: z.string().min(3).max(24).optional(),
  bio: z.string().max(280).optional(),
  location: z.string().max(80).optional(),
  home_state: auStateSchema.optional(),
  avatar_url: z.string().url().optional(),
  photo_backup_enabled: z.boolean().optional(),
  analytics_opt_out: z.boolean().optional(),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/** Public profile (no email, no private fields). */
export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase()
    .from('profiles')
    .select(
      'id, username, avatar_url, bio, location, home_state, is_guide, is_verified, photo_backup_enabled, analytics_opt_out, created_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? profileSchema.parse(data) : null;
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const { data, error } = await supabase()
    .from('profiles')
    .select(
      'id, username, avatar_url, bio, location, home_state, is_guide, is_verified, photo_backup_enabled, analytics_opt_out, created_at',
    )
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return data ? profileSchema.parse(data) : null;
}

/** Get the signed-in user's own profile. */
export async function getMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) return null;
  return getProfileById(auth.user.id);
}

/** Update signed-in user's own profile. Input validated via Zod. */
export async function updateMyProfile(patch: ProfileUpdate): Promise<Profile> {
  const validated = profileUpdateSchema.parse(patch);
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');

  // Strip undefined (exactOptionalPropertyTypes requires absent, not undefined).
  const row = Object.fromEntries(
    Object.entries(validated).filter(([, v]) => v !== undefined),
  );

  const { data, error } = await supabase()
    .from('profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(row as any)
    .eq('id', auth.user.id)
    .select(
      'id, username, avatar_url, bio, location, home_state, is_guide, is_verified, photo_backup_enabled, analytics_opt_out, created_at',
    )
    .single();

  if (error) throw error;
  return profileSchema.parse(data);
}

/**
 * Logbook: all catches by `userId`, newest first.
 * Owner sees everything (including hidden + expired); other viewers see only
 * non-hidden, non-expired, non-private rows.
 */
export async function getLogbook(userId: string, limit = 100) {
  const { data: auth } = await supabase().auth.getUser();
  const isOwner = auth.user?.id === userId;

  let q = supabase()
    .from('catches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!isOwner) {
    q = q
      .eq('is_hidden', false)
      .gt('expires_at', new Date().toISOString())
      .neq('privacy_level', 'hidden');
  }

  const { data, error } = await q.limit(limit);
  if (error) throw error;
  return data ?? [];
}
