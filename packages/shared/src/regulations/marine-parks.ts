import { z } from 'zod';
import { supabase } from '../supabase/browser';

export const marineParkCategorySchema = z.enum(['MNP', 'MS', 'MP', 'AZ']);
export type MarineParkCategory = z.infer<typeof marineParkCategorySchema>;

export const marineParkSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  category: marineParkCategorySchema,
  state: z.string(),
  bbox_min_lng: z.number(),
  bbox_min_lat: z.number(),
  bbox_max_lng: z.number(),
  bbox_max_lat: z.number(),
  polygon_geojson: z.string(),
  notes: z.string().nullable(),
  source_url: z.string().nullable(),
  created_at: z.string().nullable(),
});

export type MarineParkRow = z.infer<typeof marineParkSchema>;

export interface MarineParkWithGeometry extends MarineParkRow {
  /** Parsed GeoJSON Polygon coordinates: [[[lng, lat], ...]] */
  geometry: number[][][];
}

export async function listMarineParks(
  state = 'VIC',
): Promise<MarineParkWithGeometry[]> {
  const { data, error } = await supabase()
    .from('marine_parks')
    .select('*')
    .eq('state', state);

  if (error) throw error;

  return (data ?? []).map((raw) => {
    const row = marineParkSchema.parse(raw);
    let geometry: number[][][];
    try {
      const parsed = JSON.parse(row.polygon_geojson) as {
        type?: string;
        coordinates?: number[][][];
      };
      geometry = parsed.coordinates ?? [];
    } catch {
      geometry = [];
    }
    return { ...row, geometry };
  });
}

/**
 * Fast bbox test — returns parks whose bounding box contains (lat, lng).
 * Used for catch-report warning before doing full polygon check.
 */
export function parksContainingBbox(
  parks: MarineParkWithGeometry[],
  lat: number,
  lng: number,
): MarineParkWithGeometry[] {
  return parks.filter(
    (p) =>
      lng >= p.bbox_min_lng &&
      lng <= p.bbox_max_lng &&
      lat >= p.bbox_min_lat &&
      lat <= p.bbox_max_lat,
  );
}

/**
 * Ray-casting point-in-polygon. Operates on first ring only (outer ring).
 */
export function pointInPolygon(
  lat: number,
  lng: number,
  polygon: number[][][],
): boolean {
  const ring = polygon[0];
  if (!ring || ring.length < 3) return false;

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const pi = ring[i];
    const pj = ring[j];
    if (!pi || !pj) continue;
    const [xi, yi] = [pi[0] ?? 0, pi[1] ?? 0];
    const [xj, yj] = [pj[0] ?? 0, pj[1] ?? 0];

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Returns parks whose polygon contains the point (strict check).
 */
export function parksContainingPoint(
  parks: MarineParkWithGeometry[],
  lat: number,
  lng: number,
): MarineParkWithGeometry[] {
  const bboxHits = parksContainingBbox(parks, lat, lng);
  return bboxHits.filter((p) => pointInPolygon(lat, lng, p.geometry));
}
