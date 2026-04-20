import { z } from 'zod';

export const POI_CATEGORIES = [
  'boat_ramp',
  'bait_shop',
  'fuel',
  'jetty',
  'boat_hire',
  'charter',
] as const;

export const poiCategorySchema = z.enum(POI_CATEGORIES);
export type PoiCategory = z.infer<typeof poiCategorySchema>;

export const poiSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  category: poiCategorySchema,
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  hours: z.string().nullable(),
  website: z.string().nullable(),
  rating_avg: z.number().nullable(),
  rating_count: z.number().int().nonnegative(),
  tide_min_m: z.number().nullable(),
  user_submitted: z.boolean(),
  source: z.string(),
  state: z.string(),
  created_at: z.string(),
  created_by: z.uuid().nullable(),
});

export type Poi = z.infer<typeof poiSchema>;

export const poiReviewSchema = z.object({
  id: z.uuid(),
  poi_id: z.uuid(),
  user_id: z.uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  created_at: z.string(),
});

export type PoiReview = z.infer<typeof poiReviewSchema>;

export const poiStatusSchema = z.enum(['open', 'crowded', 'debris', 'closed']);
export type PoiStatus = z.infer<typeof poiStatusSchema>;

export const poiStatusReportSchema = z.object({
  id: z.uuid(),
  poi_id: z.uuid(),
  user_id: z.uuid(),
  status: poiStatusSchema,
  notes: z.string().nullable(),
  created_at: z.string(),
  expires_at: z.string(),
});

export type PoiStatusReport = z.infer<typeof poiStatusReportSchema>;

// Input shape for community-submitted POIs
export const poiSubmissionInputSchema = z.object({
  name: z.string().min(1).max(120),
  category: poiCategorySchema,
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  address: z.string().max(240).optional(),
  phone: z.string().max(40).optional(),
  hours: z.string().max(120).optional(),
  website: z.string().url().max(240).optional(),
  tide_min_m: z.number().nonnegative().max(10).optional(),
});

export type PoiSubmissionInput = z.infer<typeof poiSubmissionInputSchema>;
