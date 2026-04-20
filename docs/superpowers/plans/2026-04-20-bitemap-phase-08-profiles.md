# BiteMap Phase 8 — Profiles + Personal Analytics (Detailed TDD Plan)

**Tag:** `v0.13.0-profiles`

**Goal:** Public + private profile screens. Edit profile, avatar upload, private logbook view. Plus the competitor-gap injects: bag-limit counter, CSV export, correlation cards, personal-best context, photo backup.

**Tech Stack:** `expo-image-picker`, `expo-image-manipulator`, Supabase Storage `avatars` bucket, `@tanstack/react-query`.

---

## File Structure

```
packages/shared/src/queries/profiles.ts

apps/mobile/app/(app)/profile/
├── [id].tsx                     (public view)
└── edit.tsx                     (own edit)

apps/mobile/src/profile/
├── AvatarUploader.tsx
├── LogbookList.tsx
└── ProfileStatsRow.tsx

apps/web/src/app/(app)/profile/[username]/page.tsx
```

---

## Task 8.1 — Profile Query Helpers

- [ ] **Step 1: Tests**

```ts
import { getProfileById, updateProfile, getLogbook } from './profiles';
test('getProfileById returns public fields only', async () => {
  const p = await getProfileById('user-uuid');
  expect(p).not.toHaveProperty('email');
  expect(p).toHaveProperty('username');
});
test('updateProfile rejects duplicate username', async () => {
  await expect(updateProfile({ username: 'taken' })).rejects.toThrow();
});
```

- [ ] **Step 2: Implement**

```ts
// packages/shared/src/queries/profiles.ts
export async function getProfileById(id: string) {
  const { data, error } = await supabase()
    .from('profiles')
    .select('id, username, avatar_url, bio, location, is_guide, is_verified, created_at')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase()
    .from('profiles').select('...').eq('username', username).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(patch: { username?: string; bio?: string; location?: string; avatar_url?: string }) {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error('unauthenticated');
  const { data, error } = await supabase().from('profiles').update(patch).eq('id', user.id).select().single();
  if (error) throw error; // unique-violation surfaces as friendly message upstream
  return data;
}

export async function getLogbook(userId: string) {
  // returns all catches by this user including hidden ones IF viewer === owner; else public only
  const { data: { user } } = await supabase().auth.getUser();
  const isOwner = user?.id === userId;
  let q = supabase().from('catches').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (!isOwner) q = q.eq('is_hidden', false).neq('privacy_level', 'hidden');
  const { data, error } = await q;
  if (error) throw error;
  return data;
}
```

---

## Task 8.2 — Avatar Upload

- [ ] **Step 1: Test**

```ts
test('uploadAvatar stores at avatars/{uid}.jpg, resizes ≤ 256px, ≤ 500KB', async () => {
  const r = await uploadAvatar(pickedAsset);
  expect(r.avatar_url).toMatch(/avatars\/[0-9a-f-]+\.jpg/);
});
```

- [ ] **Step 2: Implement**

```ts
// apps/mobile/src/profile/uploadAvatar.ts
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@bitemap/shared/supabase/browser';

export async function uploadAvatar(uri: string): Promise<string> {
  const resized = await ImageManipulator.manipulateAsync(uri,
    [{ resize: { width: 256, height: 256 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error('unauthenticated');
  const bytes = await fetch(resized.uri).then(r => r.blob());
  const path = `${user.id}.jpg`;
  const { error } = await supabase().storage.from('avatars').upload(path, bytes, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;
  const { data } = supabase().storage.from('avatars').getPublicUrl(path);
  await supabase().from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
  return data.publicUrl;
}
```

- [ ] **Step 3:** Old avatar garbage-collection via Supabase Storage's `upsert: true` (overwrites same key).

---

## Task 8.3 — Public Profile Screen

- [ ] **Layout** (see `bitemap-ux-research.md` §4 Profile):
  - Hero: avatar, username, bio, follow/unfollow button (Phase 9 wires Follow)
  - Stats row: Catches count, Species count
  - Tabs: **Catches** (default), **Species Caught**

