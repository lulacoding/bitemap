import { ShapeSource, FillLayer, LineLayer } from '@rnmapbox/maps';
import type { MarineParkWithGeometry } from '@bitemap/shared';

interface Props {
  parks: MarineParkWithGeometry[];
}

export function MarineParksLayer({ parks }: Props) {
  if (parks.length === 0) return null;

  const features = parks.map((p) => ({
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: p.geometry,
    },
    properties: {
      id: p.id,
      name: p.name,
      category: p.category,
    },
  }));

  const shape = {
    type: 'FeatureCollection' as const,
    features,
  };

  return (
    <ShapeSource id="marine-parks-src" shape={shape}>
      <FillLayer
        id="marine-parks-fill"
        style={{
          fillColor: '#dc2626',
          fillOpacity: 0.12,
        }}
      />
      <LineLayer
        id="marine-parks-outline"
        style={{
          lineColor: '#dc2626',
          lineWidth: 1.5,
          lineOpacity: 0.55,
        }}
      />
    </ShapeSource>
  );
}
