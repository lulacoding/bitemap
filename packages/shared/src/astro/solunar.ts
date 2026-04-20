/**
 * Solunar minor/major feed-times (approximation).
 *
 * Strict solunar theory defines two major peaks (moon overhead + moon underfoot)
 * and two minor peaks (moonrise + moonset) per lunar day. Computing moonrise
 * and moonset accurately requires a full lunar ephemeris library.
 *
 * Until we add such a library (e.g. `suncalc` — browser/node only, no RN build),
 * this module approximates feed-times from solar events as a reasonable heuristic:
 * - Major periods ≈ sunrise ± 1h, sunset ± 1h
 * - Minor periods ≈ solar noon ± 30m, solar midnight ± 30m
 *
 * Anglers use these as "best-chance" windows; our approximation is directionally
 * correct for most latitudes within ±30° of the equator, which covers Port
 * Phillip Bay (-38° lat, borderline but still useful).
 *
 * Replace with a real ephemeris (suncalc-based Edge Function) in Phase 11 if
 * real-data mandate extends here.
 */

export interface FeedTime {
  /** Epoch seconds */
  start: number;
  end: number;
  type: 'major' | 'minor';
  label: string;
}

/**
 * Compute solar noon for a given date + longitude (UTC).
 * Uses NOAA's approximation.
 */
function solarNoonUtcSec(date: Date, lng: number): number {
  const dayStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const lngOffsetMinutes = (lng / 15) * 60;
  return Math.floor(dayStart.getTime() / 1000 + (12 * 60 - lngOffsetMinutes) * 60);
}

/**
 * Compute sunrise + sunset epoch seconds for a given day + location.
 * Based on NOAA's simplified sunrise equation.
 */
function sunEvents(
  date: Date,
  lat: number,
  lng: number,
): { sunrise: number; sunset: number; noon: number } {
  const noon = solarNoonUtcSec(date, lng);

  // Day of year
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (date.getTime() - start) / 86_400_000,
  );

  // Solar declination (radians)
  const decl =
    0.409 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365);

  const latRad = (lat * Math.PI) / 180;

  // Hour angle for sunrise/sunset (zenith = 90.833° for refraction)
  const cosH =
    (Math.cos((90.833 * Math.PI) / 180) -
      Math.sin(latRad) * Math.sin(decl)) /
    (Math.cos(latRad) * Math.cos(decl));

  // Polar day/night safety
  if (cosH > 1) {
    // Sun never rises — return noon as both events (degenerate)
    return { sunrise: noon, sunset: noon, noon };
  }
  if (cosH < -1) {
    // Sun never sets
    return { sunrise: noon - 6 * 3600, sunset: noon + 6 * 3600, noon };
  }

  const H = Math.acos(cosH); // radians
  const halfDayHours = (H * 180) / Math.PI / 15;

  return {
    sunrise: Math.floor(noon - halfDayHours * 3600),
    sunset: Math.floor(noon + halfDayHours * 3600),
    noon,
  };
}

/**
 * Compute today's solunar feed-times around `date`.
 */
export function feedTimesFor(
  date: Date,
  lat: number,
  lng: number,
): FeedTime[] {
  const { sunrise, sunset, noon } = sunEvents(date, lat, lng);
  const midnight = noon - 12 * 3600;

  return [
    {
      type: 'major',
      label: 'Dawn major',
      start: sunrise - 3600,
      end: sunrise + 3600,
    },
    {
      type: 'minor',
      label: 'Midday minor',
      start: noon - 30 * 60,
      end: noon + 30 * 60,
    },
    {
      type: 'major',
      label: 'Dusk major',
      start: sunset - 3600,
      end: sunset + 3600,
    },
    {
      type: 'minor',
      label: 'Midnight minor',
      start: midnight - 30 * 60,
      end: midnight + 30 * 60,
    },
  ];
}

/**
 * Which feed period (if any) is currently active at `now`?
 */
export function activeFeedTime(
  times: FeedTime[],
  now: Date = new Date(),
): FeedTime | null {
  const s = Math.floor(now.getTime() / 1000);
  return times.find((t) => t.start <= s && s <= t.end) ?? null;
}
