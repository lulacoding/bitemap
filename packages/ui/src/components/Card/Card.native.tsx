import type { ReactNode } from 'react';
import { View } from 'react-native';
import { radius, spacing } from '../../tokens';

export interface CardProps {
  children: ReactNode;
  elevation?: 'none' | 'subtle';
}

export function Card({ children, elevation = 'subtle' }: CardProps) {
  return (
    <View
      style={{
        borderRadius: radius.card,
        backgroundColor: '#FFFFFF',
        padding: spacing[4],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: elevation === 'subtle' ? 0.06 : 0,
        shadowRadius: 2,
        elevation: elevation === 'subtle' ? 1 : 0,
      }}
    >
      {children}
    </View>
  );
}
