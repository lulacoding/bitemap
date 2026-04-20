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
  type CatchFilters,
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
export {
  useFiltersStore,
  DEFAULT_FILTERS,
  weightForAgeHours,
  weightForCreatedAt,
  type ViewMode,
  type FreshnessHours,
  type MapLayers,
  type FiltersState,
} from './map/filters';
export {
  AU_STATES,
  auStateSchema,
  speciesRegulationSchema,
  getRegulationsForSpecies,
  getRegulationForState,
  formatRegulationRow,
  type AuState,
  type SpeciesRegulation,
} from './regulations/regulations';
export {
  marineParkCategorySchema,
  marineParkSchema,
  listMarineParks,
  parksContainingBbox,
  pointInPolygon,
  parksContainingPoint,
  type MarineParkCategory,
  type MarineParkRow,
  type MarineParkWithGeometry,
} from './regulations/marine-parks';
export {
  POI_CATEGORIES,
  poiCategorySchema,
  poiSchema,
  poiReviewSchema,
  poiStatusSchema,
  poiStatusReportSchema,
  poiSubmissionInputSchema,
  type Poi,
  type PoiCategory,
  type PoiReview,
  type PoiStatus,
  type PoiStatusReport,
  type PoiSubmissionInput,
} from './poi/schemas';
export {
  listPois,
  getPoiById,
  listPoiReviews,
  listActivePoiStatusReports,
  submitPoi,
  postPoiStatus,
  upsertPoiReview,
  deletePoiReview,
  tideBelowRampThreshold,
  type ListPoisFilters,
} from './poi/queries';
export {
  profileSchema,
  profileUpdateSchema,
  getProfileById,
  getProfileByUsername,
  getMyProfile,
  updateMyProfile,
  getLogbook,
  type Profile,
  type ProfileUpdate,
} from './queries/profiles';
export {
  getMyStats,
  getMySpeciesBreakdown,
  getMyMonthlyCounts,
  getTodaysCatchCountsBySpecies,
  type UserStats,
  type SpeciesBreakdown,
  type MonthlyBucket,
} from './queries/stats';
export {
  classifyBagLimit,
  getBagLimitStatusForSpecies,
  type BagLimitTier,
  type BagLimitStatus,
} from './queries/bag-limit';
