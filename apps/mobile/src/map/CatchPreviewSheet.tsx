import { View, Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { colors } from '@bitemap/ui';
import type { MapCatchPin } from '@bitemap/shared';

interface Props {
  catch_: MapCatchPin | null;
  onClose: () => void;
}

export function CatchPreviewSheet({ catch_: c, onClose }: Props) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%'], []);
  const router = useRouter();

  useEffect(() => {
    if (c) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [c]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

  const ageLabel = (hours: number) => {
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.round(hours)}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  if (!c) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.species}>{c.species}</Text>
        <Text style={styles.meta}>
          {c.category} · {ageLabel(c.ageHours)}
        </Text>
        <Pressable style={styles.cta} onPress={() => router.push(`/(app)/species`)}>
          <Text style={styles.ctaText}>View species info</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 8 },
  species: { fontSize: 22, fontWeight: '700', color: '#111' },
  meta: { fontSize: 14, color: '#666', textTransform: 'capitalize' },
  cta: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
