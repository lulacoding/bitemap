# BiteMap Phase 6 — Weather + Tide Enrichment (Detailed TDD Plan)

**Goal:** Auto-attach BOM weather + WorldTides tide + locally-computed moon phase + solunar rating to every catch. Standalone tide chart screen.

**Tech Stack:** Supabase Edge Function `enrich-catch`, Deno, BOM API, WorldTides API, local solunar/moon library (or hand-coded), Postgres `pg_cron` for retry job.

---

## File Structure

```
supabase/functions/
├── enrich-catch/
│   ├── index.ts
│   ├── bom.ts                (BOM client)
│   ├── worldtides.ts         (WorldTides client)
│   ├── moon.ts               (moon phase + solunar)
│   ├── cache.ts              (per-location-per-hour cache)
│   └── _test.ts
└── retry-enrichment/index.ts  (pg_cron target for failed enrichments)

apps/mobile/app/(app)/tide/index.tsx
apps/web/src/app/(app)/tide/page.tsx
```

---

## Task 6.1 — `moon.ts` (Offline Math)

Moon phase formula is deterministic — no API needed.

- [ ] **Step 1: Failing tests using known dates**

```ts
import { moonPhase, solunarRating } from './moon';
test('2026-03-03 is full moon', () => expect(moonPhase(new Date('2026-03-03T12:00:00Z'))).toBe('full'));
test('2026-03-10 is last quarter', () => expect(moonPhase(new Date('2026-03-10T12:00:00Z'))).toBe('last_quarter'));
test('solunar near sunrise at new moon is 4 stars', () => {
  expect(solunarRating(new Date('2026-03-19T06:00:00+11:00'), -38.1, 144.85)).toBe(4);
});
```

- [ ] **Step 2: Implement using Conway's approximation**

```ts
// Returns fractional illumination 0..1
export function moonIllumination(d: Date): number {
  const LP = 2551443; // lunar period seconds
  const newMoonRef = Date.UTC(2000, 0, 6, 18, 14) / 1000;
  const s = Math.floor(d.getTime() / 1000);
  const age = ((s - newMoonRef) % LP + LP) % LP;
  const ip = age / LP; // 0..1
  return (1 - Math.cos(ip * 2 * Math.PI)) / 2;
}

export function moonPhase(d: Date): 'new'|'waxing_crescent'|'first_quarter'|'waxing_gibbous'|'full'|'waning_gibbous'|'last_quarter'|'waning_crescent' {
  // Bucket based on moon age within 29.53-day cycle
  // (implementation: compute age/29.53, snap to 8 buckets)
  // ...
}

export function solunarRating(d: Date, lat: number, lng: number): number {
  // 0-4 stars based on distance from major/minor solunar peaks
  // (sunrise, sunset, moonrise, moonset adjusted by phase)
  // ...
}
```

- [ ] **Step 3: Test edge cases** — DST transitions, polar latitudes (reject or clamp).

---

## Task 6.2 — BOM Client

Australian Bureau of Meteorology exposes JSON at `http://www.bom.gov.au/fwo/IDV60801/IDV60801.{stationId}.json`.

- [ ] **Step 1: Test**

```ts
import { nearestBomStation, fetchBomSnapshot } from './bom';
test('nearest station for Port Phillip Bay returns 86071 (Melbourne)', () => {
  expect(nearestBomStation(-38.1, 144.85)).toBe('86071');
});
test('fetchBomSnapshot returns expected shape', async () => {
  const r = await fetchBomSnapshot('86071');
  expect(r).toMatchObject({ temp_c: expect.any(Number), wind_kmh: expect.any(Number) });
});
```

- [ ] **Step 2: Implement station lookup**

Hard-code ~20 BOM station coords for VIC/NSW/SA/TAS; pick nearest by haversine.

- [ ] **Step 3: Implement snapshot fetch**

