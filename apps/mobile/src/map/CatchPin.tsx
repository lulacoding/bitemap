import { View, StyleSheet } from 'react-native';
import { PointAnnotation } from '@rnmapbox/maps';
import {
  alphaForAgeHours,
  pinColorForCategory,
  type MockCatch,
} from '@bitemap/shared';

export function CatchPin({
  catch: c,
  onPress,
}: {
  catch: MockCatch;
  onPress?: () => void;
}) {
  const fill = pinColorForCategory(c.category);
  const opacity = alphaForAgeHours(c.ageHours);

  return (
    <PointAnnotation
      id={c.id}
      coordinate={[c.lng, c.lat]}
      onSelected={onPress}
    >
      <View
        testID={`pin-${c.id}`}
        style={[styles.pin, { backgroundColor: fill, opacity }]}
      />
    </PointAnnotation>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
