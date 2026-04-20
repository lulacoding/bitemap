import { ShapeSource, HeatmapLayer as MBHeatmapLayer } from '@rnmapbox/maps';
import { weightForCreatedAt, type Catch } from '@bitemap/shared';

interface Props {
  catches: Catch[];
}

export function HeatmapLayer({ catches }: Props) {
  const features = catches.map((c) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] },
    properties: {
      weight: weightForCreatedAt(c.created_at),
    },
  }));

  const shape = {
    type: 'FeatureCollection' as const,
    features,
  };

  return (
    <ShapeSource id="catches-heatmap-src" shape={shape}>
      <MBHeatmapLayer
        id="catches-heatmap"
        style={{
          heatmapWeight: ['get', 'weight'],
          heatmapIntensity: 1,
          heatmapRadius: 30,
          heatmapOpacity: 0.75,
          heatmapColor: [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(43,183,168,0)',
            0.3,
            'rgba(43,183,168,0.35)',
            0.6,
            'rgba(14,92,138,0.65)',
            1,
            'rgba(228,87,46,0.88)',
          ],
        }}
      />
    </ShapeSource>
  );
}
