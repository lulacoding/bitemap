import { Pressable, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

type PinColorKey = keyof typeof colors.pin;

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: PinColorKey;
}

export function Chip({ label, active = false, onPress, color }: ChipProps) {
  const bg = active ? colors.primary : '#FFFFFF';
  const fg = active ? '#FFFFFF' : colors.textOnLight;
  const dotColor = color ? colors.pin[color] : undefined;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        backgroundColor: bg,
        borderRadius: radius.chip,
        borderWidth: active ? 0 : 1,
        borderColor: '#D1D5DB',
      }}
    >
      {dotColor ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 9999,
            backgroundColor: dotColor,
          }}
        />
      ) : null}
      <Text style={{ color: fg, fontSize: 14, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}
