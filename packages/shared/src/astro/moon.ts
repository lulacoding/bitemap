/**
 * Moon-phase + solunar math (fully offline, no external APIs).
 *
 * Reference: Conway's moon-age approximation + 8-bucket phase naming.
 * Accurate to ±1 day for the given date range (1900–2100).
 */

const LUNAR_PERIOD_SECONDS = 2_551_443; // mean synodic month (29.53 days)
const REFERENCE_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14) / 1000; // 2000-01-06 18:14 UTC

export type MoonPhaseName =
  | 'new'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export const MOON_PHASES: MoonPhaseName[] = [
  'new',
  'waxing_crescent',
  'first_quarter',
  'waxing_gibbous',
  'full',
  'waning_gibbous',
  'last_quarter',
  'waning_crescent',
];

/**
 * Fractional age of the moon within the synodic month (0..1).
 * 0 = new moon, 0.5 = full moon.
 */
export function moonAgeFraction(d: Date): number {
  const s = Math.floor(d.getTime() / 1000);
  const delta = s - REFERENCE_NEW_MOON_UTC;
  const age = ((delta % LUNAR_PERIOD_SECONDS) + LUNAR_PERIOD_SECONDS) % LUNAR_PERIOD_SECONDS;
  return age / LUNAR_PERIOD_SECONDS;
}

/**
 * Fractional illumination (0 = new moon, 1 = full moon).
 */
export function moonIllumination(d: Date): number {
  const frac = moonAgeFraction(d);
  return (1 - Math.cos(frac * 2 * Math.PI)) / 2;
}

/**
 * One of 8 named moon phases. Bucketed by fractional age (1/8 = 3.69 days wide).
 */
export function moonPhase(d: Date): MoonPhaseName {
  const frac = moonAgeFraction(d);
  const bucket = Math.floor(((frac + 1 / 16) % 1) * 8);
  return MOON_PHASES[bucket] ?? 'new';
}

/**
 * Solunar rating 0..4 — higher means better fishing activity.
 *
 * Heuristic (no external sun/moon-rise APIs yet):
 * - Base rating 2.
 * - +1 if within 2 days of new or full moon (major gravitational pull).
 * - +1 if "near" major peaks: dawn (hour 4-7 local) or dusk (17-20 local).
 *
 * This is a reasonable stand-in until the enrichment Edge Function lands
 * real sunrise/sunset + moonrise/moonset solunar tables.
 */
export function solunarRating(d: Date, _lat: number, _lng: number): number {
  const phase = moonPhase(d);
  const hour = d.getHours();

  let score = 2;

  if (phase === 'new' || phase === 'full') {
    score += 1;
  }

  const isDawn = hour >= 4 && hour <= 7;
  const isDusk = hour >= 17 && hour <= 20;
  if (isDawn || isDusk) {
    score += 1;
  }

  return Math.max(0, Math.min(4, score));
}
