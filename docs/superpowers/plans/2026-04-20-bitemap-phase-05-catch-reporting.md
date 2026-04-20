# BiteMap Phase 5 — Catch Reporting + Offline Queue (Detailed TDD Plan)

**Goal:** The core loop. Ship the 3-tap catch form with privacy tiers, photo upload, and a mobile-only offline queue. Map displays the user's new catch within 5 seconds via Supabase Realtime.

**Tech Stack:** `@tanstack/react-query` with persistent mutation queue, `@react-native-async-storage/async-storage`, `expo-location`, `expo-image-picker`, `expo-file-system`, Zod.

---

## File Structure

```
packages/shared/src/
├── schemas/catch.ts
├── queries/catches.ts
└── geo/privacy.ts

apps/mobile/
├── app/(app)/report/index.tsx
├── app/(app)/report/species-picker.tsx
├── src/catches/
│   ├── useCreateCatch.ts
│   ├── offlineQueue.ts
│   ├── persister.ts
│   └── OfflineBanner.tsx
└── src/realtime/useCatchSubscription.ts

apps/web/src/app/(app)/report/page.tsx   (parity, no offline queue)
```

---

## Task 5.1 — Zod `catchSchema`

- [ ] **Step 1: Failing tests**

```ts
import { catchInputSchema } from './catch';
test('valid minimal catch passes', () => {
  expect(() => catchInputSchema.parse({
    species_id: '11111111-1111-1111-1111-111111111111',
    quantity: 1, lat: -38.1, lng: 144.85, privacy_level: 'exact',
  })).not.toThrow();
});
test('size < 0 rejected', () => {
  expect(() => catchInputSchema.parse({ /* ... */, size_mm: -10 })).toThrow();
});
test('quantity < 1 rejected', () => {
  expect(() => catchInputSchema.parse({ /* ... */, quantity: 0 })).toThrow();
});
```

- [ ] **Step 2: Implement**

```ts
// packages/shared/src/schemas/catch.ts
import { z } from 'zod';
export const privacyLevelSchema = z.enum(['exact','area','hidden']);
export const catchInputSchema = z.object({
  species_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  size_mm: z.number().int().nonnegative().optional(),
  bait_used: z.string().max(80).optional(),
  technique: z.string().max(40).optional(),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  privacy_level: privacyLevelSchema,
  photo_url: z.string().url().optional(),
  client_uuid: z.string().uuid(), // idempotency key
});
export type CatchInput = z.infer<typeof catchInputSchema>;
```

- [ ] **Step 3: PASS + commit**

---

## Task 5.2 — Privacy Snap (server-side safety + client parity)

- [ ] **Step 1: Test**

```ts
import { applyPrivacy } from './privacy';
test('exact: coords unchanged', () => {
  const r = applyPrivacy('exact', { lat: -38.123456, lng: 144.987654 });
  expect(r.lat).toBe(-38.123456); expect(r.lng).toBe(144.987654);
});
test('area: snapped to ~1km grid', () => {
  const r = applyPrivacy('area', { lat: -38.123456, lng: 144.987654 });
  // Port Phillip Bay ~38° lat. 1km ≈ 0.009° lat, 0.0114° lng.
  expect(Math.abs(r.lat - (-38.12)) < 0.01).toBe(true);
  expect(Math.abs(r.lng - 144.99) < 0.01).toBe(true);
});
test('hidden: sets is_hidden', () => {
  const r = applyPrivacy('hidden', { lat: -38.1, lng: 144.85 });
  expect(r.is_hidden).toBe(true);
});
```

- [ ] **Step 2: Implement**

```ts
// packages/shared/src/geo/privacy.ts
type Coord = { lat: number; lng: number };
type PrivacyResult = Coord & { is_hidden?: boolean };

const GRID_KM = 1;
const LAT_PER_KM = 1 / 111;
const lngPerKm = (lat: number) => 1 / (111 * Math.cos((lat * Math.PI) / 180));

export function applyPrivacy(level: 'exact' | 'area' | 'hidden', c: Coord): PrivacyResult {
  if (level === 'exact') return c;
  if (level === 'hidden') return { ...c, is_hidden: true };
  const lStep = LAT_PER_KM * GRID_KM;
  const gStep = lngPerKm(c.lat) * GRID_KM;
  return {
    lat: Math.round(c.lat / lStep) * lStep,
    lng: Math.round(c.lng / gStep) * gStep,
  };
}
```

