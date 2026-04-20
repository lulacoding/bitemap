export type PrivacyLevel = 'exact' | 'area' | 'hidden';

export interface Coord {
  lat: number;
  lng: number;
}

export interface PrivacyResult extends Coord {
  is_hidden: boolean;
}

const GRID_KM = 1;
const LAT_PER_KM = 1 / 111;
const lngPerKm = (lat: number) => 1 / (111 * Math.cos((lat * Math.PI) / 180));

/**
 * Apply privacy snap to coordinates.
 * - `exact`: unchanged
 * - `area`: snapped to ~1km grid (Port Phillip Bay latitude)
 * - `hidden`: unchanged coords but marks `is_hidden: true` (server should skip public feed)
 *
 * MUST be applied server-side as well to prevent a malicious client from
 * sending privacy_level='area' with raw GPS.
 */
export function applyPrivacy(level: PrivacyLevel, c: Coord): PrivacyResult {
  if (level === 'exact') return { ...c, is_hidden: false };
  if (level === 'hidden') return { ...c, is_hidden: true };

  const lStep = LAT_PER_KM * GRID_KM;
  const gStep = lngPerKm(c.lat) * GRID_KM;
  return {
    lat: Math.round(c.lat / lStep) * lStep,
    lng: Math.round(c.lng / gStep) * gStep,
    is_hidden: false,
  };
}
