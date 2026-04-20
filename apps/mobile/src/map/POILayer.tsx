import { ShapeSource, CircleLayer } from '@rnmapbox/maps';
import type { Poi } from '@bitemap/shared';

// Typed subset of @rnmapbox/maps ShapeSource onPress event (not exported publicly).
interface PressedFeature {
  id?: string | number;
  properties?: Record<string, unknown> | null;
}
interface ShapeSourcePressEvent {
  features?: PressedFeature[];
}

const CATEGORY_COLORS: Record<string, string> = {
  boat_ramp: '#0E5C8A',
  bait_shop: '#E4572E',
  fuel: '#F59E0B',
  jetty: '#6B7280',
  boat_hire: '#2BB7A8',
  charter: '#7A5FD1',
};

interface Props {
  pois: Poi[];
  onSelect?: (poiId: string) => void;
}

export function POILayer({ pois, onSelect }: Props) {
  if (pois.length === 0) return null;

  const features = pois.map((p) => ({
    type: 'Feature' as const,
    id: p.id,
    geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
    properties: {
      id: p.id,
      name: p.name,
      category: p.category,
      color: CATEGORY_COLORS[p.category] ?? '#6B7280',
    },
  }));

  const shape = {
    type: 'FeatureCollection' as const,
    features,
  };

  const handlePress = (e: ShapeSourcePressEvent) => {
    const hit = e.features?.[0];
    const fromProps = (hit?.properties as { id?: unknown } | null | undefined)?.id;
    const fromFeature = hit?.id;
    const id =
      typeof fromProps === 'string'
        ? fromProps
        : typeof fromFeature === 'string'
          ? fromFeature
          : undefined;
    if (id && onSelect) onSelect(id);
  };

  return (
    <ShapeSource id="pois-src" shape={shape} onPress={handlePress}>
      <CircleLayer
        id="pois-circles"
        style={{
          circleRadius: 7,
          circleColor: ['get', 'color'],
          circleStrokeColor: '#fff',
          circleStrokeWidth: 2,
          circleOpacity: 0.95,
        }}
      />
    </ShapeSource>
  );
}
