import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
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
import { colors } from '@bitemap/ui';
import { useUserLocation } from '../../../src/map/useUserLocation';

export default function TideScreen() {
  const { location } = useUserLocation();
  const lat = location?.lat ?? PORT_PHILLIP_BAY_CENTER[1];
  const lng = location?.lng ?? PORT_PHILLIP_BAY_CENTER[0];

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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.h1}>Tide & Conditions</Text>
      <Text style={styles.subtitle}>
        {location ? 'Your location' : 'Port Phillip Bay'}
      </Text>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Tide</Text>
        {marine.isLoading && <ActivityIndicator />}
        {state && (
          <Text style={styles.heroValue}>
            {state === 'incoming' ? 'Rising' : state === 'outgoing' ? 'Falling' : 'Slack'}
          </Text>
        )}
        {nextExtreme && (
          <Text style={styles.heroMeta}>
            Next {nextExtreme.type}:{' '}
            {new Date(nextExtreme.t * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            ({nextExtreme.height_m.toFixed(2)}m)
          </Text>
        )}
      </View>

      {tide.length > 0 && <TideChart points={tide.slice(0, 48)} />}

      {pressureTrend && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pressure (past 6h)</Text>
          <Text
            style={[
              styles.cardValue,
              pressureTrend.trend === 'rising' && { color: '#059669' },
              pressureTrend.trend === 'falling' && { color: '#dc2626' },
            ]}
          >
            {pressureTrend.trend === 'rising'
              ? '↑ Rising'
              : pressureTrend.trend === 'falling'
              ? '↓ Falling'
              : '→ Stable'}
          </Text>
          <Text style={styles.cardMeta}>
            {pressureTrend.current_hpa.toFixed(1)} hPa · Δ{' '}
            {pressureTrend.delta_hpa > 0 ? '+' : ''}
            {pressureTrend.delta_hpa.toFixed(1)} hPa
          </Text>
          <Text style={styles.disclaimer}>
            For reference — always check BOM marine warnings.
          </Text>
        </View>
      )}

      {wave && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Swell</Text>
          <Text style={styles.cardValue}>{wave.height_m.toFixed(1)} m</Text>
          <Text style={styles.cardMeta}>
            Period {wave.period_s.toFixed(1)}s · from{' '}
            {windDirectionName(wave.direction_deg)} (
            {Math.round(wave.direction_deg)}°)
          </Text>
        </View>
      )}

      <View style={styles.cards}>
        <Card title="Moon">
          <Text style={styles.cardValue}>{phase.replace('_', ' ')}</Text>
          <Text style={styles.cardMeta}>
            {Math.round(illum * 100)}% illumination
          </Text>
        </Card>
        <Card title="Solunar">
          <Text style={styles.cardValue}>
            {'★'.repeat(rating) + '☆'.repeat(4 - rating)}
          </Text>
          <Text style={styles.cardMeta}>{rating}/4</Text>
        </Card>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Feed times (today)</Text>
        {activeFeed && (
          <Text style={[styles.cardValue, { color: colors.primary }]}>
            Active: {activeFeed.label}
          </Text>
        )}
        {feedTimes.map((f) => {
          const start = new Date(f.start * 1000);
          const end = new Date(f.end * 1000);
          const fmt = (d: Date) =>
            d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <View key={f.label} style={styles.feedRow}>
              <Text
                style={[
                  styles.feedLabel,
                  f.type === 'major' && { fontWeight: '700' },
                ]}
              >
                {f.label}
              </Text>
              <Text style={styles.feedTime}>
                {fmt(start)} – {fmt(end)}
              </Text>
            </View>
          );
        })}
        <Text style={styles.disclaimer}>
          Approximated from sunrise/sunset; full lunar ephemeris lands in a later release.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weather</Text>
        {weather.isLoading && <ActivityIndicator />}
        {weather.data && (
          <>
            <View style={styles.weatherRow}>
              <Text style={styles.weatherTemp}>
                {weather.data.temp_c.toFixed(1)}°C
              </Text>
              <Text style={styles.cardMeta}>
                {weather.data.humidity_pct}% humidity · {weather.data.cloud_pct}% cloud
              </Text>
            </View>
            <Text style={styles.cardMeta}>
              Wind {windDirectionName(weather.data.wind_dir_deg)}{' '}
              {weather.data.wind_kmh.toFixed(0)} km/h ·{' '}
              {weather.data.pressure_hpa.toFixed(0)} hPa
            </Text>
            {weather.data.precipitation_mm > 0 && (
              <Text style={styles.cardMeta}>
                {weather.data.precipitation_mm.toFixed(1)} mm rain
              </Text>
            )}
          </>
        )}
      </View>

      <Text style={styles.attribution}>
        Tide, waves, weather, pressure: Open-Meteo (free, public). Moon + solunar: offline math.
      </Text>
    </ScrollView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TideChart({ points }: { points: TidePoint[] }) {
  const width = Dimensions.get('window').width - 40;
  const height = 180;
  const padV = 20;
  const padH = 8;

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

  const extremes = findExtremes(points).slice(0, 6);

  return (
    <View style={styles.chart}>
      <Svg width={width} height={height}>
        <Line
          x1={padH}
          y1={toY(0)}
          x2={width - padH}
          y2={toY(0)}
          stroke="#e5e7eb"
          strokeDasharray="4 4"
        />
        <Polyline
          points={polyPoints}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2}
        />
        {extremes.map((e) => {
          const idx = points.findIndex((p) => p.t === e.t);
          if (idx < 0) return null;
          const cx = padH + idx * xStep;
          const cy = toY(e.height_m);
          const fill = e.type === 'high' ? '#2BB7A8' : '#E4572E';
          return <Circle key={e.t} cx={cx} cy={cy} r={4} fill={fill} />;
        })}
        <SvgText x={padH} y={12} fontSize={10} fill="#666">
          {max.toFixed(2)}m
        </SvgText>
        <SvgText x={padH} y={height - 4} fontSize={10} fill="#666">
          {min.toFixed(2)}m
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  h1: { fontSize: 28, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 20 },
  hero: {
    backgroundColor: '#f0f9ff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    gap: 4,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: { fontSize: 32, fontWeight: '700', color: colors.primary },
  heroMeta: { fontSize: 13, color: '#64748b' },
  chart: { marginVertical: 8, alignItems: 'center' },
  cards: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    gap: 4,
    marginVertical: 6,
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    textTransform: 'capitalize',
  },
  cardMeta: { fontSize: 12, color: '#64748b' },
  disclaimer: { fontSize: 10, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  feedLabel: { fontSize: 13, color: '#374151' },
  feedTime: { fontSize: 13, color: '#64748b' },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  weatherTemp: { fontSize: 28, fontWeight: '700', color: '#111' },
  attribution: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
  },
});
