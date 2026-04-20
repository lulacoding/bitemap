# BiteMap Phase 4 — Map (Read-Only) (Detailed TDD Plan)

**Goal:** Fullscreen Mapbox map on both platforms, centred on Port Phillip Bay. Mock pins. User-location. Pin tap → bottom sheet preview. No real catch data yet.

**Tech Stack:** `@rnmapbox/maps` ^10 (mobile), `mapbox-gl` ^3 (web), `expo-location` for permission, `@bitemap/ui` primitives.

---

## File Structure

```
apps/mobile/app/(app)/
├── index.tsx                (Map home — now the default route)
└── _layout.tsx              (bottom tab bar)

apps/mobile/src/map/
├── MapView.tsx
├── CatchPin.tsx
├── CatchPreviewSheet.tsx
├── mockCatches.ts           (5 GeoJSON fixtures)
└── useUserLocation.ts

apps/web/src/app/(app)/
├── page.tsx                 (Map home)
└── map/MapView.tsx

apps/web/src/map/            (mirrors mobile)
```

---

## Task 4.1 — Mapbox SDK Setup

- [ ] **Step 1: Install**

```bash
# mobile
pnpm --filter mobile add @rnmapbox/maps
# web
pnpm --filter web add mapbox-gl
```

- [ ] **Step 2: Configure**

`apps/mobile/app.json` — add plugin config:
```json
{ "plugins": [["@rnmapbox/maps", { "RNMapboxMapsDownloadToken": "YOUR_DOWNLOAD_TOKEN" }]] }
```

Env: `EXPO_PUBLIC_MAPBOX_TOKEN` (runtime, public), `RNMapboxMapsDownloadToken` (secret, install-time).

- [ ] **Step 3: `pnpm prebuild`** (mobile, EAS config sync)

---

## Task 4.2 — `mockCatches.ts`

- [ ] **Step 1: Test**

```ts
import { mockCatches } from './mockCatches';
test('5 mock catches all inside Port Phillip Bay', () => {
  expect(mockCatches).toHaveLength(5);
  mockCatches.forEach(c => {
    expect(c.lat).toBeGreaterThan(-38.5);
    expect(c.lat).toBeLessThan(-37.7);
    expect(c.lng).toBeGreaterThan(144.4);
    expect(c.lng).toBeLessThan(145.1);
  });
});
```

- [ ] **Step 2: Implement**

```ts
export const mockCatches = [
  { id: 'm1', lat: -38.083, lng: 144.875, species: 'Snapper', category: 'saltwater' as const, ageHours: 2 },
  { id: 'm2', lat: -38.132, lng: 144.655, species: 'King George Whiting', category: 'saltwater' as const, ageHours: 12 },
  { id: 'm3', lat: -38.210, lng: 144.710, species: 'Flathead', category: 'estuarine' as const, ageHours: 28 },
  { id: 'm4', lat: -37.895, lng: 144.790, species: 'Australian Salmon', category: 'pelagic' as const, ageHours: 6 },
  { id: 'm5', lat: -38.045, lng: 144.820, species: 'Bream', category: 'estuarine' as const, ageHours: 44 },
];
```

- [ ] **Step 3: PASS + commit**

---

## Task 4.3 — Mobile `MapView`

- [ ] **Step 1: Smoke test**

```tsx
import { render, waitFor } from '@testing-library/react-native';
import MapView from './MapView';
test('renders Mapbox with centre Port Phillip Bay', async () => {
  const { findByTestId } = render(<MapView />);
  const m = await findByTestId('mapbox-view');
  expect(m.props.initialCenter).toEqual([144.85, -38.10]);
});
```

- [ ] **Step 2: Implement**

```tsx
// apps/mobile/src/map/MapView.tsx
import Mapbox, { MapView as RNMapView, Camera, UserLocation } from '@rnmapbox/maps';
import { useColorScheme } from 'react-native';
import { mockCatches } from './mockCatches';
import { CatchPin } from './CatchPin';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

export default function MapView() {
  const scheme = useColorScheme();
  const styleUrl = scheme === 'dark'
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';
  return (
    <RNMapView testID="mapbox-view" style={{ flex: 1 }} styleURL={styleUrl}>
      <Camera defaultSettings={{ centerCoordinate: [144.85, -38.10], zoomLevel: 9 }} />
      <UserLocation visible showsUserHeadingIndicator />
      {mockCatches.map(c => (
        <CatchPin key={c.id} catch={c} />
      ))}
    </RNMapView>
  );
}
```

