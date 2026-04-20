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
export {
  applyPrivacy,
  type PrivacyLevel,
  type Coord,
  type PrivacyResult,
} from './geo/privacy';
export {
  catchInputSchema,
  catchSchema,
  privacyLevelSchema,
  type CatchInput,
  type Catch,
} from './schemas/catch';
export {
  listCatches,
  getCatchById,
  createCatch,
} from './queries/catches';
export {
  moonPhase,
  moonIllumination,
  moonAgeFraction,
  solunarRating,
  MOON_PHASES,
  type MoonPhaseName,
} from './astro/moon';
export {
  fetchMarine,
  fetchTide,
  findExtremes,
  tideStateFromPoints,
  currentWave,
  type TidePoint,
  type TideExtreme,
  type WavePoint,
  type MarineForecast,
} from './astro/tide';
export {
  fetchCurrentWeather,
  fetchPressureHistory,
  analysePressureTrend,
  windDirectionName,
  type WeatherSnapshot,
  type PressurePoint,
  type PressureTrend,
  type PressureTrendAnalysis,
} from './astro/weather';
export {
  feedTimesFor,
  activeFeedTime,
  type FeedTime,
} from './astro/solunar';
