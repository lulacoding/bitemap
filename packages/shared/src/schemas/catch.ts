import { z } from 'zod';

export const privacyLevelSchema = z.enum(['exact', 'area', 'hidden']);
export type PrivacyLevel = z.infer<typeof privacyLevelSchema>;

export const catchInputSchema = z.object({
  species_id: z.uuid(),
  quantity: z.number().int().positive().default(1),
  size_mm: z.number().int().nonnegative().optional(),
  bait_used: z.string().max(80).optional(),
  technique: z.string().max(40).optional(),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  privacy_level: privacyLevelSchema,
  photo_url: z.url().optional(),
  location_name: z.string().max(120).optional(),
});

export type CatchInput = z.infer<typeof catchInputSchema>;

export const catchSchema = catchInputSchema.extend({
  id: z.uuid(),
  user_id: z.uuid(),
  is_hidden: z.boolean(),
  like_count: z.number().int().nonnegative(),
  comment_count: z.number().int().nonnegative(),
  flag_count: z.number().int().nonnegative(),
  created_at: z.string(),
  expires_at: z.string(),
});

export type Catch = z.infer<typeof catchSchema>;
