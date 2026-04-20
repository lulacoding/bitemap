import type { ReactNode } from 'react';
import { colors } from '../../tokens';

type PinColorKey = keyof typeof colors.pin;

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: PinColorKey;
  children?: ReactNode;
}

export function Chip({ label, active = false, onPress, color }: ChipProps) {
  const dotColor = color ? colors.pin[color] : undefined;
  const bg = active ? 'bg-primary text-white' : 'bg-white text-[#0B1220] border border-gray-300';
  return (
    <button
      type="button"
      onClick={onPress}
      className={`inline-flex items-center gap-2 rounded-chip px-3 py-1 text-sm font-medium ${bg}`}
    >
      {dotColor ? (
        <span
          aria-hidden="true"
          style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: dotColor }}
        />
      ) : null}
      {label}
    </button>
  );
}
