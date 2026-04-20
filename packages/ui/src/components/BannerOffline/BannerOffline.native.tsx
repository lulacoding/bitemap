import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

export interface BannerOfflineProps {
  message?: string;
}

export function BannerOffline({ message = 'Offline — changes will sync when online' }: BannerOfflineProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={{
        width: '100%',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        backgroundColor: colors.warning,
        borderRadius: radius.pill,
        opacity,
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>{message}</Text>
      </View>
    </Animated.View>
  );
}
