import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFiltersStore } from '@bitemap/shared';
import { colors } from '@bitemap/ui';

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useFiltersStore();

  return (
    <View style={styles.wrapper}>
      {(['pins', 'heatmap'] as const).map((m) => (
        <Pressable
          key={m}
          onPress={() => setViewMode(m)}
          style={[styles.btn, viewMode === m && styles.btnActive]}
        >
          <Text
            style={[styles.btnText, viewMode === m && styles.btnTextActive]}
          >
            {m === 'pins' ? 'Pins' : 'Heatmap'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 100,
    right: 12,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    padding: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  btnActive: { backgroundColor: colors.primary },
  btnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  btnTextActive: { color: '#fff' },
});
