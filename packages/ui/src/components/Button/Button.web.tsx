import type { ButtonProps } from './types';

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-secondary text-white',
  secondary: 'bg-primary text-white',
  ghost: 'bg-transparent text-primary border border-primary',
  danger: 'bg-danger text-white',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-14 px-6 text-lg',
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
  return (
    <button
      type="button"
      aria-label={accessibilityLabel}
      aria-busy={loading || undefined}
      disabled={inactive}
      onClick={() => {
        if (!inactive) onPress();
      }}
      className={`rounded-pill font-semibold ${variantClass[variant]} ${sizeClass[size]} ${
        inactive ? 'opacity-50' : ''
      }`}
    >
      {loading ? '…' : children}
    </button>
  );
}
