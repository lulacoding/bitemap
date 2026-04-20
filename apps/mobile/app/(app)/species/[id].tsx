import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  getSpeciesById,
  getRegulationsForSpecies,
  type SpeciesRegulation,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';

export default function SpeciesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: species, isLoading } = useQuery({
    queryKey: ['species', id],
    queryFn: () => getSpeciesById(id),
    enabled: !!id,
  });

  const { data: regs = [] } = useQuery({
    queryKey: ['species-regs', id],
    queryFn: () => getRegulationsForSpecies(id),
    enabled: !!id,
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!species) return <Text style={s.notFound}>Species not found</Text>;

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{species.common_name}</Text>
        {species.scientific_name && (
          <Text style={s.sci}>{species.scientific_name}</Text>
        )}
        <View style={s.chip}>
          <Text style={s.chipText}>{species.category}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>VIC Fishing Regulations</Text>
        <RegRow
          label="Min. Legal Size"
          value={
            species.min_legal_size_mm
              ? `${species.min_legal_size_mm}mm`
              : 'No minimum'
          }
        />
        <RegRow
          label="Bag Limit"
          value={
            species.bag_limit != null ? String(species.bag_limit) : 'No limit'
          }
        />
        <RegRow
          label="Closed Season"
          value={
            species.closed_season_start
              ? `${species.closed_season_start} – ${species.closed_season_end}`
              : 'No closed season'
          }
        />
      </View>

      {regs.length > 1 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Cross-state comparison</Text>
          {regs.map((r: SpeciesRegulation) => (
            <View key={r.state} style={s.regStateRow}>
              <Text style={s.regState}>{r.state}</Text>
              <Text style={s.regStateVal}>
                {r.min_legal_size_mm ? `${r.min_legal_size_mm}mm` : 'no min'}
                {' · '}
                {r.bag_limit != null ? `bag ${r.bag_limit}` : 'no bag'}
              </Text>
            </View>
          ))}
          <Text style={s.disclaimer}>
            Check the relevant state fisheries authority before releasing. This
            is a guide, not legal advice.
          </Text>
        </View>
      )}

      {species.description && <Text style={s.desc}>{species.description}</Text>}

      <Pressable
        style={s.ctaPrimary}
        onPress={() => router.push(`/(app)/report?species=${id}`)}
      >
        <Text style={s.ctaPrimaryText}>
          Log a {species.common_name} catch
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function RegRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.regRow}>
      <Text style={s.regLabel}>{label}</Text>
      <Text style={s.regValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 24, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  sci: { fontSize: 16, color: '#666', fontStyle: 'italic', marginTop: 4 },
  chip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#1d4ed8' },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  regRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  regLabel: { fontSize: 15, color: '#374151' },
  regValue: { fontSize: 15, fontWeight: '600', color: '#111' },
  regStateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  regState: { fontSize: 14, fontWeight: '700', color: '#0E5C8A' },
  regStateVal: { fontSize: 14, color: '#374151' },
  disclaimer: {
    marginTop: 10,
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  desc: { margin: 16, fontSize: 15, lineHeight: 22, color: '#374151' },
  ctaPrimary: {
    margin: 16,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  notFound: {
    flex: 1,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
});
