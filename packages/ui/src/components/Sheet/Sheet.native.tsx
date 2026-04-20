import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function Sheet({ open, onClose, children, title }: SheetProps) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(11, 18, 32, 0.55)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: radius.card,
            borderTopRightRadius: radius.card,
            padding: spacing[6],
            maxHeight: '80%',
          }}
        >
          {title ? (
            <View style={{ marginBottom: spacing[4] }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textOnLight }}>
                {title}
              </Text>
            </View>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
