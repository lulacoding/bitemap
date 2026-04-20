'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  mockCatches,
  alphaForAgeHours,
  pinColorForCategory,
  mapboxStyleForTheme,
  PORT_PHILLIP_BAY_CENTER,
} from '@bitemap/shared';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export default function WebMapView() {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (!MAPBOX_TOKEN) {
      setError('NEXT_PUBLIC_MAPBOX_TOKEN is not set');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: ref.current,
        style: mapboxStyleForTheme(!!prefersDark),
        center: PORT_PHILLIP_BAY_CENTER,
        zoom: 9,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize map');
      return;
    }

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right',
    );

    mockCatches.forEach((c) => {
      const el = document.createElement('div');
      el.style.width = '22px';
      el.style.height = '22px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid #fff';
      el.style.backgroundColor = pinColorForCategory(c.category);
      el.style.opacity = String(alphaForAgeHours(c.ageHours));
      el.style.cursor = 'pointer';
      el.setAttribute('data-testid', `pin-${c.id}`);

      new mapboxgl.Marker({ element: el })
        .setLngLat([c.lng, c.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 16 }).setHTML(
            `<strong>${c.species}</strong><br/><span style="color:#666;text-transform:capitalize">${c.category} · ${Math.round(c.ageHours)}h ago</span>`,
          ),
        )
        .addTo(map);
    });

    return () => map.remove();
  }, []);

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

  return <div ref={ref} style={{ height: '100vh', width: '100%' }} />;
}
