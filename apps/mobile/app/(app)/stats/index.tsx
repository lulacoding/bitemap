import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  getMyStats,
  getMySpeciesBreakdown,
  getMyMonthlyCounts,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';

export default function StatsScreen() {
  const stats = useQuery({ queryKey: ['my-stats'], queryFn: getMyStats });
  const breakdown = useQuery({
    queryKey: ['my-species-breakdown'],
    queryFn: getMySpeciesBreakdown,
  });
  const monthly = useQuery({
    queryKey: ['my-monthly-counts'],
    queryFn: getMyMonthlyCounts,
  });

  const maxMonth = Math.max(1, ...(monthly.data ?? []).map((m) => m.count));

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={s.h1}>Your analytics</Text>

      <View style={s.heroRow}>
        <Hero label="Total catches" value={stats.data?.total_catches ?? 0} />
        <Hero label="Distinct species" value={stats.data?.distinct_species ?? 0} />
        <Hero label="This month" value={stats.data?.catches_this_month ?? 0} />
      </View>

      <Text style={s.section}>By species</Text>
      {breakdown.isLoading ? (
        <ActivityIndicator />
      ) : (breakdown.data ?? []).length === 0 ? (
        <Text style={s.empty}>No catches logged yet.</Text>
      ) : (
        (breakdown.data ?? []).slice(0, 10).map((b) => (
          <View key={b.species_id} style={s.row}>
            <Text style={s.rowName}>{b.common_name}</Text>
            <Text style={s.rowMeta}>
              {b.count}×{b.best_size_mm ? ` · PB ${b.best_size_mm}mm` : ''}
            </Text>
          </View>
        ))
      )}

      <Text style={s.section}>Last 12 months</Text>
      {monthly.isLoading ? (
        <ActivityIndicator />
      ) : (monthly.data ?? []).length === 0 ? (
        <Text style={s.empty}>No catches logged yet.</Text>
      ) : (
        <View style={s.chart}>
          {(monthly.data ?? []).map((m) => (
            <View key={m.month} style={s.barColumn}>
              <View
                style={[
                  s.bar,
                  {
                    height: Math.max(4, (m.count / maxMonth) * 100),
                  },
                ]}
              />
              <Text style={s.barLabel}>
                {m.month.slice(5)}/{m.month.slice(2, 4)}
              </Text>
              <Text style={s.barCount}>{m.count}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={s.note}>
        Stats update in real time as you log catches. CSV export + correlation
        insights ship later in this release cycle.
      </Text>
    </ScrollView>
  );
}

function Hero({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.hero}>
      <Text style={s.heroValue}>{value}</Text>
      <Text style={s.heroLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  h1: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 16 },
  heroRow: { flexDirection: 'row', gap: 10 },
  hero: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  heroValue: { fontSize: 28, fontWeight: '700', color: colors.primary },
  heroLabel: { fontSize: 11, color: '#64748b', marginTop: 2, textAlign: 'center' },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowName: { fontSize: 14, fontWeight: '600', color: '#111' },
  rowMeta: { fontSize: 13, color: '#64748b' },
  empty: { fontSize: 14, color: '#64748b', fontStyle: 'italic' },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 140,
    marginTop: 8,
  },
  barColumn: { flex: 1, alignItems: 'center' },
  bar: {
    width: '70%',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: { fontSize: 9, color: '#94a3b8', marginTop: 4 },
  barCount: { fontSize: 10, color: '#111', fontWeight: '700' },
  note: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 24,
    textAlign: 'center',
  },
});
