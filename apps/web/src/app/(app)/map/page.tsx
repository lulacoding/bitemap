import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Loading map…</p>
    </div>
  ),
});

export default function MapPage() {
  return <MapView />;
}
