/**
 * Marine data — real, via Open-Meteo Marine API.
 *
 * API docs: https://open-meteo.com/en/docs/marine-weather-api
 * - Free, no API key required
 * - CORS enabled — callable directly from mobile + web clients
 * - Returns hourly sea_level_height_msl + wave_height + wave_period + wave_direction
 * - Global coverage including Port Phillip Bay
 */

const MARINE_API = 'https://marine-api.open-meteo.com/v1/marine';

export interface TidePoint {
  /** ISO timestamp from API */
  time: string;
  /** Unix timestamp in seconds (derived) */
  t: number;
  /** Sea level height in metres relative to MSL */
  height_m: number;
}

export interface TideExtreme extends TidePoint {
  type: 'high' | 'low';
}

export interface WavePoint {
  time: string;
  t: number;
  /** Significant wave height in metres */
  height_m: number;
  /** Dominant wave period in seconds */
  period_s: number;
  /** Direction waves are coming from, degrees */
  direction_deg: number;
}

export interface MarineForecast {
  tide: TidePoint[];
  waves: WavePoint[];
}

interface MarineApiResponse {
  hourly?: {
    time?: string[];
    sea_level_height_msl?: (number | null)[];
    wave_height?: (number | null)[];
    wave_period?: (number | null)[];
    wave_direction?: (number | null)[];
  };
}

function toUnixSeconds(isoLocal: string): number {
  return Math.floor(new Date(`${isoLocal}Z`).getTime() / 1000);
}

/**
 * Fetch hourly sea-level + wave data for a location across `days` days forward.
 */
export async function fetchMarine(
  lat: number,
  lng: number,
  days = 7,
): Promise<MarineForecast> {
  const hourly =
    'sea_level_height_msl,wave_height,wave_period,wave_direction';
  const url = `${MARINE_API}?latitude=${lat}&longitude=${lng}&hourly=${hourly}&forecast_days=${days}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo Marine API: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as MarineApiResponse;
  const times = json.hourly?.time ?? [];
  const heights = json.hourly?.sea_level_height_msl ?? [];
  const waveHeights = json.hourly?.wave_height ?? [];
  const wavePeriods = json.hourly?.wave_period ?? [];
  const waveDirs = json.hourly?.wave_direction ?? [];

  const tide: TidePoint[] = [];
  const waves: WavePoint[] = [];

  for (let i = 0; i < times.length; i++) {
    const iso = times[i];
    if (!iso) continue;
    const t = toUnixSeconds(iso);

    const h = heights[i];
    if (h != null) tide.push({ time: iso, t, height_m: h });

    const wh = waveHeights[i];
    const wp = wavePeriods[i];
    const wd = waveDirs[i];
    if (wh != null && wp != null && wd != null) {
      waves.push({
        time: iso,
        t,
        height_m: wh,
        period_s: wp,
        direction_deg: wd,
      });
    }
  }

  return { tide, waves };
}

/**
 * Backwards-compat helper — returns only the tide portion of the forecast.
 */
export async function fetchTide(
  lat: number,
  lng: number,
  days = 7,
): Promise<TidePoint[]> {
  const forecast = await fetchMarine(lat, lng, days);
  return forecast.tide;
}

/**
 * Find local extrema (highs + lows) in a time-series of tide points.
 */
export function findExtremes(points: TidePoint[]): TideExtreme[] {
  const extremes: TideExtreme[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    if (!prev || !curr || !next) continue;

    if (curr.height_m > prev.height_m && curr.height_m > next.height_m) {
      extremes.push({
        time: curr.time,
        t: curr.t,
        height_m: curr.height_m,
        type: 'high',
      });
    } else if (curr.height_m < prev.height_m && curr.height_m < next.height_m) {
      extremes.push({
        time: curr.time,
        t: curr.t,
        height_m: curr.height_m,
        type: 'low',
      });
    }
  }
  return extremes;
}

/**
 * Current tide state (rising / falling / slack) from a time-series.
 */
export function tideStateFromPoints(
  points: TidePoint[],
  now: Date = new Date(),
): 'incoming' | 'outgoing' | 'slack' {
  if (points.length < 2) return 'slack';
  const nowSec = Math.floor(now.getTime() / 1000);

  let idx = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a && b && a.t <= nowSec && b.t > nowSec) {
      idx = i;
      break;
    }
  }

  const curr = points[idx];
  const next = points[idx + 1];
  if (!curr || !next) return 'slack';

  const delta = next.height_m - curr.height_m;
  if (Math.abs(delta) < 0.02) return 'slack';
  return delta > 0 ? 'incoming' : 'outgoing';
}

/**
 * Current wave conditions from a forecast — nearest forecast point to `now`.
 */
export function currentWave(
  waves: WavePoint[],
  now: Date = new Date(),
): WavePoint | null {
  if (waves.length === 0) return null;
  const nowSec = Math.floor(now.getTime() / 1000);
  let best = waves[0] ?? null;
  let bestDelta = best ? Math.abs(best.t - nowSec) : Infinity;
  for (const w of waves) {
    const d = Math.abs(w.t - nowSec);
    if (d < bestDelta) {
      best = w;
      bestDelta = d;
    }
  }
  return best;
}
