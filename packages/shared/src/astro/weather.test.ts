import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchCurrentWeather,
  fetchPressureHistory,
  analysePressureTrend,
  windDirectionName,
  type PressurePoint,
} from './weather';

const CURRENT_MOCK = {
  current: {
    time: '2026-04-20T14:00',
    temperature_2m: 16.8,
    wind_speed_10m: 8.1,
    wind_direction_10m: 122,
    pressure_msl: 1025.7,
    relative_humidity_2m: 80,
    cloud_cover: 34,
    precipitation: 0,
  },
};

const HOURLY_MOCK = {
  hourly: {
    time: [
      '2026-04-19T08:00',
      '2026-04-19T10:00',
      '2026-04-19T12:00',
      '2026-04-19T14:00',
      '2026-04-19T16:00',
    ],
    pressure_msl: [1020.0, 1021.5, 1023.0, 1024.5, 1025.7],
  },
};

describe('fetchCurrentWeather', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(CURRENT_MOCK), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('hits Open-Meteo Forecast with expected params', async () => {
    await fetchCurrentWeather(-38.1, 144.85);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('api.open-meteo.com/v1/forecast');
    expect(url).toContain('latitude=-38.1');
    expect(url).toContain('longitude=144.85');
    expect(url).toContain('wind_speed_unit=kmh');
    expect(url).toContain('current=');
  });

  it('returns normalized WeatherSnapshot', async () => {
    const w = await fetchCurrentWeather(-38.1, 144.85);
    expect(w).toEqual({
      time: '2026-04-20T14:00',
      temp_c: 16.8,
      wind_kmh: 8.1,
      wind_dir_deg: 122,
      pressure_hpa: 1025.7,
      humidity_pct: 80,
      cloud_pct: 34,
      precipitation_mm: 0,
    });
  });

  it('throws on non-200 response', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('nope', { status: 500, statusText: 'oops' }),
    );
    await expect(fetchCurrentWeather(-38.1, 144.85)).rejects.toThrow(/500/);
  });
});

describe('fetchPressureHistory', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(HOURLY_MOCK), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('requests pressure_msl hourly with past_days', async () => {
    await fetchPressureHistory(-38.1, 144.85, 12);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('hourly=pressure_msl');
    expect(url).toContain('past_days=');
  });

  it('returns parsed PressurePoints', async () => {
    const pts = await fetchPressureHistory(-38.1, 144.85);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toMatchObject({
      time: '2026-04-19T08:00',
      pressure_hpa: 1020.0,
    });
  });
});

describe('analysePressureTrend', () => {
  const baseSec = Math.floor(new Date('2026-04-20T14:00:00Z').getTime() / 1000);
  const mkPt = (hoursBack: number, hpa: number): PressurePoint => ({
    time: `t-${hoursBack}`,
    t: baseSec - hoursBack * 3600,
    pressure_hpa: hpa,
  });

  it('returns null when no points', () => {
    expect(analysePressureTrend([], new Date(baseSec * 1000))).toBe(null);
  });

  it('classifies rising trend (+2 hPa over 6h)', () => {
    const pts = [mkPt(6, 1020), mkPt(3, 1021.5), mkPt(0, 1022)];
    const r = analysePressureTrend(pts, new Date(baseSec * 1000), 6);
    expect(r?.trend).toBe('rising');
    expect(r?.delta_hpa).toBeCloseTo(2, 1);
  });

  it('classifies falling trend (-3 hPa over 6h)', () => {
    const pts = [mkPt(6, 1020), mkPt(3, 1018), mkPt(0, 1017)];
    const r = analysePressureTrend(pts, new Date(baseSec * 1000), 6);
    expect(r?.trend).toBe('falling');
  });

  it('classifies stable (no change)', () => {
    const pts = [mkPt(6, 1020), mkPt(3, 1020.2), mkPt(0, 1020.5)];
    const r = analysePressureTrend(pts, new Date(baseSec * 1000), 6);
    expect(r?.trend).toBe('stable');
  });

  it('uses current_hpa = latest reading', () => {
    const pts = [mkPt(6, 1020), mkPt(3, 1021), mkPt(0, 1022.7)];
    const r = analysePressureTrend(pts, new Date(baseSec * 1000), 6);
    expect(r?.current_hpa).toBe(1022.7);
  });
});

describe('windDirectionName', () => {
  it.each([
    [0, 'N'],
    [45, 'NE'],
    [90, 'E'],
    [135, 'SE'],
    [180, 'S'],
    [225, 'SW'],
    [270, 'W'],
    [315, 'NW'],
    [360, 'N'],
    [122, 'SE'],
    [-10, 'N'],
  ])('%i° → %s', (deg, expected) => {
    expect(windDirectionName(deg)).toBe(expected);
  });
});
