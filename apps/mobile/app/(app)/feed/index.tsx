import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  getFollowingFeed,
  getNearbyFeed,
  PORT_PHILLIP_BAY_CENTER,
  type FeedItem,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';
import { useUserLocation } from '../../../src/map/useUserLocation';

type Tab = 'following' | 'nearby';

export default function FeedScreen() {
  const [tab, setTab] = useState<Tab>('following');
  const router = useRouter();
  const { location } = useUserLocation();

  const lat = location?.lat ?? PORT_PHILLIP_BAY_CENTER[1];
  const lng = location?.lng ?? PORT_PHILLIP_BAY_CENTER[0];

  const following = useQuery({
    queryKey: ['feed', 'following'],
    queryFn: () => getFollowingFeed(40),
    enabled: tab === 'following',
    refetchInterval: 60 * 1000,
  });

  const nearby = useQuery({
    queryKey: ['feed', 'nearby', lat.toFixed(2), lng.toFixed(2)],
    queryFn: () => getNearbyFeed(lat, lng, 50, 40),
    enabled: tab === 'nearby',
    refetchInterval: 60 * 1000,
  });

  const active = tab === 'following' ? following : nearby;
  const data = active.data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['following', 'nearby'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'following' ? 'Following' : 'Nearby (50km)'}
            </Text>
          </Pressable>
        ))}
      </View>

      {active.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {tab === 'following'
              ? 'Follow some anglers'
              : 'No catches nearby yet'}
          </Text>
          <Text style={styles.emptyMeta}>
            {tab === 'following'
              ? 'Tap a pin on the map, view a profile, and follow — their catches land here.'
              : 'Be the first to log one — tap "+ Catch" on the map.'}
          </Text>
        </View>
      ) : (
        <FlatList<FeedItem>
          data={data}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => active.refetch()} />
          }
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/(app)/catch/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {item.quantity}× catch
                  {item.size_mm ? ` · ${item.size_mm}mm` : ''}
                </Text>
                <Text style={styles.cardTime}>
                  {timeAgo(item.created_at)}
                </Text>
              </View>
              {item.location_name && (
                <Text style={styles.cardMeta}>📍 {item.location_name}</Text>
              )}
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterItem}>♥ {item.like_count}</Text>
                <Text style={styles.cardFooterItem}>💬 {item.comment_count}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabs: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  cardTime: { fontSize: 12, color: '#64748b' },
  cardMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
  cardFooter: { flexDirection: 'row', gap: 16, marginTop: 8 },
  cardFooterItem: { fontSize: 12, color: '#64748b' },
});
