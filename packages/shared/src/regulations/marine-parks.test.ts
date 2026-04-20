import { describe, it, expect } from 'vitest';
import {
  parksContainingBbox,
  pointInPolygon,
  parksContainingPoint,
  type MarineParkWithGeometry,
} from './marine-parks';

const RICKETTS: MarineParkWithGeometry = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Ricketts Point MS',
  category: 'MS',
  state: 'VIC',
  bbox_min_lng: 145.0,
  bbox_min_lat: -37.99,
  bbox_max_lng: 145.03,
  bbox_max_lat: -37.97,
  polygon_geojson: '',
  notes: null,
  source_url: null,
  created_at: null,
  geometry: [
    [
      [145.0, -37.97],
      [145.03, -37.97],
      [145.03, -37.99],
      [145.0, -37.99],
      [145.0, -37.97],
    ],
  ],
};

describe('parksContainingBbox', () => {
  it('returns park when coords are inside bbox', () => {
    const hits = parksContainingBbox([RICKETTS], -37.98, 145.015);
    expect(hits).toHaveLength(1);
  });

  it('excludes park when coords are outside bbox', () => {
    const hits = parksContainingBbox([RICKETTS], -37.95, 145.015);
    expect(hits).toHaveLength(0);
  });
});

describe('pointInPolygon', () => {
  it('detects point inside square polygon', () => {
    expect(pointInPolygon(-37.98, 145.015, RICKETTS.geometry)).toBe(true);
  });

  it('rejects point outside polygon', () => {
    expect(pointInPolygon(-37.95, 145.015, RICKETTS.geometry)).toBe(false);
  });

  it('handles empty polygon safely', () => {
    expect(pointInPolygon(0, 0, [])).toBe(false);
  });
});

describe('parksContainingPoint', () => {
  it('combines bbox + polygon check', () => {
    const parks = [RICKETTS];
    expect(parksContainingPoint(parks, -37.98, 145.015)).toHaveLength(1);
    expect(parksContainingPoint(parks, -37.95, 145.015)).toHaveLength(0);
  });
});
