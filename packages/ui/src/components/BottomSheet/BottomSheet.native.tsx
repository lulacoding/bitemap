import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { radius, spacing } from '../../tokens';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  snapHeight?: number | `${number}%`;
}

export function BottomSheet({ open, onClose, children, snapHeight = '50%' }: BottomSheetProps) {
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
            height: snapHeight,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#D1D5DB',
              marginBottom: spacing[3],
            }}
          />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
