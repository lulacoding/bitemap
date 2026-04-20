import { z } from 'zod';

export const speciesCategorySchema = z.enum(['saltwater', 'freshwater', 'estuarine', 'pelagic', 'other']);

export const speciesSchema = z.object({
  id: z.string().uuid(),
  common_name: z.string().min(1),
  scientific_name: z.string().nullable(),
  category: speciesCategorySchema,
  min_legal_size_mm: z.number().int().nonnegative().nullable(),
  bag_limit: z.number().int().nonnegative().nullable(),
  closed_season_start: z.string().nullable(),
  closed_season_end: z.string().nullable(),
  state: z.string().nullable(),
  image_url: z.string().nullable(),
  description: z.string().nullable(),
});

export type Species = z.infer<typeof speciesSchema>;
