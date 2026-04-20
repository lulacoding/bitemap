import { FlatList, View, Text, Pressable, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listSpecies, searchSpecies } from '@bitemap/shared';
import { useRouter } from 'expo-router';

const categoryChipStyle: Record<string, ViewStyle> = {
  saltwater: { backgroundColor: '#dbeafe' },
  freshwater: { backgroundColor: '#dcfce7' },
  estuarine: { backgroundColor: '#fef9c3' },
  pelagic: { backgroundColor: '#ede9fe' },
  other: { backgroundColor: '#fee2e2' },
};

export default function SpeciesScreen() {
  const [q, setQ] = useState('');
  const router = useRouter();
  const { data = [], isLoading } = useQuery({
    queryKey: ['species', q],
    queryFn: () => (q.length > 1 ? searchSpecies(q) : listSpecies()),
  });

  return (
    <View style={s.container}>
      <TextInput
        style={s.search}
        placeholder="Search species..."
        value={q}
        onChangeText={setQ}
        autoCapitalize="none"
      />
      {isLoading && <Text style={s.loading}>Loading...</Text>}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/species/${item.id}`)} style={s.row}>
            <View>
              <Text style={s.name}>{item.common_name}</Text>
              {item.scientific_name && <Text style={s.sci}>{item.scientific_name}</Text>}
            </View>
            <View style={[s.chip, categoryChipStyle[item.category] ?? s.chipDefault]}>
              <Text style={s.chipText}>{item.category}</Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={s.sep} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  search: { margin: 12, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, fontSize: 16 },
  loading: { textAlign: 'center', padding: 20, color: '#999' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  sci: { fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 2 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  chipDefault: { backgroundColor: '#eee' },
  chipText: { fontSize: 11, fontWeight: '600', color: '#333' },
  sep: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 16 },
});