```ts
export async function fetchBomSnapshot(stationId: string): Promise<BomSnapshot> {
  const res = await fetch(`http://www.bom.gov.au/fwo/IDV60801/IDV60801.${stationId}.json`);
  const j = await res.json();
  const obs = j.observations.data[0];
  return {
    temp_c: obs.air_temp,
    wind_kmh: obs.wind_spd_kmh,
    wind_dir: obs.wind_dir,
    pressure_hpa: obs.press_msl,
    humidity_pct: obs.rel_hum,
    cloud_okta: null, // BOM doesn't expose — optional
    rainfall_mm: obs.rain_trace,
  };
}
```

---

## Task 6.3 — WorldTides Client

- [ ] Register for WorldTides API key (free tier: 100 req/day, enough with caching).
- [ ] **Step 1: Test**

```ts
test('fetchTide returns height_m and state', async () => {
  const r = await fetchTide(-38.1, 144.85, new Date());
  expect(r.height_m).toBeGreaterThan(-2);
  expect(['incoming', 'outgoing', 'slack']).toContain(r.state);
});
```

- [ ] **Step 2: Implement**

```ts
export async function fetchTide(lat: number, lng: number, at: Date): Promise<TideSnapshot> {
  const ts = Math.floor(at.getTime() / 1000);
  const url = `https://www.worldtides.info/api/v3?heights&extremes&lat=${lat}&lon=${lng}&start=${ts - 3600}&length=7200&key=${Deno.env.get('WORLDTIDES_KEY')}`;
  const j = await (await fetch(url)).json();
  const heights = j.heights as Array<{ dt: number; height: number }>;
  const closest = heights.reduce((a, b) => Math.abs(b.dt - ts) < Math.abs(a.dt - ts) ? b : a);
  const next = heights.find(h => h.dt > ts);
  const state = next ? (next.height > closest.height ? 'incoming' : 'outgoing') : 'slack';
  return { height_m: closest.height, state };
}
```

---

## Task 6.4 — Cache Layer

To keep within API quotas.

- [ ] **Strategy:** cache key = `${round(lat,2)},${round(lng,2)},${floor(timestamp/3600)}`. Store JSON in Supabase Storage bucket `api-cache` (or a `cache_entries` table).

- [ ] **Step 1: Test**

```ts
test('second request within hour uses cache', async () => {
  const spy = jest.spyOn(globalThis, 'fetch');
  await enrichCatch({ lat: -38.1, lng: 144.85, created_at: new Date() });
  await enrichCatch({ lat: -38.1, lng: 144.85, created_at: new Date() });
  expect(spy).toHaveBeenCalledTimes(2); // once each for BOM + tide, not 4
});
```

- [ ] **Step 2: Implement cache read/write in `cache.ts`**

---

## Task 6.5 — `enrich-catch` Edge Function

- [ ] Handler:
  1. Authenticate caller (service role from DB trigger OR user JWT)
  2. Accept `{ catch_id }`
  3. Fetch catch row → read lat, lng, created_at
  4. Call `fetchBomSnapshot`, `fetchTide`, `moonPhase`, `solunarRating`
  5. `UPDATE catches SET weather_json=?, tide_json=?, moon_phase=?, solunar_rating=? WHERE id=?`
  6. Return success
  7. On API failure: log, set `enrichment_failed_at`, return 200 (don't fail the catch post)

- [ ] **Step 1: DB trigger that invokes the function on INSERT**

```sql
-- supabase/migrations/20260420000008_enrichment_trigger.sql
create or replace function trigger_enrich_catch() returns trigger language plpgsql security definer as $$
begin
  perform net.http_post(
    url := 'https://{project}.supabase.co/functions/v1/enrich-catch',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'), 'Content-Type', 'application/json'),
    body := jsonb_build_object('catch_id', NEW.id)
  );
  return NEW;
end; $$;
create trigger on_catch_insert after insert on public.catches
  for each row execute function trigger_enrich_catch();
```

- [ ] **Step 2: Integration test**

Post a catch → wait ≤ 10s → assert `weather_json` populated.

---

## Task 6.6 — Retry for Failed Enrichments

- [ ] Add column: `enrichment_failed_at timestamptz`, `enrichment_retry_count int default 0`.
- [ ] `retry-enrichment` Edge Function, scheduled via `pg_cron` every 5 minutes:
  - Find catches with `weather_json IS NULL AND enrichment_retry_count < 5 AND enrichment_failed_at < now() - interval '5 minutes'`
  - Re-invoke enrichment for each

---

## Task 6.7 — Standalone Tide Chart Screen (Mobile + Web)

- [ ] Fetch next 7 days of tide extremes for user's nearest station (WorldTides `extremes` endpoint).
- [ ] Render as line chart (`victory-native` mobile, `recharts` web). High and low tide points labelled with time + height.

---

## Task 6.8 — Spec Verification Item 7

"Open tide view, verify tide data loads for user's nearest tidal station."

- [ ] E2E: cold launch → navigate to tide → chart renders with 7 high + 7 low markers within 3s.

---

## Phase 6 Acceptance

- [ ] Unit: moon phase correct for known dates
- [ ] Unit: solunar rating bounds 0-4
- [ ] Integration: post catch → weather_json populated < 10s
- [ ] Integration: two catches same location, same hour → one BOM API call (cache hit)
- [ ] Integration: BOM failure → catch persists, `enrichment_failed_at` set; retry job picks up
- [ ] Mobile: tide chart renders 7 days (spec item 7)
- [ ] Tag `v0.6.0-enrichment`
