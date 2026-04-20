import { Image, Text, View } from 'react-native';
import { colors } from '../../tokens';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
}

const sizePx: Record<AvatarSize, number> = { sm: 28, md: 40, lg: 64 };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const px = sizePx[size];
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        accessibilityLabel={name}
        style={{ width: px, height: px, borderRadius: 9999 }}
      />
    );
  }
  return (
    <View
      accessibilityLabel={name}
      style={{
        width: px,
        height: px,
        borderRadius: 9999,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: px * 0.38 }}>
        {initials(name)}
      </Text>
    </View>
  );
}
