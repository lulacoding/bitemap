import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  getTodaysCatchCountsBySpecies,
  getMyProfile,
  getRegulationForState,
  classifyBagLimit,
  type AuState,
  type BagLimitTier,
} from '@bitemap/shared';
import { useState, useEffect } from 'react';

const TIER_COLORS: Record<BagLimitTier, string> = {
  safe: '#e5e7eb',
  warn: '#fef3c7',
  reached: '#fee2e2',
};

const TIER_TEXT: Record<BagLimitTier, string> = {
  safe: '#111',
  warn: '#b45309',
  reached: '#b91c1c',
};

interface Props {
  /** Names keyed by species_id so we can show the label */
  speciesNames: Record<string, string>;
  /** Defaults to signed-in user's home_state */
  state?: AuState;
}

/**
 * Renders today's catches per species with bag-limit indicator per the user's
 * home state. Hidden when no catches logged today.
 */
export function BagLimitCounter({ speciesNames, state }: Props) {
  const profile = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
    staleTime: 10 * 60 * 1000,
  });

  const effectiveState = state ?? profile.data?.home_state ?? 'VIC';

  const counts = useQuery({
    queryKey: ['today-catch-counts'],
    queryFn: getTodaysCatchCountsBySpecies,
    refetchInterval: 60 * 1000,
  });

  const [statuses, setStatuses] = useState<
    Array<{ species_id: string; count: number; tier: BagLimitTier; message: string }>
  >([]);

  useEffect(() => {
    if (!counts.data) return;
    (async () => {
      const out: Array<{
        species_id: string;
        count: number;
        tier: BagLimitTier;
        message: string;
      }> = [];
      for (const [speciesId, count] of counts.data.entries()) {
        const reg = await getRegulationForState(speciesId, effectiveState);
        const s = classifyBagLimit(speciesId, count, reg);
        out.push({
          species_id: speciesId,
          count,
          tier: s.tier,
          message: s.message,
        });
      }
      out.sort((a, b) => (a.tier === 'reached' ? -1 : b.tier === 'reached' ? 1 : 0));
      setStatuses(out);
    })();
  }, [counts.data, effectiveState]);

  if (!counts.data || counts.data.size === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Today's catches — {effectiveState} limits</Text>
      {statuses.map((s) => (
        <View
          key={s.species_id}
          style={[styles.row, { backgroundColor: TIER_COLORS[s.tier] }]}
        >
          <Text style={[styles.name, { color: TIER_TEXT[s.tier] }]}>
            {speciesNames[s.species_id] ?? 'Species'}
          </Text>
          <Text style={[styles.count, { color: TIER_TEXT[s.tier] }]}>
            {s.message}
          </Text>
        </View>
      ))}
      <Text style={styles.disclaimer}>
        Check the {effectiveState} fisheries authority before releasing. This is
        a guide, not legal advice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  name: { fontSize: 14, fontWeight: '600' },
  count: { fontSize: 13, fontWeight: '700' },
  disclaimer: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
});
