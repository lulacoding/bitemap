import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchMarine,
  fetchTide,
  findExtremes,
  tideStateFromPoints,
  currentWave,
  type TidePoint,
} from './tide';

const MARINE_MOCK = {
  hourly: {
    time: [
      '2026-04-20T00:00',
      '2026-04-20T01:00',
      '2026-04-20T02:00',
      '2026-04-20T03:00',
      '2026-04-20T04:00',
      '2026-04-20T05:00',
      '2026-04-20T06:00',
      '2026-04-20T07:00',
    ],
    sea_level_height_msl: [-0.21, -0.03, 0.11, 0.22, 0.28, 0.29, 0.24, 0.15],
    wave_height: [0.5, 0.6, 0.7, 0.7, 0.6, 0.5, 0.4, 0.4],
    wave_period: [4.5, 4.6, 4.7, 4.8, 4.7, 4.5, 4.3, 4.2],
    wave_direction: [180, 185, 190, 195, 195, 190, 185, 180],
  },
};

const mockMarine200 = () =>
  new Response(JSON.stringify(MARINE_MOCK), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('fetchMarine (Open-Meteo Marine)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockMarine200());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('hits Open-Meteo Marine with tide + wave hourly params', async () => {
    await fetchMarine(-38.1, 144.85, 7);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('marine-api.open-meteo.com');
    expect(url).toContain('latitude=-38.1');
    expect(url).toContain('longitude=144.85');
    expect(url).toContain('forecast_days=7');
    expect(url).toContain('sea_level_height_msl');
    expect(url).toContain('wave_height');
    expect(url).toContain('wave_period');
    expect(url).toContain('wave_direction');
  });

  it('returns tide + waves arrays', async () => {
    const r = await fetchMarine(-38.1, 144.85);
    expect(r.tide.length).toBe(8);
    expect(r.waves.length).toBe(8);
    expect(r.tide[0]).toMatchObject({ time: '2026-04-20T00:00', height_m: -0.21 });
    expect(r.waves[0]).toMatchObject({
      height_m: 0.5,
      period_s: 4.5,
      direction_deg: 180,
    });
  });

  it('fetchTide returns only tide points (back-compat)', async () => {
    const pts = await fetchTide(-38.1, 144.85);
    expect(pts).toHaveLength(8);
    expect(pts[0]?.height_m).toBe(-0.21);
  });

  it('throws on non-200', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('oops', { status: 500, statusText: 'err' }),
    );
    await expect(fetchMarine(-38.1, 144.85)).rejects.toThrow(/500/);
  });
});

describe('findExtremes', () => {
  it('finds the peak at 0.29m in the mock response', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(mockMarine200());
    const pts = await fetchTide(-38.1, 144.85);
    const ex = findExtremes(pts);
    expect(ex.length).toBeGreaterThan(0);
    expect(ex.find((e) => e.type === 'high' && e.height_m === 0.29)).toBeDefined();
    fetchSpy.mockRestore();
  });

  it('empty points returns empty extremes', () => {
    expect(findExtremes([])).toEqual([]);
  });
});

describe('tideStateFromPoints', () => {
  const mkPts = (heights: number[]): TidePoint[] =>
    heights.map((h, i) => ({
      time: `t${i}`,
      t: 1000 + i * 1000,
      height_m: h,
    }));

  it('detects rising tide', () => {
    const pts = mkPts([0.1, 0.2, 0.3]);
    expect(tideStateFromPoints(pts, new Date(1500 * 1000))).toBe('incoming');
  });

  it('detects falling tide', () => {
    const pts = mkPts([0.3, 0.2, 0.1]);
    expect(tideStateFromPoints(pts, new Date(1500 * 1000))).toBe('outgoing');
  });

  it('detects slack', () => {
    const pts = mkPts([0.2, 0.2]);
    expect(tideStateFromPoints(pts, new Date(1500 * 1000))).toBe('slack');
  });
});

describe('currentWave', () => {
  it('returns null for empty array', () => {
    expect(currentWave([])).toBe(null);
  });

  it('returns the point closest to now', () => {
    const waves = [
      { time: 't1', t: 1000, height_m: 0.5, period_s: 4, direction_deg: 180 },
      { time: 't2', t: 2000, height_m: 0.6, period_s: 5, direction_deg: 190 },
      { time: 't3', t: 3000, height_m: 0.7, period_s: 6, direction_deg: 200 },
    ];
    const w = currentWave(waves, new Date(2100 * 1000));
    expect(w?.height_m).toBe(0.6);
  });
});