- [ ] Catches tab: grid of thumbnail cards, tap → catch detail.
- [ ] Species Caught tab: list of species user has logged (dedupe).

- [ ] Own profile: Edit button in top-right → `/profile/edit`.

---

## Task 8.4 — Edit Profile Screen

- [ ] Form: username, bio, location, avatar picker.
- [ ] Client validation: username 3-24 chars, bio ≤ 200, location ≤ 80.
- [ ] On submit: call `updateProfile`. On unique-violation error → friendly "Username taken, try another."

```tsx
// app/(app)/profile/edit.tsx
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '@bitemap/ui';
import { updateProfile } from '@bitemap/shared/queries/profiles';
import { AvatarUploader } from '@/src/profile/AvatarUploader';

export default function EditProfile() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const r = useRouter();
  const save = async () => {
    try {
      await updateProfile({ username, bio });
      r.back();
    } catch (e: unknown) {
      const msg = e instanceof Error && e.message.includes('unique') ? 'Username taken' : 'Could not save';
      Alert.alert('Error', msg);
    }
  };
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <AvatarUploader />
      <Input label="Username" value={username} onChange={setUsername} autoCapitalize="none" />
      <Input label="Bio" value={bio} onChange={setBio} multiline />
      <Button onPress={save}>Save</Button>
    </View>
  );
}
```

---

## Task 8.5 — Private Logbook Tab (Own Profile Only)

- [ ] Show **all** own catches (including hidden + expired). Distinct from public tab.
- [ ] Filter/sort: by date, by species, by size.
- [ ] Each entry: full data (lat/lng even for `area`/`hidden` privacy, since owner).

---

## Task 8.6 — Deep Link From Map Pin

- [ ] Tap pin → bottom sheet → "View profile" → `/profile/[id]`.

---

## Task 8.7 — Web Parity

- [ ] Route: `/profile/[username]` (username, not id, for SEO).
- [ ] Server Component fetches profile + catches with RSC.
- [ ] `/profile/edit` client component for authenticated user.

---

---

## Competitor-gap injects (MUST SHIP in this release)

Merged from `docs/superpowers/plans/2026-04-20-bitemap-competitor-gap-backlog.md`. Every item below ships in `v0.13.0-profiles` alongside core Phase 8 work.

### Task 8.8 — Bag-limit catch counter + auto-alerts

**Competitor reference:** FishVerify, Fish Washington, onX Fish.

**Depends on:** `profiles.home_state` (shipped Phase 7) and `species_regulations` (shipped Phase 7).

- [ ] Today's session counter component (`src/profile/SessionCounter.tsx`): groups user's catches by species_id WHERE `created_at >= date_trunc('day', now())` and compares running count against `species_regulations.bag_limit` for the user's `home_state`.
- [ ] Visual states per species:
  - 0-79% of limit: neutral grey row
  - 80-99%: amber background + warning icon
  - 100%: red background + "⚠ Bag limit reached for VIC — release further catches"
- [ ] Surface the counter on two screens:
  1. Map home: collapsible card pinned below filter bar whenever any species has count ≥ 1 today
  2. Catch report screen: small inline readout below the species picker ("You've logged 4/5 flathead today")
- [ ] Clear disclaimer card: "Check the VFA guide before releasing. BiteMap is a guide, not legal advice."
- [ ] Respect state-aware regulations: if user's `home_state = 'NSW'`, counter checks NSW limits.

### Task 8.9 — CSV export + email delivery

**Competitor reference:** Reelback, CatchStats, Anglers' Log.