- [ ] **Step 3: Important** — apply on **both client** (to show correct pin location in map) **and server** via Edge Function `post-catch` that re-snaps before INSERT. This prevents a malicious client from sending `privacy_level='area'` with raw GPS.

- [ ] **Step 4: Commit**

---

## Task 5.3 — Supabase Edge Function `post-catch`

- [ ] **Step 1: `supabase/functions/post-catch/index.ts`**

```ts
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3';

const InputSchema = z.object({
  species_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  size_mm: z.number().optional(),
  bait_used: z.string().optional(),
  technique: z.string().optional(),
  lat: z.number(), lng: z.number(),
  privacy_level: z.enum(['exact','area','hidden']),
  photo_url: z.string().url().optional(),
  client_uuid: z.string().uuid(),
});

serve(async (req) => {
  const authToken = req.headers.get('Authorization');
  if (!authToken) return new Response('unauthorized', { status: 401 });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authToken } },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const body = InputSchema.parse(await req.json());
  // Idempotency: if a catch with this client_uuid exists, return it
  const { data: existing } = await sb.from('catches').select('*').eq('id', body.client_uuid).maybeSingle();
  if (existing) return Response.json(existing);

  // Apply server-side privacy snap
  const snapped = applyPrivacy(body.privacy_level, { lat: body.lat, lng: body.lng });
  const { data, error } = await sb.from('catches').insert({
    id: body.client_uuid,
    user_id: user.id,
    species_id: body.species_id,
    quantity: body.quantity,
    size_mm: body.size_mm,
    bait_used: body.bait_used,
    technique: body.technique,
    lat: snapped.lat, lng: snapped.lng,
    privacy_level: body.privacy_level,
    is_hidden: snapped.is_hidden ?? false,
    photo_url: body.photo_url,
  }).select().single();
  if (error) return new Response(error.message, { status: 400 });
  return Response.json(data);
});
```

- [ ] **Step 2: Deploy via `supabase functions deploy post-catch`**

---

## Task 5.4 — Offline Queue (Mobile Only)

- [ ] **Step 1: Tests**

```ts
import { enqueue, flush, getQueue } from './offlineQueue';
test('enqueue stores action', async () => {
  await enqueue({ type: 'CREATE_CATCH', payload: { ... }, retries: 0 });
  expect((await getQueue())).toHaveLength(1);
});
test('flush sends and removes on success', async () => {
  mockApi.mockResolvedValueOnce({ ok: true });
  await flush();
  expect((await getQueue())).toHaveLength(0);
});
test('flush retries with backoff on network error', async () => {
  mockApi.mockRejectedValueOnce(new NetworkError());
  await flush();
  const q = await getQueue();
  expect(q[0].retries).toBe(1);
});
```

- [ ] **Step 2: Implement**

```ts
// apps/mobile/src/catches/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@bitemap/shared/supabase/browser';

const KEY = 'bitemap.catchQueue.v1';
const MAX_RETRIES = 5;

type QueuedCatch = {
  id: string;
  payload: Record<string, unknown>;
  retries: number;
  lastError?: string;
  firstAttemptAt: number;
  lastAttemptAt?: number;
};

export async function getQueue(): Promise<QueuedCatch[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
async function setQueue(q: QueuedCatch[]) { await AsyncStorage.setItem(KEY, JSON.stringify(q)); }
export async function enqueue(item: Omit<QueuedCatch, 'firstAttemptAt'>) {
  const q = await getQueue();
  q.push({ ...item, firstAttemptAt: Date.now() });
  await setQueue(q);
}

let isFlushing = false;
export async function flush() {
  if (isFlushing) return;
  isFlushing = true;
  try {
    const q = await getQueue();
    const remaining: QueuedCatch[] = [];
    for (const item of q) {
      if (item.retries >= MAX_RETRIES) { remaining.push(item); continue; }
      try {
        await supabase().functions.invoke('post-catch', { body: item.payload });
        // drop on success
      } catch (e: unknown) {
        remaining.push({ ...item, retries: item.retries + 1, lastAttemptAt: Date.now(),
          lastError: e instanceof Error ? e.message : 'unknown' });
      }
    }
    await setQueue(remaining);
  } finally { isFlushing = false; }
}
```

- [ ] **Step 3: Auto-flush on connectivity regain**

```ts
// apps/mobile/app/_layout.tsx
import NetInfo from '@react-native-community/netinfo';
import { flush } from '@/src/catches/offlineQueue';
useEffect(() => {
  const sub = NetInfo.addEventListener(s => { if (s.isConnected) flush(); });
  return () => sub();
}, []);
```

