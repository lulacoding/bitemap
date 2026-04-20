import { useMemo, useState } from 'react';
import { View, Pressable, Text, StyleSheet, useColorScheme } from 'react-native';
import Mapbox, {
  MapView as RNMapView,
  Camera,
  UserLocation,
} from '@rnmapbox/maps';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  listCatches,
  listMarineParks,
  mockCatches,
  mapboxStyleForTheme,
  PORT_PHILLIP_BAY_CENTER,
  useFiltersStore,
  type Catch,
  type MockCatch,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';
import { CatchPin } from './CatchPin';
import { CatchPreviewSheet } from './CatchPreviewSheet';
import { useUserLocation } from './useUserLocation';
import { useCatchSubscription } from '../realtime/useCatchSubscription';
import { FilterBar } from './FilterBar';
import { ViewModeToggle } from './ViewModeToggle';
import { HeatmapLayer } from './HeatmapLayer';
import { MarineParksLayer } from './MarineParksLayer';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

export default function MapView() {
  const scheme = useColorScheme();
  const router = useRouter();
  const [selected, setSelected] = useState<MockCatch | null>(null);
  const { location, requestPermission } = useUserLocation();
  const [cameraCenter, setCameraCenter] =
    useState<[number, number]>(PORT_PHILLIP_BAY_CENTER);

  useCatchSubscription();

  const filters = useFiltersStore();

  const catchesQuery = useQuery({
    queryKey: [
      'catches',
      'map',
      filters.species,
      filters.bait,
      filters.technique,
      filters.freshnessHours,
    ],
    queryFn: () =>
      listCatches({
        species: filters.species.length > 0 ? filters.species : undefined,
        bait: filters.bait,
        technique: filters.technique,
        freshnessHours: filters.freshnessHours,
      }),
    refetchInterval: 30_000,
  });

  const parksQuery = useQuery({
    queryKey: ['marine-parks'],
    queryFn: () => listMarineParks('VIC'),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const realCatches = catchesQuery.data ?? [];
  const hasRealCatches = realCatches.length > 0;

  const pins: MockCatch[] = useMemo(() => {
    if (hasRealCatches) {
      return realCatches.map((c: Catch) => ({
        id: c.id,
        lat: c.lat,
        lng: c.lng,
        species: c.location_name ?? 'Catch',
        category: 'saltwater' as const,
        ageHours: hoursAgo(c.created_at),
      }));
    }
    return mockCatches;
  }, [realCatches, hasRealCatches]);

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

        {filters.layers.marineParks && parksQuery.data && (
          <MarineParksLayer parks={parksQuery.data} />
        )}

        {filters.viewMode === 'heatmap' && hasRealCatches ? (
          <HeatmapLayer catches={realCatches} />
        ) : (
          pins.map((c) => (
            <CatchPin key={c.id} catch={c} onPress={() => setSelected(c)} />
          ))
        )}
      </RNMapView>

      <FilterBar />
      <ViewModeToggle />

      <Pressable
        style={[styles.fab, styles.fabLocation]}
        onPress={centerOnUser}
        accessibilityLabel="Center on my location"
      >
        <Text style={styles.fabText}>◎</Text>
      </Pressable>

      <Pressable
        style={[styles.fab, styles.fabTide]}
        onPress={() => router.push('/(app)/tide')}
        accessibilityLabel="Tide and conditions"
      >
        <Text style={styles.fabText}>≋</Text>
      </Pressable>

      <Pressable
        style={[styles.fab, styles.fabLog]}
        onPress={() => router.push('/(app)/report')}
        accessibilityLabel="Log a catch"
      >
        <Text style={styles.fabLogText}>+ Catch</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabLocation: {
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
  },
  fabTide: {
    bottom: 90,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary,
  },
  fabLog: {
    bottom: 24,
    left: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: colors.tertiary,
  },
  fabText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  fabLogText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
