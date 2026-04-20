'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchMarine,
  fetchCurrentWeather,
  fetchPressureHistory,
  analysePressureTrend,
  findExtremes,
  tideStateFromPoints,
  currentWave,
  moonPhase,
  moonIllumination,
  solunarRating,
  windDirectionName,
  feedTimesFor,
  activeFeedTime,
  PORT_PHILLIP_BAY_CENTER,
  type TidePoint,
} from '@bitemap/shared';

export default function TidePage() {
  const [coords, setCoords] = useState<[number, number]>([
    PORT_PHILLIP_BAY_CENTER[1],
    PORT_PHILLIP_BAY_CENTER[0],
  ]);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        setHasLocation(true);
      },
      () => {},
    );
  }, []);

  const [lat, lng] = coords;

  const marine = useQuery({
    queryKey: ['marine', lat.toFixed(2), lng.toFixed(2)],
    queryFn: () => fetchMarine(lat, lng, 7),
    staleTime: 60 * 60 * 1000,
  });

  const weather = useQuery({
    queryKey: ['weather', lat.toFixed(2), lng.toFixed(2)],
    queryFn: () => fetchCurrentWeather(lat, lng),
    staleTime: 15 * 60 * 1000,
  });

  const pressureHistory = useQuery({
    queryKey: ['pressure', lat.toFixed(2), lng.toFixed(2)],
    queryFn: () => fetchPressureHistory(lat, lng, 12),
    staleTime: 30 * 60 * 1000,
  });

  const now = new Date();
  const phase = moonPhase(now);
  const illum = moonIllumination(now);
  const rating = solunarRating(now, lat, lng);

  const tide = marine.data?.tide ?? [];
  const waves = marine.data?.waves ?? [];

  const state = tide.length ? tideStateFromPoints(tide, now) : null;
  const extremes = useMemo(() => findExtremes(tide), [tide]);
  const nextExtreme = useMemo(() => {
    const nowSec = Math.floor(now.getTime() / 1000);
    return extremes.find((e) => e.t > nowSec);
  }, [extremes]);

  const wave = currentWave(waves, now);
  const pressureTrend = pressureHistory.data
    ? analysePressureTrend(pressureHistory.data, now, 6)
    : null;

  const feedTimes = useMemo(() => feedTimesFor(now, lat, lng), [lat, lng]);
  const activeFeed = activeFeedTime(feedTimes, now);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Tide & Conditions</h1>
      <p className="mt-1 text-sm text-gray-500">
        {hasLocation ? 'Your location' : 'Port Phillip Bay'}
      </p>

      <section className="mt-6 rounded-2xl bg-blue-50 p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Tide</p>
        {marine.isLoading && <p className="mt-2 text-gray-500">Loading…</p>}
        {state && (
          <p className="mt-1 text-4xl font-bold text-[#0E5C8A]">
            {state === 'incoming' ? 'Rising' : state === 'outgoing' ? 'Falling' : 'Slack'}
          </p>
        )}
        {nextExtreme && (
          <p className="mt-1 text-sm text-gray-600">
            Next {nextExtreme.type}:{' '}
            {new Date(nextExtreme.t * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            ({nextExtreme.height_m.toFixed(2)}m)
          </p>
        )}
      </section>

      {tide.length > 0 && <TideChart points={tide.slice(0, 48)} />}

      {pressureTrend && (
        <section className="mt-4 rounded-xl bg-gray-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Pressure (past 6h)
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              pressureTrend.trend === 'rising'
                ? 'text-emerald-600'
                : pressureTrend.trend === 'falling'
                ? 'text-red-600'
                : 'text-gray-900'
            }`}
          >
            {pressureTrend.trend === 'rising'
              ? '↑ Rising'
              : pressureTrend.trend === 'falling'
              ? '↓ Falling'
              : '→ Stable'}
          </p>
          <p className="text-sm text-gray-600">
            {pressureTrend.current_hpa.toFixed(1)} hPa · Δ{' '}
            {pressureTrend.delta_hpa > 0 ? '+' : ''}
            {pressureTrend.delta_hpa.toFixed(1)} hPa
          </p>
          <p className="mt-2 text-xs italic text-gray-400">
            For reference — always check BOM marine warnings.
          </p>
        </section>
      )}

      {wave && (
        <section className="mt-4 rounded-xl bg-gray-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Swell
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {wave.height_m.toFixed(1)} m
          </p>
          <p className="text-sm text-gray-600">
            Period {wave.period_s.toFixed(1)}s · from{' '}
            {windDirectionName(wave.direction_deg)} ({Math.round(wave.direction_deg)}°)
          </p>
        </section>
      )}

      <section className="mt-4 grid grid-cols-2 gap-4">
        <Card title="Moon">
          <p className="text-lg font-bold capitalize text-gray-900">
            {phase.replace('_', ' ')}
          </p>
          <p className="text-xs text-gray-500">
            {Math.round(illum * 100)}% illumination
          </p>
        </Card>
        <Card title="Solunar">
          <p className="text-lg font-bold text-amber-500">
            {'★'.repeat(rating) + '☆'.repeat(4 - rating)}
          </p>
          <p className="text-xs text-gray-500">{rating}/4</p>
        </Card>
      </section>

      <section className="mt-4 rounded-xl bg-gray-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Feed times (today)
        </p>
        {activeFeed && (
          <p className="mt-1 text-lg font-bold text-[#0E5C8A]">
            Active: {activeFeed.label}
          </p>
        )}
        <dl className="mt-2 divide-y divide-gray-200">
          {feedTimes.map((f) => {
            const start = new Date(f.start * 1000);
            const end = new Date(f.end * 1000);
            const fmt = (d: Date) =>
              d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={f.label} className="flex justify-between py-2 text-sm">
                <dt
                  className={
                    f.type === 'major'
                      ? 'font-bold text-gray-900'
                      : 'text-gray-700'
                  }
                >
                  {f.label}
                </dt>
                <dd className="text-gray-500">
                  {fmt(start)} – {fmt(end)}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-2 text-xs italic text-gray-400">
          Approximated from sunrise/sunset; full lunar ephemeris lands in a later release.
        </p>
      </section>

      <section className="mt-4 rounded-xl bg-gray-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Weather
        </p>
        {weather.isLoading && <p className="mt-2 text-gray-500">Loading…</p>}
        {weather.data && (
          <>
            <div className="mt-2 flex items-baseline gap-3">
              <p className="text-3xl font-bold text-gray-900">
                {weather.data.temp_c.toFixed(1)}°C
              </p>
              <p className="text-sm text-gray-600">
                {weather.data.humidity_pct}% humidity · {weather.data.cloud_pct}% cloud
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Wind {windDirectionName(weather.data.wind_dir_deg)}{' '}
              {weather.data.wind_kmh.toFixed(0)} km/h ·{' '}
              {weather.data.pressure_hpa.toFixed(0)} hPa
            </p>
            {weather.data.precipitation_mm > 0 && (
              <p className="text-sm text-gray-600">
                {weather.data.precipitation_mm.toFixed(1)} mm rain
              </p>
            )}
          </>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-gray-400">
        Tide, waves, weather, pressure: Open-Meteo (free, public). Moon + solunar: offline math.
      </p>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function TideChart({ points }: { points: TidePoint[] }) {
  const width = 720;
  const height = 200;
  const padV = 24;
  const padH = 12;

  if (points.length < 2) return null;

  const heights = points.map((p) => p.height_m);
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  const range = Math.max(0.1, max - min);

  const xStep = (width - padH * 2) / (points.length - 1);
  const toY = (h: number) => padV + (height - padV * 2) * (1 - (h - min) / range);

  const polyPoints = points
    .map((p, i) => `${padH + i * xStep},${toY(p.height_m)}`)
    .join(' ');

  const extremes = findExtremes(points).slice(0, 8);
  const zeroY = toY(0);

  return (
    <section className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white p-4">
      <svg width={width} height={height} className="max-w-full">
        <line
          x1={padH}
          y1={zeroY}
          x2={width - padH}
          y2={zeroY}
          stroke="#e5e7eb"
          strokeDasharray="4 4"
        />
        <polyline
          points={polyPoints}
          fill="none"
          stroke="#0E5C8A"
          strokeWidth={2}
        />
        {extremes.map((e) => {
          const idx = points.findIndex((p) => p.t === e.t);
          if (idx < 0) return null;
          const cx = padH + idx * xStep;
          const cy = toY(e.height_m);
          const fill = e.type === 'high' ? '#2BB7A8' : '#E4572E';
          return <circle key={e.t} cx={cx} cy={cy} r={4} fill={fill} />;
        })}
        <text x={padH} y={14} fontSize="11" fill="#6b7280">
          {max.toFixed(2)}m
        </text>
        <text x={padH} y={height - 6} fontSize="11" fill="#6b7280">
          {min.toFixed(2)}m
        </text>
      </svg>
      <p className="mt-2 text-xs text-gray-500">
        Next 48 hours · teal = high tide · orange = low tide
      </p>
    </section>
  );
}