- [ ] **Step 4: OfflineBanner** — renders when `NetInfo.isConnected === false`, pulses slowly.

---

## Task 5.5 — `useCreateCatch` Hook

- [ ] **Step 1: Test**

```ts
test('online: posts directly, returns catch', async () => {
  mockNetwork(true);
  const { result } = renderHook(() => useCreateCatch());
  await result.current.mutateAsync(sampleInput);
  // assert API called, result returned
});
test('offline: enqueues and shows optimistic pending', async () => {
  mockNetwork(false);
  const { result } = renderHook(() => useCreateCatch());
  await result.current.mutateAsync(sampleInput);
  expect((await getQueue())).toHaveLength(1);
});
```

- [ ] **Step 2: Implement**

```tsx
// useCreateCatch.ts
import { useMutation } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { randomUUID } from 'expo-crypto';
import { applyPrivacy } from '@bitemap/shared/geo/privacy';
import { enqueue, flush } from './offlineQueue';
import { supabase } from '@bitemap/shared/supabase/browser';

export function useCreateCatch() {
  return useMutation({
    mutationFn: async (input: Omit<CatchInput, 'client_uuid'>) => {
      const payload = { ...input, client_uuid: randomUUID() };
      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        await enqueue({ id: payload.client_uuid, payload, retries: 0 });
        return { queued: true, id: payload.client_uuid };
      }
      const { data, error } = await supabase().functions.invoke('post-catch', { body: payload });
      if (error) {
        await enqueue({ id: payload.client_uuid, payload, retries: 0 });
        return { queued: true, id: payload.client_uuid };
      }
      return data;
    },
  });
}
```

---

## Task 5.6 — Report Screen UI

Reference the Stitch spec in `docs/superpowers/design/bitemap-ux-research.md` § 4 "Catch Report".

- [ ] Single scrollable sheet (not wizard)
- [ ] Sections: Species picker, Quantity/Size, Bait/Technique chips, Auto-conditions readout (placeholder for Phase 6), Privacy segmented control, Photo upload
- [ ] Sticky bottom CTA
- [ ] Offline mode: CTA label "Queue Catch", tertiary orange

Key E2E: submit catch → pin appears on map within 5s via Realtime subscription.

---

## Task 5.7 — Realtime Pin Updates on Map

- [ ] **Step 1: `useCatchSubscription.ts`**

```ts
import { useEffect } from 'react';
import { supabase } from '@bitemap/shared/supabase/browser';
import { useQueryClient } from '@tanstack/react-query';

export function useCatchSubscription() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase().channel('catches')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'catches' },
        () => qc.invalidateQueries({ queryKey: ['catches', 'map'] }))
      .subscribe();
    return () => { supabase().removeChannel(ch); };
  }, [qc]);
}
```

- [ ] **Step 2: Map home imports + loads real catches (via `listCatches()`) instead of mocks**

- [ ] **Step 3: E2E** — two devices. Device A posts. Device B sees pin in <5s.

---

## Task 5.8 — Photo Upload

- [ ] Use `expo-image-picker` → launch photo picker.
- [ ] Compress client-side to ≤ 500 KB via `expo-image-manipulator` (quality 0.7, max 1920px edge).
- [ ] Upload to Supabase Storage `catch-photos/{user_id}/{client_uuid}.jpg`.
- [ ] Attach public URL to catch `photo_url`.
- [ ] E2E: pick image → upload → catch card shows photo.

---

## Task 5.9 — Privacy Verification Tests

Matches spec verification items 2–3.

- [ ] **Integration:** submit with `privacy_level='area'` → query raw SQL on Supabase → assert stored lat/lng ≠ device GPS, deviation ≈1 km
- [ ] **Integration:** insert catch with `expires_at = now() + 1 minute` → after 61s, `SELECT * FROM catches WHERE expires_at > now()` excludes this row
- [ ] **Detox E2E offline:** airplane mode → submit → re-enable → catch syncs (spec verification item 5)

---

## Phase 5 Acceptance

- [ ] All unit tests green
- [ ] Detox E2E 3-tap flow: pin on map within 5s
- [ ] Detox offline → sync E2E
- [ ] Privacy=area integration passes
- [ ] Privacy=hidden never returned to anon
- [ ] Expiry integration passes
- [ ] Photo upload works; photo_url valid on stored catch
- [ ] Map auto-refreshes via Realtime
- [ ] Tag `v0.5.0-reporting`

**If all pass → proceed to Phase 6 (Weather + tide).**
