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
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ opacity: alpha }}
      aria-label={`${category} catch pin`}
      role="img"
    >
      <path
        d="M16 2 C9 2 4 7 4 14 C4 22 16 30 16 30 C16 30 28 22 28 14 C28 7 23 2 16 2 Z"
        fill={fill}
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="13" r="4" fill="#FFFFFF" />
    </svg>
  );
}
