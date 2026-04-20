import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
}

interface UseUserLocationResult {
  location: UserLocation | null;
  error: string | null;
  loading: boolean;
  requestPermission: () => Promise<void>;
}

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Location permission denied');
      Alert.alert(
        'Location Required',
        'BiteMap needs your location to show catches near you. Enable it in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      setLoading(false);
      return;
    }

    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  return { location, error, loading, requestPermission };
}
