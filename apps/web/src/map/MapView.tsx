'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import {
  listCatches,
  listMarineParks,
  listPois,
  mockCatches,
  alphaForAgeHours,
  pinColorForCategory,
  mapboxStyleForTheme,
  weightForCreatedAt,
  useFiltersStore,
  PORT_PHILLIP_BAY_CENTER,
  type Catch,
  type Poi,
  type PoiCategory,
} from '@bitemap/shared';

const POI_CATEGORY_COLORS: Record<PoiCategory, string> = {
  boat_ramp: '#0E5C8A',
  bait_shop: '#E4572E',
  fuel: '#F59E0B',
  jetty: '#6B7280',
  boat_hire: '#2BB7A8',
  charter: '#7A5FD1',
};

const POI_CATEGORY_LABELS: Record<PoiCategory, string> = {
  boat_ramp: 'Boat ramp',
  bait_shop: 'Bait shop',
  fuel: 'Fuel dock',
  jetty: 'Jetty / pier',
  boat_hire: 'Boat hire',
  charter: 'Charter',
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export default function WebMapView() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const poiMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filters = useFiltersStore();

  const catchesQuery = useQuery({
    queryKey: [
      'catches',
      'map',
      filters.species,
      filters.bait,
      filters.technique,
      filters.freshnessHours,
    ],
    queryFn: () =>
      listCatches({
        species: filters.species.length > 0 ? filters.species : undefined,
        bait: filters.bait,
        technique: filters.technique,
        freshnessHours: filters.freshnessHours,
      }),
    refetchInterval: 30_000,
  });

  const parksQuery = useQuery({
    queryKey: ['marine-parks'],
    queryFn: () => listMarineParks('VIC'),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const poisQuery = useQuery({
    queryKey: ['pois', 'vic'],
    queryFn: () => listPois({ state: 'VIC', limit: 500 }),
    staleTime: 60 * 60 * 1000,
    enabled: filters.layers.pois,
  });

  // Initialise map
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) {
      setError('NEXT_PUBLIC_MAPBOX_TOKEN is not set');
      return;
    }
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    try {
      const map = new mapboxgl.Map({
        container: ref.current,
        style: mapboxStyleForTheme(!!prefersDark),
        center: PORT_PHILLIP_BAY_CENTER,
        zoom: 9,
      });
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right',
      );
      mapRef.current = map;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialise map');
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Marine parks overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const install = () => {
      if (!map.getSource('marine-parks')) {
        const parks = parksQuery.data ?? [];
        const fc = {
          type: 'FeatureCollection' as const,
          features: parks.map((p) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Polygon' as const,
              coordinates: p.geometry,
            },
            properties: { name: p.name, category: p.category },
          })),
        };
        map.addSource('marine-parks', { type: 'geojson', data: fc });
        map.addLayer({
          id: 'marine-parks-fill',
          type: 'fill',
          source: 'marine-parks',
          paint: { 'fill-color': '#dc2626', 'fill-opacity': 0.12 },
        });
        map.addLayer({
          id: 'marine-parks-line',
          type: 'line',
          source: 'marine-parks',
          paint: {
            'line-color': '#dc2626',
            'line-width': 1.5,
            'line-opacity': 0.55,
          },
        });
      }

      const visibility = filters.layers.marineParks ? 'visible' : 'none';
      if (map.getLayer('marine-parks-fill')) {
        map.setLayoutProperty('marine-parks-fill', 'visibility', visibility);
        map.setLayoutProperty('marine-parks-line', 'visibility', visibility);
      }
    };

    if (map.isStyleLoaded()) install();
    else map.once('load', install);
  }, [parksQuery.data, filters.layers.marineParks]);

  // Pins vs heatmap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const realCatches = catchesQuery.data ?? [];
    const hasRealCatches = realCatches.length > 0;

    const install = () => {
      // Heatmap source + layer
      const heatId = 'catches-heat';
      const heatSrcId = 'catches-heat-src';

      if (filters.viewMode === 'heatmap' && hasRealCatches) {
        const features = realCatches.map((c: Catch) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] },
          properties: { weight: weightForCreatedAt(c.created_at) },
        }));
        const fc = { type: 'FeatureCollection' as const, features };

        if (map.getSource(heatSrcId)) {
          (map.getSource(heatSrcId) as mapboxgl.GeoJSONSource).setData(fc);
        } else {
          map.addSource(heatSrcId, { type: 'geojson', data: fc });
          map.addLayer({
            id: heatId,
            type: 'heatmap',
            source: heatSrcId,
            paint: {
              'heatmap-weight': ['get', 'weight'],
              'heatmap-intensity': 1,
              'heatmap-radius': 30,
              'heatmap-opacity': 0.75,
              'heatmap-color': [
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
            },
          });
        }
        if (map.getLayer(heatId)) {
          map.setLayoutProperty(heatId, 'visibility', 'visible');
        }
      } else if (map.getLayer(heatId)) {
        map.setLayoutProperty(heatId, 'visibility', 'none');
      }

      // Pin markers
      if (filters.viewMode === 'pins') {
        const source = hasRealCatches
          ? realCatches.map((c) => ({
              id: c.id,
              lat: c.lat,
              lng: c.lng,
              category: 'saltwater' as const,
              species: c.location_name ?? 'Catch',
              ageHours:
                (Date.now() - new Date(c.created_at).getTime()) / 3_600_000,
            }))
          : mockCatches;

        for (const c of source) {
          const el = document.createElement('div');
          el.style.width = '22px';
          el.style.height = '22px';
          el.style.borderRadius = '50%';
          el.style.border = '2px solid #fff';
          el.style.backgroundColor = pinColorForCategory(c.category);
          el.style.opacity = String(alphaForAgeHours(c.ageHours));
          el.style.cursor = 'pointer';
          el.setAttribute('data-testid', `pin-${c.id}`);

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([c.lng, c.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 16 }).setHTML(
                `<strong>${c.species}</strong><br/><span style="color:#666;text-transform:capitalize">${c.category} · ${Math.round(c.ageHours)}h ago</span>`,
              ),
            )
            .addTo(map);
          markersRef.current.push(marker);
        }
      }
    };

    if (map.isStyleLoaded()) install();
    else map.once('load', install);
  }, [catchesQuery.data, filters.viewMode]);

  // POI markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current = [];

    if (!filters.layers.pois) return;
    const pois = poisQuery.data ?? [];

    const install = () => {
      for (const p of pois) {
        const el = document.createElement('div');
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid #fff';
        el.style.backgroundColor =
          POI_CATEGORY_COLORS[p.category] ?? '#6B7280';
        el.style.cursor = 'pointer';
        el.setAttribute('data-testid', `poi-${p.id}`);
        el.setAttribute('role', 'button');
        el.setAttribute(
          'aria-label',
          `${POI_CATEGORY_LABELS[p.category] ?? 'POI'}: ${p.name}`,
        );

        const popup = new mapboxgl.Popup({ offset: 12 });
        popup.on('open', () => populatePoiPopup(popup, p));

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(popup)
          .addTo(map);
        poiMarkersRef.current.push(marker);
      }
    };

    if (map.isStyleLoaded()) install();
    else map.once('load', install);
  }, [poisQuery.data, filters.layers.pois]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="font-semibold text-yellow-800">Map not available</p>
          <p className="mt-2 text-sm text-yellow-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      <div ref={ref} style={{ height: '100vh', width: '100%' }} />
      <FilterBarWeb />
    </div>
  );
}

