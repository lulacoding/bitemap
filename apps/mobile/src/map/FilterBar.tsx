import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import {
  useFiltersStore,
  listSpecies,
  type Species,
  type FreshnessHours,
} from '@bitemap/shared';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@bitemap/ui';

const FRESHNESS_OPTIONS: FreshnessHours[] = [6, 24, 48];

export function FilterBar() {
  const {
    species,
    freshnessHours,
    layers,
    toggleSpecies,
    setFreshness,
    toggleLayer,
    reset,
  } = useFiltersStore();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const speciesQuery = useQuery({
    queryKey: ['species', 'list'],
    queryFn: () => listSpecies(),
  });

  const filteredSpecies = (speciesQuery.data ?? []).filter((s) =>
    search.trim()
      ? s.common_name.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const activeCount =
    species.length +
    (freshnessHours !== 48 ? 1 : 0) +
    (!layers.marineParks ? 1 : 0) +
    (layers.pois ? 1 : 0);

  return (
    <>
      <View style={styles.wrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          <Chip
            label={
              species.length
                ? `Species (${species.length})`
                : 'Species'
            }
            active={species.length > 0}
            onPress={() => setPickerOpen(true)}
          />
          {FRESHNESS_OPTIONS.map((h) => (
            <Chip
              key={h}
              label={`${h}h`}
              active={freshnessHours === h}
              onPress={() => setFreshness(h)}
            />
          ))}
          <Chip
            label="Marine parks"
            active={layers.marineParks}
            onPress={() => toggleLayer('marineParks')}
          />
          {activeCount > 0 && (
            <Pressable onPress={reset} style={styles.clear}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Species</Text>
              <Pressable onPress={() => setPickerOpen(false)}>
                <Text style={styles.modalDone}>Done</Text>
              </Pressable>
            </View>
            <TextInput
              placeholder="Search species…"
              style={styles.modalSearch}
              value={search}
              onChangeText={setSearch}
            />
            <FlatList<Species>
              data={filteredSpecies}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const checked = species.includes(item.id);
                return (
                  <Pressable
                    style={styles.modalRow}
                    onPress={() => toggleSpecies(item.id)}
                  >
                    <View
                      style={[
                        styles.check,
                        checked && { backgroundColor: colors.primary },
                      ]}
                    />
                    <View style={styles.modalRowText}>
                      <Text style={styles.modalRowName}>{item.common_name}</Text>
                      {item.scientific_name && (
                        <Text style={styles.modalRowSci}>
                          {item.scientific_name}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },
  clear: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
  },
  clearText: { color: '#b91c1c', fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  modalDone: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  modalSearch: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    fontSize: 15,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  check: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 4,
  },
  modalRowText: { flex: 1 },
  modalRowName: { fontSize: 15, color: '#111', fontWeight: '600' },
  modalRowSci: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
});
