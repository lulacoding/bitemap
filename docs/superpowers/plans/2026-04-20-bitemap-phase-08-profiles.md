# BiteMap Phase 8 — Profiles (Detailed TDD Plan)

**Goal:** Public + private profile screens. Edit profile, avatar upload, private logbook view.

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

## Phase 8 Acceptance

- [ ] Update own username → stored in DB
- [ ] Attempt duplicate username → DB error surfaced as friendly UX
- [ ] Upload avatar → `avatar_url` column updated; Storage object exists
- [ ] Old avatar overwritten (upsert behavior)
- [ ] Public profile query excludes `email`, `saved_spots`
- [ ] Own logbook shows hidden catches; other viewer's view does not
- [ ] E2E: tap map pin → view profile works
- [ ] Web parity for all above
- [ ] Tag `v0.8.0-profiles`
