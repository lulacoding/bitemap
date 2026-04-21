import { useState, useEffect, useCallback } from 'react';
import { offlineManager } from '@rnmapbox/maps';

export type OfflineRegion = {
  name: string;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  minZoom: number;
  maxZoom: number;
  downloadedAt: string;
};

const MAX_REGIONS = 5;
const PORT_PHILLIP_BOUNDS: [number, number, number, number] = [144.3, -38.6, 145.2, -37.7];

export function useOfflineTiles() {
  const [regions, setRegions] = useState<OfflineRegion[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadRegions = useCallback(async () => {
    try {
      const packs = await offlineManager.getPacks();
      const loaded: OfflineRegion[] = packs.map((pack) => {
        const meta = pack.metadata as Record<string, unknown> | null;
        return {
          name: pack.name as string,
          bounds: (meta?.bounds as [number, number, number, number]) ?? PORT_PHILLIP_BOUNDS,
          minZoom: (meta?.minZoom as number) ?? 8,
          maxZoom: (meta?.maxZoom as number) ?? 14,
          downloadedAt: (meta?.downloadedAt as string) ?? new Date().toISOString(),
        };
      });
      setRegions(loaded);
    } catch {
      // Offline manager not ready yet — ignore
    }
  }, []);

  useEffect(() => { void loadRegions(); }, [loadRegions]);

  const downloadRegion = useCallback(async (
    name: string,
    bounds: [number, number, number, number] = PORT_PHILLIP_BOUNDS,
    minZoom = 8,
    maxZoom = 14,
  ) => {
    if (regions.length >= MAX_REGIONS) {
      setError(`Maximum ${MAX_REGIONS} offline regions reached. Delete one to continue.`);
      return;
    }
    if (regions.some((r) => r.name === name)) {
      setError('A region with that name already exists.');
      return;
    }

    setDownloading(true);
    setProgress(0);
    setError(null);

    try {
      await offlineManager.createPack(
        {
          name,
          styleURL: 'mapbox://styles/mapbox/light-v11',
          bounds: [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
          minZoom,
          maxZoom,
          metadata: {
            bounds,
            minZoom,
            maxZoom,
            downloadedAt: new Date().toISOString(),
          },
        },
        (_pack, status) => {
          setProgress(status.percentage ?? 0);
          // state 3 = complete
          if (status.state === 3) {
            setDownloading(false);
            setProgress(100);
            void loadRegions();
          }
        },
        (_pack, err) => {
          setDownloading(false);
          setError(err.message);
        },
      );
    } catch (e: unknown) {
      setDownloading(false);
      setError(e instanceof Error ? e.message : 'Download failed');
    }
  }, [regions, loadRegions]);

  const deleteRegion = useCallback(async (name: string) => {
    await offlineManager.deletePack(name);
    await loadRegions();
  }, [loadRegions]);

  return { regions, downloading, progress, error, downloadRegion, deleteRegion };
}
