import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPoiById,
  listPoiReviews,
  listActivePoiStatusReports,
  postPoiStatus,
  upsertPoiReview,
  tideBelowRampThreshold,
  fetchMarine,
  tideStateFromPoints,
  type Poi,
  type PoiStatus,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';

const CATEGORY_LABEL: Record<string, string> = {
  boat_ramp: 'Boat ramp',
  bait_shop: 'Bait shop',
  fuel: 'Fuel dock',
  jetty: 'Jetty / pier',
  boat_hire: 'Boat hire',
  charter: 'Charter',
};

const STATUS_LABEL: Record<PoiStatus, string> = {
  open: 'Open',
  crowded: 'Crowded',
  debris: 'Debris / hazard',
  closed: 'Closed',
};

const STATUS_COLOR: Record<PoiStatus, string> = {
  open: '#059669',
  crowded: '#F59E0B',
  debris: '#EA580C',
  closed: '#DC2626',
};

interface Props {
  poiId: string | null;
  onClose: () => void;
}

export function POIDetailSheet({ poiId, onClose }: Props) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['55%', '90%'], []);
  const qc = useQueryClient();

  const poi = useQuery({
    queryKey: ['poi', poiId],
    queryFn: () => (poiId ? getPoiById(poiId) : null),
    enabled: !!poiId,
  });

  const reviews = useQuery({
    queryKey: ['poi-reviews', poiId],
    queryFn: () => (poiId ? listPoiReviews(poiId, 5) : []),
    enabled: !!poiId,
  });

  const statusReports = useQuery({
    queryKey: ['poi-status', poiId],
    queryFn: () => (poiId ? listActivePoiStatusReports(poiId) : []),
    enabled: !!poiId,
  });

  const tideWarningEnabled =
    poi.data?.category === 'boat_ramp' && poi.data.tide_min_m != null;

  const marineTide = useQuery({
    queryKey: [
      'marine-for-poi',
      poi.data?.lat.toFixed(2),
      poi.data?.lng.toFixed(2),
    ],
    queryFn: () =>
      poi.data ? fetchMarine(poi.data.lat, poi.data.lng, 2) : null,
    enabled: tideWarningEnabled && !!poi.data,
    staleTime: 60 * 60 * 1000,
  });

  const currentTideMetres = marineTide.data?.tide[0]?.height_m ?? null;
  const tideWarning =
    tideWarningEnabled && poi.data && currentTideMetres != null
      ? tideBelowRampThreshold(poi.data, currentTideMetres)
      : false;

  useEffect(() => {
    if (poiId) bottomSheetRef.current?.snapToIndex(0);
    else bottomSheetRef.current?.close();
  }, [poiId]);

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

  const postStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: PoiStatus; notes?: string }) => {
      if (!poiId) throw new Error('no poi');
      return postPoiStatus(poiId, status, notes);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['poi-status', poiId] }),
    onError: (e) =>
      Alert.alert(
        'Could not post status',
        e instanceof Error ? e.message : 'Unknown error',
      ),
  });

  const reviewMutation = useMutation({
    mutationFn: (rating: number) => {
      if (!poiId) throw new Error('no poi');
      return upsertPoiReview(poiId, rating);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['poi-reviews', poiId] });
      qc.invalidateQueries({ queryKey: ['poi', poiId] });
    },
    onError: (e) =>
      Alert.alert(
        'Could not save review',
        e instanceof Error ? e.message : 'Unknown error',
      ),
  });

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleChange}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.content}>
        {poi.isLoading ? (
          <ActivityIndicator />
        ) : poi.data ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.label}>{CATEGORY_LABEL[poi.data.category]}</Text>
            <Text style={styles.name}>{poi.data.name}</Text>
            {poi.data.address && (
              <Text style={styles.meta}>{poi.data.address}</Text>
            )}
            {poi.data.hours && (
              <Text style={styles.meta}>Hours: {poi.data.hours}</Text>
            )}
            {poi.data.rating_avg != null && poi.data.rating_count > 0 && (
              <Text style={styles.meta}>
                {'★'.repeat(Math.round(poi.data.rating_avg))} {poi.data.rating_avg.toFixed(1)} ·{' '}
                {poi.data.rating_count} review{poi.data.rating_count === 1 ? '' : 's'}
              </Text>
            )}
            {poi.data.phone && (
              <Pressable onPress={() => Linking.openURL(`tel:${poi.data!.phone}`)}>
                <Text style={styles.link}>Call: {poi.data.phone}</Text>
              </Pressable>
            )}
            {poi.data.website && (
              <Pressable onPress={() => Linking.openURL(poi.data!.website!)}>
                <Text style={styles.link}>{poi.data.website}</Text>
              </Pressable>
            )}

            {tideWarning && (
              <View style={styles.warn}>
                <Text style={styles.warnTitle}>⚠ Tide below safe threshold</Text>
                <Text style={styles.warnBody}>
                  {poi.data.name}: accessible above{' '}
                  {poi.data.tide_min_m?.toFixed(2)} m. Currently{' '}
                  {currentTideMetres?.toFixed(2)} m. Not recommended for trailer boats.
                </Text>
              </View>
            )}

            {poi.data.category === 'boat_ramp' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Post status pulse (6h)</Text>
                <View style={styles.statusRow}>
                  {(['open', 'crowded', 'debris', 'closed'] as PoiStatus[]).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => postStatusMutation.mutate({ status: s })}
                      disabled={postStatusMutation.isPending}
                      style={[styles.statusBtn, { backgroundColor: STATUS_COLOR[s] }]}
                    >
                      <Text style={styles.statusBtnText}>{STATUS_LABEL[s]}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {statusReports.data && statusReports.data.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active reports</Text>
                {statusReports.data.map((r) => (
                  <View key={r.id} style={styles.reportRow}>
                    <Text style={[styles.pill, { backgroundColor: STATUS_COLOR[r.status] }]}>
                      {STATUS_LABEL[r.status]}
                    </Text>
                    <Text style={styles.reportMeta}>
                      {new Date(r.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rate this POI</Text>
              <View style={styles.statusRow}>
                {[1, 2, 3, 4, 5].map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => reviewMutation.mutate(r)}
                    disabled={reviewMutation.isPending}
                    style={styles.starBtn}
                  >
                    <Text style={styles.star}>★ {r}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {reviews.data && reviews.data.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent reviews</Text>
                {reviews.data.map((rv) => (
                  <View key={rv.id} style={styles.reviewRow}>
                    <Text style={styles.stars}>{'★'.repeat(rv.rating)}</Text>
                    {rv.comment && <Text style={styles.comment}>{rv.comment}</Text>}
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.footer}>
              Source: {poi.data.source.replace('_', ' ')} · You can correct details via Settings.
            </Text>
          </ScrollView>
        ) : (
          <Text style={styles.meta}>POI not found.</Text>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, flex: 1 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 2 },
  meta: { fontSize: 14, color: '#4b5563', marginTop: 4 },
  link: { fontSize: 14, color: colors.primary, marginTop: 4 },
  warn: {
    marginTop: 16,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  warnTitle: { fontWeight: '700', color: '#b91c1c' },
  warnBody: { fontSize: 13, color: '#7f1d1d', marginTop: 4 },
  section: { marginTop: 22 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statusBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  starBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  star: { fontSize: 14, fontWeight: '700', color: '#b45309' },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  pill: {
    fontSize: 11,
    color: '#fff',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  reportMeta: { fontSize: 12, color: '#64748b' },
  reviewRow: { marginVertical: 4 },
  stars: { fontWeight: '700', color: '#b45309' },
  comment: { fontSize: 13, color: '#374151' },
  footer: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 24,
    fontStyle: 'italic',
  },
});
