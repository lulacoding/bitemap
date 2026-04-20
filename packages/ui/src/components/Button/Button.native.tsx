import { Pressable, Text, ActivityIndicator } from 'react-native';
import { colors, radius, spacing } from '../../tokens';
import type { ButtonProps } from './types';

const bgFor = (v: NonNullable<ButtonProps['variant']>): string => {
  switch (v) {
    case 'primary':
      return colors.secondary;
    case 'secondary':
      return colors.primary;
    case 'ghost':
      return 'transparent';
    case 'danger':
      return colors.danger;
  }
};

const heightFor = (s: NonNullable<ButtonProps['size']>): number => {
  switch (s) {
    case 'sm':
      return 36;
    case 'lg':
      return 56;
    default:
      return 44;
  }
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  children,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  const textColor = variant === 'ghost' ? colors.primary : '#FFFFFF';
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={() => {
        if (!inactive) onPress();
      }}
      style={{
        height: heightFor(size),
        paddingHorizontal: spacing[4],
        borderRadius: radius.pill,
        backgroundColor: bgFor(variant),
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: inactive ? 0.5 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontWeight: '600' }}>{children}</Text>
      )}
    </Pressable>
  );
}
