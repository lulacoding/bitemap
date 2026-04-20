import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  createCatch,
  getSpeciesById,
  listSpecies,
  listMarineParks,
  parksContainingPoint,
  PORT_PHILLIP_BAY_CENTER,
  type PrivacyLevel,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';
import { useUserLocation } from '../../../src/map/useUserLocation';
import { BagLimitCounter } from '../../../src/profile/BagLimitCounter';

export default function ReportCatchScreen() {
  const { species: speciesId } = useLocalSearchParams<{ species?: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { location } = useUserLocation();

  const [quantity, setQuantity] = useState('1');
  const [sizeMm, setSizeMm] = useState('');
  const [baitUsed, setBaitUsed] = useState('');
  const [technique, setTechnique] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyLevel>('exact');
  const [locationName, setLocationName] = useState('');

  const speciesQuery = useQuery({
    queryKey: ['species', speciesId],
    queryFn: () => (speciesId ? getSpeciesById(speciesId) : null),
    enabled: !!speciesId,
  });

  const parksQuery = useQuery({
    queryKey: ['marine-parks'],
    queryFn: () => listMarineParks('VIC'),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const speciesListQuery = useQuery({
    queryKey: ['species', 'list'],
    queryFn: () => listSpecies(),
    staleTime: 60 * 60 * 1000,
  });

  const speciesNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const sp of speciesListQuery.data ?? []) {
      m[sp.id] = sp.common_name;
    }
    return m;
  }, [speciesListQuery.data]);

  const mutation = useMutation({
    mutationFn: createCatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catches'] });
      Alert.alert('Catch logged!', 'Your catch is now on the map.', [
        { text: 'View map', onPress: () => router.replace('/(app)') },
      ]);
    },
    onError: (err: unknown) => {
      Alert.alert(
        'Failed to log catch',
        err instanceof Error ? err.message : 'Unknown error',
      );
    },
  });

  const [lat, lng] = location
    ? [location.lat, location.lng]
    : PORT_PHILLIP_BAY_CENTER.slice().reverse();

  const parkHits = useMemo(() => {
    if (!parksQuery.data || !location) return [];
    return parksContainingPoint(
      parksQuery.data,
      location.lat,
      location.lng,
    );
  }, [parksQuery.data, location]);

  const canSubmit =
    !!speciesId && parseInt(quantity, 10) > 0 && !mutation.isPending;

  const handleSubmit = () => {
    if (!speciesId) {
      Alert.alert('Species required', 'Pick a species from the guide first.');
      return;
    }
    mutation.mutate({
      species_id: speciesId,
      quantity: parseInt(quantity, 10) || 1,
      size_mm: sizeMm ? parseInt(sizeMm, 10) : undefined,
      bait_used: baitUsed || undefined,
      technique: technique || undefined,
      location_name: locationName || undefined,
      lat: lat as number,
      lng: lng as number,
      privacy_level: privacy,
    });
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.h1}>Log a catch</Text>

      <BagLimitCounter speciesNames={speciesNames} />

      {parkHits.length > 0 && (
        <View style={s.warning}>
          <Text style={s.warningTitle}>⚠ Inside a marine protected area</Text>
          <Text style={s.warningBody}>
            {parkHits.map((p) => p.name).join(', ')} — fishing is prohibited
            here. Log a release or move outside the zone.
          </Text>
        </View>
      )}

      <View style={s.section}>
        <Text style={s.label}>Species</Text>
        {speciesQuery.isLoading ? (
          <ActivityIndicator />
        ) : speciesQuery.data ? (
          <View style={s.speciesCard}>
            <Text style={s.speciesName}>{speciesQuery.data.common_name}</Text>
            {speciesQuery.data.scientific_name && (
              <Text style={s.speciesSci}>{speciesQuery.data.scientific_name}</Text>
            )}
            <Pressable onPress={() => router.push('/(app)/species')}>
              <Text style={s.changeLink}>Change</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={s.pickerBtn}
            onPress={() => router.push('/(app)/species')}
          >
            <Text style={s.pickerBtnText}>Choose species →</Text>
          </Pressable>
        )}
      </View>

      <View style={s.row}>
        <View style={s.half}>
          <Text style={s.label}>Quantity</Text>
          <TextInput
            style={s.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />
        </View>
        <View style={s.half}>
          <Text style={s.label}>Size (mm)</Text>
          <TextInput
            style={s.input}
            value={sizeMm}
            onChangeText={setSizeMm}
            keyboardType="number-pad"
            placeholder="e.g. 320"
          />
        </View>
      </View>

      <Text style={s.label}>Bait used</Text>
      <TextInput
        style={s.input}
        value={baitUsed}
        onChangeText={setBaitUsed}
        placeholder="e.g. pilchard, soft plastic"
      />

      <Text style={s.label}>Technique</Text>
      <TextInput
        style={s.input}
        value={technique}
        onChangeText={setTechnique}
        placeholder="e.g. bottom fishing, trolling"
      />

      <Text style={s.label}>Location name (optional)</Text>
      <TextInput
        style={s.input}
        value={locationName}
        onChangeText={setLocationName}
        placeholder="e.g. Ricketts Point"
      />

      <View style={s.section}>
        <Text style={s.label}>Privacy</Text>
        <View style={s.segmented}>
          {(['exact', 'area', 'hidden'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPrivacy(p)}
              style={[s.segment, privacy === p && s.segmentActive]}
            >
              <Text
                style={[
                  s.segmentText,
                  privacy === p && s.segmentTextActive,
                ]}
              >
                {p === 'exact' ? 'Exact' : p === 'area' ? '~1km area' : 'Hidden'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.privacyHint}>
          {privacy === 'exact' && 'Full GPS — others see the precise spot.'}
          {privacy === 'area' && 'Snapped to a ~1km grid cell.'}
          {privacy === 'hidden' && 'Location never shared publicly.'}
        </Text>
      </View>

      <Pressable
        style={[s.submit, !canSubmit && s.submitDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        <Text style={s.submitText}>
          {mutation.isPending ? 'Logging…' : 'Log catch'}
        </Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 12 },
  h1: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 8 },
  section: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  pickerBtn: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  pickerBtnText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  speciesCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  speciesName: { fontSize: 17, fontWeight: '700', color: '#111' },
  speciesSci: { fontSize: 13, fontStyle: 'italic', color: '#666' },
  changeLink: { color: colors.primary, fontWeight: '600', marginTop: 4 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  segmentTextActive: { color: '#111', fontWeight: '700' },
  privacyHint: { fontSize: 12, color: '#64748b', marginTop: 4 },
  submit: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  warning: {
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 14,
    marginBottom: 10,
  },
  warningTitle: { color: '#b91c1c', fontWeight: '700', fontSize: 15 },
  warningBody: { color: '#7f1d1d', fontSize: 13, marginTop: 4, lineHeight: 18 },
});
