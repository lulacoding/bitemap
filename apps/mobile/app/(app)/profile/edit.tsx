import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyProfile,
  updateMyProfile,
  AU_STATES,
  type AuState,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';

export default function EditProfileScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [homeState, setHomeState] = useState<AuState>('VIC');
  const [photoBackup, setPhotoBackup] = useState(false);
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username ?? '');
    setBio(profile.bio ?? '');
    setLocation(profile.location ?? '');
    setHomeState((profile.home_state as AuState) ?? 'VIC');
    setPhotoBackup(profile.photo_backup_enabled);
    setAnalyticsOptOut(profile.analytics_opt_out);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      router.back();
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof Error && e.message.toLowerCase().includes('unique')
          ? 'Username taken, try another.'
          : e instanceof Error
            ? e.message
            : 'Could not save profile';
      Alert.alert('Error', msg);
    },
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  const save = () => {
    mutation.mutate({
      username: username.trim(),
      bio: bio.trim(),
      location: location.trim(),
      home_state: homeState,
      photo_backup_enabled: photoBackup,
      analytics_opt_out: analyticsOptOut,
    });
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={s.h1}>Edit profile</Text>

      <Text style={s.label}>Username</Text>
      <TextInput
        style={s.input}
        value={username}
        onChangeText={setUsername}
        placeholder="3-24 chars, no spaces"
        autoCapitalize="none"
      />

      <Text style={s.label}>Bio</Text>
      <TextInput
        style={[s.input, { minHeight: 80 }]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell other anglers about your style (≤280 chars)"
        multiline
        maxLength={280}
      />

      <Text style={s.label}>Location</Text>
      <TextInput
        style={s.input}
        value={location}
        onChangeText={setLocation}
        placeholder="e.g. Williamstown VIC"
      />

      <Text style={s.label}>Home state</Text>
      <View style={s.stateRow}>
        {AU_STATES.map((state) => (
          <Pressable
            key={state}
            onPress={() => setHomeState(state)}
            style={[s.stateBtn, homeState === state && s.stateBtnActive]}
          >
            <Text
              style={[
                s.stateBtnText,
                homeState === state && s.stateBtnTextActive,
              ]}
            >
              {state}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.hint}>
        Sets which state's bag limits + closed seasons show on your catch reports.
      </Text>

      <View style={s.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.toggleLabel}>Back up catch photos</Text>
          <Text style={s.toggleHint}>
            Opt-in. When off, photos are local-only and deleted with the 48h catch decay.
          </Text>
        </View>
        <Switch value={photoBackup} onValueChange={setPhotoBackup} />
      </View>

      <View style={s.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.toggleLabel}>Opt out of product analytics</Text>
          <Text style={s.toggleHint}>
            When on, PostHog (if configured) will not record usage events.
          </Text>
        </View>
        <Switch value={analyticsOptOut} onValueChange={setAnalyticsOptOut} />
      </View>

      <Pressable
        style={[s.save, mutation.isPending && { opacity: 0.5 }]}
        onPress={save}
        disabled={mutation.isPending}
      >
        <Text style={s.saveText}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  h1: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 12 },
  hint: { fontSize: 12, color: '#64748b', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 6,
    backgroundColor: '#fafafa',
  },
  stateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  stateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  stateBtnActive: { backgroundColor: colors.primary },
  stateBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  stateBtnTextActive: { color: '#fff' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#111' },
  toggleHint: { fontSize: 12, color: '#64748b', marginTop: 2 },
  save: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
