/**
 * Weather data — real, via Open-Meteo Forecast API.
 *
 * API docs: https://open-meteo.com/en/docs
 * - Free, no API key required
 * - CORS enabled — callable directly from mobile + web clients
 * - Global coverage including Port Phillip Bay
 */

const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherSnapshot {
  time: string;
  temp_c: number;
  wind_kmh: number;
  wind_dir_deg: number;
  pressure_hpa: number;
  humidity_pct: number;
  cloud_pct: number;
  precipitation_mm: number;
}

export interface PressurePoint {
  time: string;
  t: number;
  pressure_hpa: number;
}

export type PressureTrend = 'rising' | 'falling' | 'stable';

export interface PressureTrendAnalysis {
  trend: PressureTrend;
  /** hPa change over the window */
  delta_hpa: number;
  /** Hours of data analysed */
  window_hours: number;
  /** Latest pressure reading */
  current_hpa: number;
}

interface ForecastApiResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    pressure_msl?: number;
    relative_humidity_2m?: number;
    cloud_cover?: number;
    precipitation?: number;
  };
  hourly?: {
    time?: string[];
    pressure_msl?: (number | null)[];
  };
}

/**
 * Current weather at a location.
 */
export async function fetchCurrentWeather(
  lat: number,
  lng: number,
): Promise<WeatherSnapshot> {
  const params =
    'current=temperature_2m,wind_speed_10m,wind_direction_10m,pressure_msl,relative_humidity_2m,cloud_cover,precipitation' +
    '&wind_speed_unit=kmh';
  const url = `${FORECAST_API}?latitude=${lat}&longitude=${lng}&${params}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo Forecast API: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as ForecastApiResponse;
  const c = json.current;
  if (!c) throw new Error('Open-Meteo Forecast: missing `current` block');

  return {
    time: c.time ?? new Date().toISOString(),
    temp_c: c.temperature_2m ?? 0,
    wind_kmh: c.wind_speed_10m ?? 0,
    wind_dir_deg: c.wind_direction_10m ?? 0,
    pressure_hpa: c.pressure_msl ?? 0,
    humidity_pct: c.relative_humidity_2m ?? 0,
    cloud_pct: c.cloud_cover ?? 0,
    precipitation_mm: c.precipitation ?? 0,
  };
}

/**
 * Hourly pressure readings over the last `pastHours` hours + next 24h forward.
 */
export async function fetchPressureHistory(
  lat: number,
  lng: number,
  pastHours = 12,
): Promise<PressurePoint[]> {
  const pastDays = Math.max(1, Math.ceil(pastHours / 24));
  const url =
    `${FORECAST_API}?latitude=${lat}&longitude=${lng}` +
    `&hourly=pressure_msl&past_days=${pastDays}&forecast_days=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo Forecast API: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as ForecastApiResponse;
  const times = json.hourly?.time ?? [];
  const readings = json.hourly?.pressure_msl ?? [];

  const out: PressurePoint[] = [];
  for (let i = 0; i < times.length; i++) {
    const iso = times[i];
    const p = readings[i];
    if (!iso || p == null) continue;
    out.push({
      time: iso,
      t: Math.floor(new Date(`${iso}Z`).getTime() / 1000),
      pressure_hpa: p,
    });
  }
  return out;
}

/**
 * Classify pressure trend over the last `windowHours` leading up to `now`.
 *
 * Thresholds:
 * - `delta >= +1.0 hPa` over the window → rising
 * - `delta <= -1.0 hPa` → falling
 * - else → stable
 *
 * Why 1 hPa? Anglers look for ~0.5 hPa/hour moves; 1 hPa over 6h is a meaningful shift.
 */
export function analysePressureTrend(
  points: PressurePoint[],
  now: Date = new Date(),
  windowHours = 6,
): PressureTrendAnalysis | null {
  if (points.length === 0) return null;
  const nowSec = Math.floor(now.getTime() / 1000);
  const windowStart = nowSec - windowHours * 3600;

  let earliest: PressurePoint | null = null;
  let latest: PressurePoint | null = null;
  for (const p of points) {
    if (p.t > nowSec) continue;
    if (p.t < windowStart) continue;
    if (!earliest || p.t < earliest.t) earliest = p;
    if (!latest || p.t > latest.t) latest = p;
  }
  if (!earliest || !latest) return null;

  const delta = latest.pressure_hpa - earliest.pressure_hpa;
  let trend: PressureTrend;
  if (delta >= 1.0) trend = 'rising';
  else if (delta <= -1.0) trend = 'falling';
  else trend = 'stable';

  return {
    trend,
    delta_hpa: delta,
    window_hours: windowHours,
    current_hpa: latest.pressure_hpa,
  };
}

/**
 * Cardinal-point name for a wind or wave direction in degrees.
 */
export function windDirectionName(deg: number): string {
  const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return names[idx] ?? 'N';
}
