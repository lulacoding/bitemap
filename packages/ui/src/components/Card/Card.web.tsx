import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  elevation?: 'none' | 'subtle';
}

export function Card({ children, elevation = 'subtle' }: CardProps) {
  const shadow = elevation === 'subtle' ? 'shadow-sm' : '';
  return <div className={`rounded-card bg-white p-4 ${shadow}`}>{children}</div>;
}
