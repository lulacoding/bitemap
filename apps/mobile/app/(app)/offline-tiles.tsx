import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useOfflineTiles } from '../../src/map/useOfflineTiles';
import { colors } from '@bitemap/ui';

export default function OfflineTilesScreen() {
  const { regions, downloading, progress, error, downloadRegion, deleteRegion } = useOfflineTiles();

  const handleDownload = () => {
    Alert.alert(
      'Download Port Phillip Bay',
      'This downloads map tiles (~30–50 MB) for offline use. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            void downloadRegion(
              `Port Phillip Bay — ${new Date().toLocaleDateString('en-AU')}`,
            );
          },
        },
      ],
    );
  };

  const handleDelete = (name: string) => {
    Alert.alert('Delete Region', `Remove "${name}" from offline storage?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void deleteRegion(name); } },
    ]);
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Offline Maps</Text>
      <Text style={s.subtitle}>Download map tiles to use BiteMap without internet. Up to 5 regions.</Text>

      {error && <Text style={s.error}>{error}</Text>}

      {downloading && (
        <View style={s.progressBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={s.progressText}>Downloading… {Math.round(progress)}%</Text>
        </View>
      )}

      <Pressable
        style={[s.btn, (downloading || regions.length >= 5) && s.btnDisabled]}
        onPress={handleDownload}
        disabled={downloading || regions.length >= 5}
      >
        <Text style={s.btnText}>Download Port Phillip Bay</Text>
      </Pressable>

      {regions.length === 0 ? (
        <Text style={s.empty}>No offline regions downloaded yet.</Text>
      ) : (
        <FlatList
          data={regions}
          keyExtractor={(r) => r.name}
          renderItem={({ item }) => (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.regionName}>{item.name}</Text>
                <Text style={s.regionMeta}>Zoom {item.minZoom}–{item.maxZoom} · {new Date(item.downloadedAt).toLocaleDateString('en-AU')}</Text>
              </View>
              <Pressable onPress={() => handleDelete(item.name)} style={s.deleteBtn}>
                <Text style={s.deleteText}>Delete</Text>
              </Pressable>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  error: { color: '#dc2626', marginBottom: 12, fontSize: 14 },
  progressBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8 },
  progressText: { color: '#0369a1', fontSize: 14 },
  btn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  regionName: { fontSize: 15, fontWeight: '600', color: '#111' },
  regionMeta: { fontSize: 13, color: '#666', marginTop: 2 },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#fca5a5', borderRadius: 6 },
  deleteText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  sep: { height: 1, backgroundColor: '#f0f0f0' },
});
