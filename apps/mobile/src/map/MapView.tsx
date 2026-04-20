import { useState } from 'react';
import { View, Pressable, Text, StyleSheet, useColorScheme } from 'react-native';
import Mapbox, {
  MapView as RNMapView,
  Camera,
  UserLocation,
} from '@rnmapbox/maps';
import {
  mockCatches,
  mapboxStyleForTheme,
  PORT_PHILLIP_BAY_CENTER,
  type MockCatch,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';
import { CatchPin } from './CatchPin';
import { CatchPreviewSheet } from './CatchPreviewSheet';
import { useUserLocation } from './useUserLocation';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

export default function MapView() {
  const scheme = useColorScheme();
  const [selected, setSelected] = useState<MockCatch | null>(null);
  const { location, requestPermission } = useUserLocation();
  const [cameraCenter, setCameraCenter] =
    useState<[number, number]>(PORT_PHILLIP_BAY_CENTER);

  const centerOnUser = async () => {
    if (location) {
      setCameraCenter([location.lng, location.lat]);
    } else {
      await requestPermission();
    }
  };

  return (
    <View style={styles.container}>
      <RNMapView
        testID="mapbox-view"
        style={styles.map}
        styleURL={mapboxStyleForTheme(scheme)}
      >
        <Camera
          centerCoordinate={cameraCenter}
          zoomLevel={9}
          animationDuration={800}
        />
        <UserLocation visible showsUserHeadingIndicator />
        {mockCatches.map((c) => (
          <CatchPin key={c.id} catch={c} onPress={() => setSelected(c)} />
        ))}
      </RNMapView>

      <Pressable
        style={styles.fab}
        onPress={centerOnUser}
        accessibilityLabel="Center on my location"
      >
        <Text style={styles.fabText}>◎</Text>
      </Pressable>

      <CatchPreviewSheet catch_={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 24, fontWeight: '700' },
});