- [ ] Supabase Edge Function `export-my-data`:
  1. Authenticate caller via JWT
  2. SQL join every table user owns (profile, catches, saved_spots, comments, follows)
  3. Render 1 CSV per table + a README.txt describing schema + column meaning + retention policy
  4. Zip → upload to Storage `user-exports/{user_id}/{uuid}.zip` (7-day signed URL)
  5. Email via Resend with download link (Settings stores user's verified email)
- [ ] "Export my data" button in Settings → calls the Edge Function; shows "Check your email in 2 minutes."
- [ ] Rate limit: 1 export per user per 24 hours.

### Task 8.10 — Personal analytics dashboard

**Competitor reference:** CatchStats, Anglers' Log.

- [ ] New screen `apps/{mobile,web}/app/(app)/stats/…`:
  - Big number: total catches (all-time)
  - Big number: distinct species caught
  - Pie chart: catches by species (top 10 + "Other")
  - Bar chart: catches per month (last 12)
  - PB per species: table showing largest `size_mm` per species with date + conditions
  - Hotspot mini-map: scatter of owner's own catch locations (shown at `exact` even if publicly `area`)
- [ ] Pure SQL rollups in Supabase views (no client-side aggregation). Views restricted to `auth.uid()` via RLS.

### Task 8.11 — Personal-best record context

**Source:** gap 3.7 / 3.8 "real-time correlation cards" + PB context.

- [ ] On each species PB card, show the exact conditions of that catch:
  - Tide state + height at `created_at`
  - Weather (temp, wind, pressure trend)
  - Moon phase + solunar rating
  - Bait + technique
- [ ] Re-fish CTA button: "Log another {species} catch" with those conditions pre-populated into the report form (bait, technique pre-filled).

### Task 8.12 — Real-time catch-condition correlation cards

**Competitor reference:** Bite Signal, Fishero, ANGLR Pro.

- [ ] After N ≥ 50 catches logged by the user, surface insight cards on the stats screen:
  - "You catch more flathead on falling tide + air temp > 20°C" (N=18 in this bucket, 75% of your flathead)
  - "Neap-tide drift works best for you" (avg 2.3 catches/trip vs. 1.1 on spring tides)
- [ ] Simple SQL bucket grouping; NOT ML. Each insight renders:
  - The pattern in plain English
  - Sample size (N)
  - Confidence ("75% of your flathead")
- [ ] Explicit "Low-N, take with a grain of salt" badge when N < 20 in any bucket.

### Task 8.13 — Photo cloud backup + auto-compression

**Competitor reference:** Deeper, FishAngler.

- [ ] Opt-in toggle in Settings: "Back up my catch photos to BiteMap cloud."
- [ ] Client-side compression already targets ≤ 500 KB (scheduled in v0.10.1). Backup upload uses the same Storage bucket (`catch-photos`).
- [ ] If toggle off: photos stay device-local and expire with the 48h catch decay (photo reference dropped).
- [ ] If toggle on: photos persist in Storage keyed `catch-photos/{user_id}/{client_uuid}.jpg`. User deletes account → photos purged (cascade).

### Task 8.14 — Accessibility audit (cross-cutting rule)

Every new card, screen, or button added in Phase 8 must pass:
- [ ] WCAG AA contrast
- [ ] Minimum 44×44 pt tap targets
- [ ] `prefers-reduced-motion` respected
- [ ] Every Pressable has `accessibilityLabel` + `accessibilityRole`

---

## Phase 8 Acceptance

Core:
- [ ] Update own username → stored in DB
- [ ] Attempt duplicate username → DB error surfaced as friendly UX
- [ ] Upload avatar → `avatar_url` column updated; Storage object exists
- [ ] Old avatar overwritten (upsert behavior)
- [ ] Public profile query excludes `email`, `saved_spots`
- [ ] Own logbook shows hidden catches; other viewer's view does not
- [ ] E2E: tap map pin → view profile works
- [ ] Web parity for all above

Gap injects:
- [ ] Bag-limit counter renders, respects `home_state`, shows amber + red tiers, disclaimer visible
- [ ] CSV export delivers via email with a signed URL; rate-limited to 1/day
- [ ] Personal stats dashboard loads; pie + bar charts render; PB table correct
- [ ] PB card shows the exact conditions of the PB catch; "re-fish" CTA pre-populates report
- [ ] Correlation insight cards appear once user hits 50 catches
- [ ] Photo backup toggle persists; honours opt-in/out

Release:
- [ ] Tag `v0.13.0-profiles`
