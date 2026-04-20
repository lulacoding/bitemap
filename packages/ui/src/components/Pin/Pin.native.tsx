import { View } from 'react-native';
import { colors } from '../../tokens';

type PinCategory = keyof typeof colors.pin;

export interface PinProps {
  category: PinCategory;
  alpha?: number;
  size?: number;
}

export function Pin({ category, alpha = 1, size = 32 }: PinProps) {
  const fill = colors.pin[category];
  return (
    <View
      accessibilityLabel={`${category} catch pin`}
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        backgroundColor: fill,
        opacity: alpha,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: 9999,
          backgroundColor: '#FFFFFF',
        }}
      />
    </View>
  );
}
