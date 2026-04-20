import type { Config } from 'tailwindcss';
import { colors, spacing, radius } from './tokens';

export const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        tertiary: colors.tertiary,
        surface: colors.surfaceLight,
        'surface-dark': colors.surfaceDark,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        pin: colors.pin,
      },
      spacing: Object.fromEntries(
        Object.entries(spacing).map(([k, v]) => [k, `${v}px`]),
      ) as Record<string, string>,
      borderRadius: { chip: `${radius.chip}px`, card: `${radius.card}px`, pill: '9999px' },
      fontFamily: { headline: ['PlusJakartaSans'], body: ['Inter'] },
    },
  },
};

export default preset;