- [ ] **Step 3: PASS + commit**

---

## Task 4.4 — `CatchPin` Component

- [ ] **Step 1: Unit test — alpha by age**

```ts
import { alphaForAgeHours } from './CatchPin';
test('fresh → 1.0', () => expect(alphaForAgeHours(0)).toBeCloseTo(1.0));
test('24h → 0.6', () => expect(alphaForAgeHours(24)).toBeCloseTo(0.6, 1));
test('48h → 0.3', () => expect(alphaForAgeHours(48)).toBeCloseTo(0.3, 1));
test('>48h → clamped 0.3', () => expect(alphaForAgeHours(72)).toBeCloseTo(0.3, 1));
```

- [ ] **Step 2: Implement**

```ts
export const alphaForAgeHours = (h: number) => {
  const clamped = Math.max(0, Math.min(48, h));
  return 1.0 - (clamped / 48) * 0.7; // 1.0 → 0.3 over 48h
};
```

- [ ] **Step 3: Pin renders** — `PointAnnotation` with fish SVG silhouette, fill = `@bitemap/ui` pin palette.

```tsx
import { PointAnnotation } from '@rnmapbox/maps';
import { colors } from '@bitemap/ui/tokens';
import type { MockCatch } from './mockCatches';

export function CatchPin({ catch: c, onPress }: { catch: MockCatch; onPress?: () => void }) {
  const fill = colors.pin[c.category];
  const alpha = alphaForAgeHours(c.ageHours);
  return (
    <PointAnnotation id={c.id} coordinate={[c.lng, c.lat]} onSelected={onPress}>
      <PinSvg fill={fill} opacity={alpha} />
    </PointAnnotation>
  );
}
```

---

## Task 4.5 — Bottom Sheet Preview

- [ ] **Step 1: Test**

```tsx
test('pin tap opens sheet with species name', async () => {
  const { findByText, findByTestId } = render(<MapView />);
  fireEvent.press(await findByTestId('pin-m1'));
  expect(await findByText('Snapper')).toBeTruthy();
});
```

- [ ] **Step 2: Implement** with `@gorhom/bottom-sheet`:
  - Tap pin → set selected state → open sheet
  - Sheet shows species name, time ago, "From [username]" placeholder, "View details" CTA (disabled for mocks)

---

## Task 4.6 — User Location

- [ ] `useUserLocation.ts` — requests `Location.requestForegroundPermissionsAsync()`, returns `{ lat, lng, accuracy }` + error state.
- [ ] Floating FAB on map → tapping centres camera on user.
- [ ] Missing permission → Alert with rationale, opens Settings app.

---

## Task 4.7 — Web Map Parity

- [ ] `apps/web/src/map/MapView.tsx`:

```tsx
'use client';
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mockCatches } from './mockCatches';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function WebMapView() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [144.85, -38.10], zoom: 9,
    });
    mockCatches.forEach(c => {
      new mapboxgl.Marker({ color: pinColor(c.category), opacity: alphaForAgeHours(c.ageHours) })
        .setLngLat([c.lng, c.lat])
        .setPopup(new mapboxgl.Popup().setText(c.species))
        .addTo(map);
    });
    return () => map.remove();
  }, []);
  return <div ref={ref} style={{ height: '100vh', width: '100%' }} />;
}
```

- [ ] Playwright asserts map loads + marker click opens popup.

---

## Task 4.8 — Theme Switching

- [ ] `mapboxStyleForTheme(scheme)` helper returns `light-v11` | `dark-v11`.
- [ ] Unit tests both branches.
- [ ] Mobile observes `useColorScheme()`; web observes `matchMedia('(prefers-color-scheme: dark)')`.

---

## Phase 4 Acceptance

- [ ] Mobile cold-launch to map < 3s on mid-tier device
- [ ] Tile cache survives airplane-mode relaunch
- [ ] Tap mock pin → bottom sheet opens with correct species name
- [ ] User-location FAB centres camera after permission granted
- [ ] Unit: `mapboxStyleForTheme('dark')` returns dark URL
- [ ] Unit: `alphaForAgeHours(24)` ≈ 0.6
- [ ] Web Playwright: map + marker + popup works
- [ ] Tag `v0.4.0-map-readonly`

**If all pass → proceed to Phase 5 (Catch reporting).**
