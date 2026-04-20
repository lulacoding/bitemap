export interface BannerOfflineProps {
  message?: string;
}

export function BannerOffline({ message = 'Offline — changes will sync when online' }: BannerOfflineProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full rounded-pill bg-warning px-4 py-2 text-center text-sm font-medium text-white"
      style={{ animation: 'bitemap-pulse 1.5s ease-in-out infinite' }}
    >
      {message}
      <style>{`@keyframes bitemap-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.7 } }`}</style>
    </div>
  );
}
