import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  getOverallLeaderboard,
  getPortPhillipLeaderboard,
  type LeaderboardRow,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';

type Tab = 'overall' | 'port_phillip';

export default function LeaderboardScreen() {
  const [tab, setTab] = useState<Tab>('overall');

  const overall = useQuery({
    queryKey: ['lb', 'overall'],
    queryFn: () => getOverallLeaderboard(50),
    enabled: tab === 'overall',
    staleTime: 5 * 60 * 1000,
  });

  const portPhillip = useQuery({
    queryKey: ['lb', 'port-phillip'],
    queryFn: () => getPortPhillipLeaderboard(50),
    enabled: tab === 'port_phillip',
    staleTime: 5 * 60 * 1000,
  });

  const q = tab === 'overall' ? overall : portPhillip;
  const rows: LeaderboardRow[] = q.data ?? [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.h1}>Leaderboard</Text>
        <Text style={styles.sub}>
          Ranked this month · updates every 10 min
        </Text>
      </View>

      <View style={styles.tabs}>
        {(
          [
            ['overall', 'Overall'],
            ['port_phillip', 'Port Phillip'],
          ] as const
        ).map(([t, label]) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === t && styles.tabTextActive]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Be the first</Text>
          <Text style={styles.emptyMeta}>
            No catches on this board yet this month. Log one and you'll claim
            the top spot.
          </Text>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          {rows.map((r, i) => (
            <View key={r.user_id} style={styles.row}>
              <Text style={styles.rank}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.user}>angler-{r.user_id.slice(0, 6)}</Text>
                <Text style={styles.meta}>
                  {r.catch_count} catch{r.catch_count === 1 ? '' : 'es'}
                  {r.species_count ? ` · ${r.species_count} species` : ''}
                  {r.best_size_mm ? ` · PB ${r.best_size_mm}mm` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.footer}>
        Catches are grouped by user for the current month. Hidden + private
        catches never appear.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20 },
  h1: { fontSize: 26, fontWeight: '700', color: '#111' },
  sub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#fff' },
  empty: { padding: 30, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  emptyMeta: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    width: 40,
  },
  user: { fontSize: 14, fontWeight: '700', color: '#111' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  footer: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    padding: 20,
    textAlign: 'center',
  },
});
