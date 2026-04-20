export const APP_NAME = 'BiteMap' as const;

export type { Database } from './types/database';
export { supabase, resetSupabaseClient } from './supabase/browser';
export { speciesSchema, speciesCategorySchema, type Species } from './schemas/species';
export { listSpecies, searchSpecies, getSpeciesById } from './queries/species';
export {
  mockCatches,
  alphaForAgeHours,
  pinColorForCategory,
  mapboxStyleForTheme,
  PORT_PHILLIP_BAY_CENTER,
  type MockCatch,
  type CatchCategory,
  type ColorScheme,
} from './map/helpers';
