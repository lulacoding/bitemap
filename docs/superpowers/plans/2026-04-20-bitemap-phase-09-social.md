# BiteMap Phase 9 — Social (Likes, Comments, Follows, Feed) (Detailed TDD Plan)

**Goal:** Likes + comments on catches. Follow/unfollow users. Activity feed that blends followed-users catches + nearby activity.

**Tech Stack:** Supabase Realtime for live comments, React Query optimistic mutations, denormalised counts via DB triggers (already wired Phase 1).

---

## File Structure

```
packages/shared/src/queries/
├── likes.ts
├── comments.ts
├── follows.ts
└── feed.ts

apps/mobile/app/(app)/
├── catch/[id].tsx             (detail screen)
└── feed.tsx                   (activity feed tab)

apps/mobile/src/social/
├── LikeButton.tsx
├── CommentsSection.tsx
├── FollowButton.tsx
└── FeedItem.tsx
```

---

## Task 9.1 — Like Mutation (Optimistic)

- [ ] **Step 1: Tests**

```ts
test('optimistic like increments locally before API returns', async () => {
  const { result } = renderHook(() => useLikeMutation(), { wrapper: QueryClientWrapper });
  act(() => result.current.mutate({ catchId: 'c1', like: true }));
  // Without awaiting, cache already reflects increment
  expect(queryClient.getQueryData(['catch', 'c1'])?.like_count).toBe(prevCount + 1);
});
test('rollback on error', async () => {
  apiMock.mockRejectedValueOnce(new Error('500'));
  await act(async () => { try { await result.current.mutateAsync(...); } catch {} });
  expect(queryClient.getQueryData(['catch', 'c1'])?.like_count).toBe(prevCount);
});
```

- [ ] **Step 2: Implement**

```ts
// packages/shared/src/queries/likes.ts
export async function likeCatch(catchId: string) {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error('unauthenticated');
  const { error } = await supabase().from('catch_likes').insert({ catch_id: catchId, user_id: user.id });
  if (error) throw error;
}
export async function unlikeCatch(catchId: string) {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error('unauthenticated');
  const { error } = await supabase().from('catch_likes').delete().match({ catch_id: catchId, user_id: user.id });
  if (error) throw error;
}
```

```tsx
// apps/mobile/src/social/useLikeMutation.ts
export function useLikeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ catchId, like }: { catchId: string; like: boolean }) =>
      like ? likeCatch(catchId) : unlikeCatch(catchId),
    onMutate: async ({ catchId, like }) => {
      await qc.cancelQueries({ queryKey: ['catch', catchId] });
      const prev = qc.getQueryData<Catch>(['catch', catchId]);
      qc.setQueryData<Catch>(['catch', catchId], (c) => c ? ({ ...c, like_count: c.like_count + (like ? 1 : -1), liked_by_me: like }) : c);
      return { prev };
    },
    onError: (_e, { catchId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['catch', catchId], ctx.prev);
    },
    onSettled: (_d, _e, { catchId }) => qc.invalidateQueries({ queryKey: ['catch', catchId] }),
  });
}
```

---

## Task 9.2 — Comments

- [ ] Schema for comment body already enforced (≤500 chars) in Phase 1.
- [ ] **Queries:**

```ts
export async function listComments(catchId: string) { /* ... */ }
export async function postComment(catchId: string, body: string) { /* ... */ }
export async function deleteComment(commentId: string) { /* ... */ }
```

- [ ] **Realtime:** Subscribe to `INSERT` on `catch_comments` filtered by catch_id → live append to list.
- [ ] **UI:** single-level (no nested replies in v1). Delete own comment only.

---

## Task 9.3 — Follow/Unfollow

- [ ] **Queries:**

```ts
export async function follow(targetId: string) { /* ... */ }
export async function unfollow(targetId: string) { /* ... */ }
export async function isFollowing(targetId: string): Promise<boolean> { /* ... */ }
export async function getFollowers(userId: string) { /* ... */ }
export async function getFollowing(userId: string) { /* ... */ }
```

- [ ] **UI:** `FollowButton` toggles; shows optimistic state change.

---

## Task 9.4 — Activity Feed

**Layout:** segmented control "Following" | "Nearby". Infinite scroll list.

- [ ] **Following tab query:**

```ts
export async function getFollowingFeed(limit = 20, cursor?: string) {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) return [];
  // Fetch catches by users that current user follows, newest first, non-hidden, non-expired
  const { data, error } = await supabase()
    .from('catches')
    .select('*, profile:profiles!inner(id, username, avatar_url), species:species(common_name, category)')
    .in('user_id', sb => sb.from('follows').select('following_id').eq('follower_id', user.id))
    .eq('is_hidden', false)
    .gt('expires_at', new Date().toISOString())
    .neq('privacy_level', 'hidden')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data;
}
```

- [ ] **Nearby tab query:** within 50 km of user's last known location, same filters.

```ts
// Using earthdistance extension from Phase 1
export async function getNearbyFeed(lat: number, lng: number, km = 50) {
  const { data, error } = await supabase().rpc('nearby_catches', { at_lat: lat, at_lng: lng, radius_km: km });
  return data;
}
```

Backing RPC (migration):

```sql
create or replace function public.nearby_catches(at_lat float, at_lng float, radius_km float)
returns setof public.catches language sql stable as $$
  select * from public.catches
  where is_hidden = false and expires_at > now() and privacy_level <> 'hidden'
    and earth_box(ll_to_earth(at_lat, at_lng), radius_km * 1000) @> ll_to_earth(lat, lng)
  order by created_at desc limit 100;
$$;
```

---

## Task 9.5 — Catch Detail Screen

- [ ] Full catch data: photo, species, user, time, bait, technique, conditions (weather + tide from Phase 6), location (privacy-respecting), like button, comments thread.
- [ ] Own catch: delete button.

---

## Phase 9 Acceptance

- [ ] Unit: like mutation reverts on error
- [ ] Integration: like increments `like_count`; unlike decrements
- [ ] Integration: follow user → their new catch appears in Following feed
- [ ] E2E: comment on catch → comment visible to other users in < 3s (Realtime)
- [ ] E2E: Nearby feed respects 50 km radius and excludes hidden catches
- [ ] Tag `v0.9.0-social`
