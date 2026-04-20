import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  getMyProfile,
  getLogbook,
  supabase,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';

export default function MyProfileScreen() {
  const router = useRouter();

  const profile = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const logbook = useQuery({
    queryKey: ['my-logbook', profile.data?.id],
    queryFn: () => (profile.data ? getLogbook(profile.data.id, 100) : []),
    enabled: !!profile.data,
  });

  const stats = useMemo(() => {
    const rows = logbook.data ?? [];
    const total = rows.length;
    const distinctSpecies = new Set(
      rows.map((r) => (r as { species_id: string }).species_id),
    ).size;
    return { total, distinctSpecies };
  }, [logbook.data]);

  const signOut = async () => {
    await supabase().auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  if (profile.isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!profile.data) {
    return (
      <View style={s.empty}>
        <Text>Not signed in.</Text>
      </View>
    );
  }

  const p = profile.data;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      <View style={s.hero}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {(p.username ?? 'Y').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={s.username}>{p.username ?? 'Unnamed angler'}</Text>
        {p.bio && <Text style={s.bio}>{p.bio}</Text>}
        {p.location && <Text style={s.meta}>📍 {p.location}</Text>}
        {p.home_state && <Text style={s.meta}>Home state: {p.home_state}</Text>}
        {p.is_guide && p.is_verified && (
          <View style={s.badge}>
            <Text style={s.badgeText}>✓ Verified Guide</Text>
          </View>
        )}
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statBig}>{stats.total}</Text>
          <Text style={s.statLabel}>catches</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statBig}>{stats.distinctSpecies}</Text>
          <Text style={s.statLabel}>species</Text>
        </View>
      </View>

      <View style={s.actions}>
        <Pressable
          style={s.btn}
          onPress={() => router.push('/(app)/profile/edit')}
        >
          <Text style={s.btnText}>Edit profile</Text>
        </Pressable>
        <Pressable style={s.btn} onPress={() => router.push('/(app)/stats')}>
          <Text style={s.btnText}>Analytics</Text>
        </Pressable>
        <Pressable
          style={[s.btn, s.btnDanger]}
          onPress={() =>
            Alert.alert('Sign out?', '', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: signOut },
            ])
          }
        >
          <Text style={[s.btnText, { color: '#b91c1c' }]}>Sign out</Text>
        </Pressable>
      </View>

      <Text style={s.sectionTitle}>Recent logbook</Text>
      {logbook.isLoading ? (
        <ActivityIndicator />
      ) : (logbook.data ?? []).length === 0 ? (
        <Text style={s.emptyText}>
          No catches logged yet. Head to the map and tap "+ Catch".
        </Text>
      ) : (
        (logbook.data ?? []).slice(0, 20).map((row: unknown) => {
          const c = row as {
            id: string;
            species_id: string;
            quantity: number;
            size_mm: number | null;
            created_at: string;
            location_name: string | null;
            is_hidden: boolean;
            privacy_level: string;
          };
          return (
            <View key={c.id} style={s.logRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.logTitle}>
                  {c.quantity}× catch
                  {c.size_mm ? ` · ${c.size_mm}mm` : ''}
                </Text>
                <Text style={s.logMeta}>
                  {new Date(c.created_at).toLocaleString()}
                  {c.location_name ? ` · ${c.location_name}` : ''}
                </Text>
              </View>
              {c.is_hidden && (
                <Text style={s.hiddenTag}>hidden</Text>
              )}
              {c.privacy_level === 'hidden' && (
                <Text style={s.hiddenTag}>private</Text>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 8,
  },
  hero: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  username: { fontSize: 24, fontWeight: '700', color: '#111' },
  bio: {
    fontSize: 14,
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
  badge: {
    marginTop: 8,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
  },
  statBig: { fontSize: 28, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  actions: { gap: 10, marginVertical: 16 },
  btn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDanger: { backgroundColor: '#fef2f2' },
  btnText: { fontSize: 15, fontWeight: '600', color: '#111' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
  logMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  hiddenTag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 10,
    color: '#374151',
    textTransform: 'uppercase',
  },
});
