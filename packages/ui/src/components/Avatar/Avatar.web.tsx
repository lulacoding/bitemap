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
  const style = { width: px, height: px, borderRadius: 9999 } as const;
  if (src) {
    return <img src={src} alt={name} style={style} />;
  }
  return (
    <div
      aria-label={name}
      style={{
        ...style,
        backgroundColor: '#2BB7A8',
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: px * 0.38,
        fontWeight: 600,
      }}
    >
      {initials(name)}
    </div>
  );
}
