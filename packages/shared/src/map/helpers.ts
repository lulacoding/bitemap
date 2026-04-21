export type CatchCategory = 'saltwater' | 'freshwater' | 'estuarine' | 'pelagic' | 'other';

/** Minimal pin shape for map rendering (derived from real `Catch` rows in UI). */
export interface MapCatchPin {
  id: string;
  lat: number;
  lng: number;
  species: string;
  category: CatchCategory;
  ageHours: number;
}

/**
 * Linearly fade pin opacity from 1.0 (fresh) to 0.3 (48h+ old).
 * Clamped so older-than-48h stays at 0.3.
 */
export const alphaForAgeHours = (h: number): number => {
  const clamped = Math.max(0, Math.min(48, h));
  return 1.0 - (clamped / 48) * 0.7;
};

const PIN_COLORS: Record<CatchCategory, string> = {
  saltwater: '#2B5D9B',
  freshwater: '#2BB7A8',
  estuarine: '#7A5FD1',
  pelagic: '#E4572E',
  other: '#6B7280',
};

export const pinColorForCategory = (category: CatchCategory): string =>
  PIN_COLORS[category];

export type ColorScheme = 'light' | 'dark' | null | undefined;

export const mapboxStyleForTheme = (scheme: ColorScheme | boolean): string => {
  const isDark = scheme === 'dark' || scheme === true;
  return isDark
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';
};

export const PORT_PHILLIP_BAY_CENTER: [number, number] = [144.85, -38.1];
