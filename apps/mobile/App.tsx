import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { APP_NAME } from '@bitemap/shared';
import {
  Avatar,
  BannerOffline,
  Button,
  Card,
  Chip,
  Pin,
  SegmentedControl,
  colors,
  spacing,
} from '@bitemap/ui';

export default function App() {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>BiteMap Ocean Design System</Text>
          <Text style={styles.h1}>Hello {APP_NAME}</Text>
        </View>

        <BannerOffline />

        <View style={styles.row}>
          <Chip label="Snapper" active color="saltwater" />
          <Chip label="Whiting" color="estuarine" />
          <Chip label="Flathead" color="saltwater" />
        </View>

        <Card>
          <View style={styles.cardRow}>
            <Avatar name="Sam Bateman" />
            <View style={styles.cardMeta}>
              <Text style={styles.cardName}>Sam Bateman</Text>
              <Text style={styles.cardSub}>Ricketts Point · 2 hours ago</Text>
            </View>
            <Pin category="saltwater" />
          </View>
        </Card>

        <SegmentedControl
          options={[
            { value: 'pins', label: 'Pins' },
            { value: 'heatmap', label: 'Heatmap' },
          ]}
          value="pins"
          onChange={() => {}}
        />

        <View style={styles.buttons}>
          <Button onPress={() => {}}>Post Catch</Button>
          <Button variant="ghost" onPress={() => {}}>
            Filters
          </Button>
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceLight },
  content: {
    padding: spacing[6],
    paddingTop: spacing[12],
    gap: spacing[5],
  },
  header: { gap: spacing[1] },
  eyebrow: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  h1: { fontSize: 28, fontWeight: '600', color: colors.primary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  cardMeta: { flex: 1 },
  cardName: { fontWeight: '500', fontSize: 14, color: colors.textOnLight },
  cardSub: { fontSize: 12, color: '#6B7280' },
  buttons: { gap: spacing[3] },
});