/**
 * Populates the popup body with POI details. Uses DOM APIs + textContent
 * (never string interpolation of user-supplied text) to keep XSS surface zero.
 */
function populatePoiPopup(popup: mapboxgl.Popup, poi: Poi) {
  const container = document.createElement('div');
  container.style.minWidth = '200px';
  container.style.fontFamily = 'Inter, system-ui, sans-serif';

  const category = document.createElement('p');
  category.style.cssText =
    'margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.4px';
  category.textContent = POI_CATEGORY_LABELS[poi.category] ?? 'POI';
  container.appendChild(category);

  const name = document.createElement('p');
  name.style.cssText = 'margin:2px 0 0;font-size:15px;font-weight:700;color:#111';
  name.textContent = poi.name;
  container.appendChild(name);

  if (poi.address) {
    const addr = document.createElement('p');
    addr.style.cssText = 'margin:4px 0 0;font-size:12px;color:#4b5563';
    addr.textContent = poi.address;
    container.appendChild(addr);
  }

  if (poi.hours) {
    const hrs = document.createElement('p');
    hrs.style.cssText = 'margin:2px 0 0;font-size:12px;color:#4b5563';
    hrs.textContent = `Hours: ${poi.hours}`;
    container.appendChild(hrs);
  }

  if (poi.rating_avg != null && poi.rating_count > 0) {
    const rating = document.createElement('p');
    rating.style.cssText = 'margin:4px 0 0;font-size:12px;color:#b45309;font-weight:600';
    const stars = '★'.repeat(Math.round(poi.rating_avg));
    rating.textContent = `${stars} ${poi.rating_avg.toFixed(1)} · ${poi.rating_count} review${poi.rating_count === 1 ? '' : 's'}`;
    container.appendChild(rating);
  }

  if (poi.tide_min_m != null && poi.category === 'boat_ramp') {
    const tide = document.createElement('p');
    tide.style.cssText = 'margin:4px 0 0;font-size:11px;color:#64748b;font-style:italic';
    tide.textContent = `Accessible above ${poi.tide_min_m.toFixed(2)} m`;
    container.appendChild(tide);
  }

  popup.setDOMContent(container);
}

function FilterBarWeb() {
  const {
    species,
    freshnessHours,
    viewMode,
    layers,
    setFreshness,
    setViewMode,
    toggleLayer,
    reset,
  } = useFiltersStore();

  const activeCount =
    species.length +
    (freshnessHours !== 48 ? 1 : 0) +
    (!layers.marineParks ? 1 : 0) +
    (layers.pois ? 1 : 0);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
      <div className="pointer-events-auto flex max-w-[92vw] flex-wrap items-center gap-2 rounded-full bg-white/95 px-3 py-2 shadow">
        {(
          [
            [6, '6h'],
            [24, '24h'],
            [48, '48h'],
          ] as const
        ).map(([h, label]) => (
          <button
            key={label}
            onClick={() => setFreshness(h)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              freshnessHours === h
                ? 'bg-[#0E5C8A] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-gray-200" />
        {(
          [
            ['pins', 'Pins'],
            ['heatmap', 'Heatmap'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              viewMode === v
                ? 'bg-[#0E5C8A] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button
          onClick={() => toggleLayer('marineParks')}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
            layers.marineParks
              ? 'bg-red-100 text-red-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Marine parks
        </button>
        <button
          onClick={() => toggleLayer('pois')}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
            layers.pois
              ? 'bg-[#0E5C8A] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Ramps & bait
        </button>
        {activeCount > 0 && (
          <button
            onClick={reset}
            className="ml-1 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
