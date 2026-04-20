export type CatchCategory = 'saltwater' | 'freshwater' | 'estuarine' | 'pelagic' | 'other';

export interface MockCatch {
  id: string;
  lat: number;
  lng: number;
  species: string;
  category: CatchCategory;
  ageHours: number;
}

export const mockCatches: MockCatch[] = [
  { id: 'm1', lat: -38.083, lng: 144.875, species: 'Snapper', category: 'saltwater', ageHours: 2 },
  { id: 'm2', lat: -38.132, lng: 144.655, species: 'King George Whiting', category: 'saltwater', ageHours: 12 },
  { id: 'm3', lat: -38.21, lng: 144.71, species: 'Flathead', category: 'estuarine', ageHours: 28 },
  { id: 'm4', lat: -37.895, lng: 144.79, species: 'Australian Salmon', category: 'pelagic', ageHours: 6 },
  { id: 'm5', lat: -38.045, lng: 144.82, species: 'Bream', category: 'estuarine', ageHours: 44 },
];

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
