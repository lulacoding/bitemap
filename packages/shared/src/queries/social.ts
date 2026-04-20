import { z } from 'zod';
import { supabase } from '../supabase/browser';

// ============================================================================
// Likes
// ============================================================================

export async function likeCatch(catchId: string): Promise<void> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');
  const { error } = await supabase()
    .from('catch_likes')
    .insert({ catch_id: catchId, user_id: auth.user.id });
  // Swallow unique-violation (already liked) — idempotent semantics
  if (error && !error.message.toLowerCase().includes('duplicate')) throw error;
}

export async function unlikeCatch(catchId: string): Promise<void> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');
  const { error } = await supabase()
    .from('catch_likes')
    .delete()
    .match({ catch_id: catchId, user_id: auth.user.id });
  if (error) throw error;
}

export async function isCatchLikedByMe(catchId: string): Promise<boolean> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) return false;
  const { data, error } = await supabase()
    .from('catch_likes')
    .select('user_id')
    .eq('catch_id', catchId)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// ============================================================================
// Comments
// ============================================================================

export const commentSchema = z.object({
  id: z.uuid(),
  catch_id: z.uuid(),
  user_id: z.uuid(),
  body: z.string(),
  created_at: z.string(),
});

export type Comment = z.infer<typeof commentSchema>;

const commentInputSchema = z.object({
  body: z.string().min(1).max(500),
});

export async function listComments(catchId: string): Promise<Comment[]> {
  const { data, error } = await supabase()
    .from('catch_comments')
    .select('*')
    .eq('catch_id', catchId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => commentSchema.parse(r));
}

export async function postComment(
  catchId: string,
  body: string,
): Promise<Comment> {
  const { body: validBody } = commentInputSchema.parse({ body });
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');
  const { data, error } = await supabase()
    .from('catch_comments')
    .insert({
      catch_id: catchId,
      user_id: auth.user.id,
      body: validBody,
    })
    .select()
    .single();
  if (error) throw error;
  return commentSchema.parse(data);
}

export async function deleteComment(commentId: string): Promise<void> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');
  const { error } = await supabase()
    .from('catch_comments')
    .delete()
    .match({ id: commentId, user_id: auth.user.id });
  if (error) throw error;
}

// ============================================================================
// Follows
// ============================================================================

export async function follow(targetId: string): Promise<void> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');
  if (auth.user.id === targetId) throw new Error("Can't follow yourself");
  const { error } = await supabase()
    .from('follows')
    .insert({ follower_id: auth.user.id, following_id: targetId });
  if (error && !error.message.toLowerCase().includes('duplicate')) throw error;
}

export async function unfollow(targetId: string): Promise<void> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');
  const { error } = await supabase()
    .from('follows')
    .delete()
    .match({ follower_id: auth.user.id, following_id: targetId });
  if (error) throw error;
}

export async function isFollowing(targetId: string): Promise<boolean> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) return false;
  const { data, error } = await supabase()
    .from('follows')
    .select('follower_id')
    .eq('follower_id', auth.user.id)
    .eq('following_id', targetId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function getFollowerIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase()
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => (r as { follower_id: string }).follower_id);
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase()
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => (r as { following_id: string }).following_id);
}

// ============================================================================
// Activity feed
// ============================================================================

export interface FeedItem {
  id: string;
  user_id: string;
  species_id: string;
  quantity: number;
  size_mm: number | null;
  lat: number;
  lng: number;
  privacy_level: string;
  location_name: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
}

export async function getFollowingFeed(limit = 40): Promise<FeedItem[]> {
  const { data: auth } = await supabase().auth.getUser();
  if (!auth.user) return [];

  const followingIds = await getFollowingIds(auth.user.id);
  if (followingIds.length === 0) return [];

  const { data, error } = await supabase()
    .from('catches')
    .select(
      'id, user_id, species_id, quantity, size_mm, lat, lng, privacy_level, location_name, created_at, like_count, comment_count',
    )
    .in('user_id', followingIds)
    .eq('is_hidden', false)
    .gt('expires_at', new Date().toISOString())
    .neq('privacy_level', 'hidden')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as FeedItem[];
}

/**
 * Nearby feed: public, non-hidden, non-expired catches within `radiusKm`.
 * Uses simple bbox + Haversine post-filter (no PostGIS dependency).
 */
export async function getNearbyFeed(
  lat: number,
  lng: number,
  radiusKm = 50,
  limit = 40,
): Promise<FeedItem[]> {
  // Bounding box: conservative (~1 degree lat ≈ 111 km)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const { data, error } = await supabase()
    .from('catches')
    .select(
      'id, user_id, species_id, quantity, size_mm, lat, lng, privacy_level, location_name, created_at, like_count, comment_count',
    )
    .gte('lat', lat - latDelta)
    .lte('lat', lat + latDelta)
    .gte('lng', lng - lngDelta)
    .lte('lng', lng + lngDelta)
    .eq('is_hidden', false)
    .gt('expires_at', new Date().toISOString())
    .neq('privacy_level', 'hidden')
    .order('created_at', { ascending: false })
    .limit(limit * 2); // oversample, filter client-side

  if (error) throw error;

  // Refine with Haversine
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const hav = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const dLat = rad(bLat - aLat);
    const dLng = rad(bLng - aLng);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  return ((data ?? []) as FeedItem[])
    .filter((c) => hav(lat, lng, c.lat, c.lng) <= radiusKm)
    .slice(0, limit);
}
