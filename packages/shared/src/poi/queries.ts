import { supabase } from '../supabase/browser';
import {
  poiSchema,
  poiReviewSchema,
  poiStatusReportSchema,
  type Poi,
  type PoiCategory,
  type PoiReview,
  type PoiStatusReport,
  type PoiStatus,
  type PoiSubmissionInput,
} from './schemas';

export interface ListPoisFilters {
  category?: PoiCategory | PoiCategory[];
  state?: string;
  bbox?: {
    min_lat: number;
    min_lng: number;
    max_lat: number;
    max_lng: number;
  };
  limit?: number;
}

/**
 * List POIs, optionally scoped by category, state, or geographic bbox.
 */
export async function listPois(filters: ListPoisFilters = {}): Promise<Poi[]> {
  let q = supabase().from('pois').select('*');

  if (filters.category) {
    const categories = Array.isArray(filters.category)
      ? filters.category
      : [filters.category];
    q = q.in('category', categories);
  }
  if (filters.state) {
    q = q.eq('state', filters.state);
  }
  if (filters.bbox) {
    q = q
      .gte('lat', filters.bbox.min_lat)
      .lte('lat', filters.bbox.max_lat)
      .gte('lng', filters.bbox.min_lng)
      .lte('lng', filters.bbox.max_lng);
  }

  const { data, error } = await q.limit(filters.limit ?? 500);
  if (error) throw error;
  return (data ?? []).map((d) => poiSchema.parse(d));
}

/**
 * Get a single POI by ID.
 */
export async function getPoiById(id: string): Promise<Poi | null> {
  const { data, error } = await supabase()
    .from('pois')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? poiSchema.parse(data) : null;
}

/**
 * Recent reviews for a POI (up to `limit`).
 */
export async function listPoiReviews(
  poiId: string,
  limit = 10,
): Promise<PoiReview[]> {
  const { data, error } = await supabase()
    .from('poi_reviews')
    .select('*')
    .eq('poi_id', poiId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((d) => poiReviewSchema.parse(d));
}

/**
 * Active (non-expired) status reports for a POI.
 */
export async function listActivePoiStatusReports(
  poiId: string,
): Promise<PoiStatusReport[]> {
  const { data, error } = await supabase()
    .from('poi_status_reports')
    .select('*')
    .eq('poi_id', poiId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((d) => poiStatusReportSchema.parse(d));
}

/**
 * Submit a new community POI. `user_submitted` is forced true; `created_by`
 * resolves to the signed-in user.
 */
export async function submitPoi(input: PoiSubmissionInput): Promise<Poi> {
  const { data: user } = await supabase().auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const row = {
    name: input.name,
    category: input.category,
    lat: input.lat,
    lng: input.lng,
    address: input.address ?? null,
    phone: input.phone ?? null,
    hours: input.hours ?? null,
    website: input.website ?? null,
    tide_min_m: input.tide_min_m ?? null,
    user_submitted: true,
    source: 'community_submission',
    state: 'VIC',
    created_by: user.user.id,
  };

  const { data, error } = await supabase()
    .from('pois')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return poiSchema.parse(data);
}

/**
 * Post a 6h community status pulse for a POI.
 */
export async function postPoiStatus(
  poiId: string,
  status: PoiStatus,
  notes?: string,
): Promise<PoiStatusReport> {
  const { data: user } = await supabase().auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase()
    .from('poi_status_reports')
    .insert({
      poi_id: poiId,
      user_id: user.user.id,
      status,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return poiStatusReportSchema.parse(data);
}

/**
 * Create or update the signed-in user's review of a POI.
 * Uses `upsert` on the (poi_id, user_id) unique constraint.
 */
export async function upsertPoiReview(
  poiId: string,
  rating: number,
  comment?: string,
): Promise<PoiReview> {
  const { data: user } = await supabase().auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase()
    .from('poi_reviews')
    .upsert(
      {
        poi_id: poiId,
        user_id: user.user.id,
        rating,
        comment: comment ?? null,
      },
      { onConflict: 'poi_id,user_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return poiReviewSchema.parse(data);
}

/**
 * Delete the signed-in user's review of a POI.
 */
export async function deletePoiReview(poiId: string): Promise<void> {
  const { data: user } = await supabase().auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await supabase()
    .from('poi_reviews')
    .delete()
    .match({ poi_id: poiId, user_id: user.user.id });

  if (error) throw error;
}

/**
 * Pure helper: is the current tide below a ramp's min safe height?
 */
export function tideBelowRampThreshold(
  poi: Poi,
  currentTideMetres: number,
): boolean {
  if (poi.tide_min_m == null) return false;
  return currentTideMetres < poi.tide_min_m;
}
