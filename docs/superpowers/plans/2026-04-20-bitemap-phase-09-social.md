# BiteMap Phase 9 — Social (Likes, Comments, Follows, Feed, Live Trips, DMs, Peer-Review)

**Tag:** `v0.14.0-social`

**Goal:** Likes + comments on catches. Follow/unfollow users. Activity feed that blends followed-users catches + nearby activity. Plus gap injects: live trip GPS broadcast, private DMs + group chat, verified-guide peer review, angler reputation scores. All four gap items share a Supabase Realtime channel infra — build once, use four times.

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

---

## Competitor-gap injects (MUST SHIP in this release)

Merged from `docs/superpowers/plans/2026-04-20-bitemap-competitor-gap-backlog.md`. All four injects share the Realtime channel infra that core Phase 9 already stands up — marginal cost once the first channel is live.

### Task 9.6 — Live trip GPS broadcast to trusted friends

**Competitor reference:** ANGLR Go LIVE, AllTrails Live Share, OnX Hunt Live Location.

**Privacy defaults:** strict opt-in, per-session, expires at trip end, ≤24h retention post-trip.

- [ ] New table `trip_sessions`:
  ```sql
  create table public.trip_sessions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    share_token text unique not null default encode(gen_random_bytes(16), 'hex'),
    started_at timestamptz default now(),
    ended_at timestamptz,
    expires_at timestamptz default (now() + interval '24 hours'),
    title text check (char_length(title) <= 80)
  );
  create index trip_sessions_expires_idx on public.trip_sessions(expires_at);

  create table public.trip_session_viewers (
    session_id uuid references public.trip_sessions(id) on delete cascade,
    viewer_id uuid references public.profiles(id) on delete cascade,
    primary key (session_id, viewer_id)
  );
  ```
- [ ] Cap friends at 10 viewers per session.
- [ ] Require mutual-follow OR explicit per-trip approval from the broadcaster (no silent invites).
- [ ] Broadcaster's position posted to a Supabase Realtime channel keyed `trip:{share_token}` every 30s while trip is active.
- [ ] Viewer UI: separate map overlay — friend pins with username + "updated Xs ago" + battery/cell indicator (from `navigator.connection` on web, expo-battery on mobile).
- [ ] End trip: button in broadcaster UI writes `ended_at = now()`; Realtime channel tombstoned after that.
- [ ] Position history anonymised + deleted 24h post-trip (cron cleanup).
- [ ] Stalking mitigation: broadcaster can kick a viewer mid-trip.
- [ ] Edge Function enforces server-side that only `trip_session_viewers` rows can subscribe.

### Task 9.7 — Private DMs + group chat

**Competitor reference:** Fishbrain, ANGLR.

- [ ] New tables:
  ```sql
  create table public.chat_threads (
    id uuid primary key default uuid_generate_v4(),
    kind text not null check (kind in ('dm','group')),
    title text check (char_length(title) <= 80),
    created_at timestamptz default now(),
    created_by uuid references public.profiles(id) on delete set null
  );

  create table public.chat_thread_members (
    thread_id uuid references public.chat_threads(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    joined_at timestamptz default now(),
    last_read_at timestamptz,
    primary key (thread_id, user_id)
  );

  create table public.chat_messages (
    id uuid primary key default uuid_generate_v4(),
    thread_id uuid not null references public.chat_threads(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    body text not null check (char_length(body) between 1 and 2000),
    created_at timestamptz default now(),
    edited_at timestamptz,
    deleted_at timestamptz
  );

  create table public.chat_message_flags (
    message_id uuid references public.chat_messages(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    reason text,
    created_at timestamptz default now(),
    primary key (message_id, user_id)
  );
  ```
- [ ] RLS: member-only read/write. Non-members never see thread existence.
- [ ] Flags: 3 flags auto-hide the message pending moderation (trigger on `chat_message_flags` insert).
- [ ] Realtime: subscribe to INSERT on `chat_messages` filtered by `thread_id in (user's memberships)`.
- [ ] Encryption-at-rest: Supabase default (AES-256). Optional E2EE deferred post-v1.
- [ ] UI: 1-to-1 DM opens from a user's profile "Message" button; group chat created from the "New group" entry in the feed.

### Task 9.8 — Verified-guide peer-review flow

**Competitor reference:** eBird Expert, iNaturalist Research Grade, Strava KOM.

- [ ] `profiles` columns added:
  - `is_guide boolean default false` (already on roadmap — confirm)
  - `guide_verified_at timestamptz` (null until peer-review granted)
  - `guide_verified_by uuid[]` — array of reviewer IDs (auditable trail)
- [ ] New table:
  ```sql
  create table public.guide_reviews (
    id uuid primary key default uuid_generate_v4(),
    guide_id uuid not null references public.profiles(id) on delete cascade,
    reviewer_id uuid not null references public.profiles(id) on delete cascade,
    rating int not null check (rating between 1 and 5),
    comment text check (char_length(comment) <= 500),
    created_at timestamptz default now(),
    unique (guide_id, reviewer_id)  -- one review per user per guide
  );
  ```
- [ ] Badge criteria: `guide_verified_at = now()` set automatically when:
  - ≥3 distinct reviewers
  - All reviews 5-star
  - Reviewer accounts ≥30 days old (`profiles.created_at`)
  - Reviewer has verified email (`profiles.email_verified_at` not null)
- [ ] Rate limit: 1 review per reviewer per guide per 30 days (upsert semantics).
- [ ] Guide profile page shows:
  - "Verified Guide" badge when criteria met
  - Transparent count: "4 reviews across 18 months, 4.8 avg"
- [ ] Only `is_verified = true` guides surface in the "Recommended Guides" carousel (added to feed tab).

### Task 9.9 — Angler / spot reputation scores

**Competitor reference:** Strava segments, AllTrails ratings, Rippton.

- [ ] Lightweight trust score on profiles (derived, not stored — SQL view):
  ```sql
  create view public.profile_reputation as
  select
    p.id,
    p.username,
    (select count(*) from catches where user_id = p.id and is_hidden = false) as verified_catches,
    (select count(*) from catches where user_id = p.id and flag_count > 0) as flagged_catches,
    case
      when (select count(*) from catches where user_id = p.id) = 0 then 'new'
      when (select count(*) from catches where user_id = p.id and flag_count > 2) * 4
           > (select count(*) from catches where user_id = p.id) then 'low-trust'
      else 'trusted'
    end as reputation_tier
  from public.profiles p;
  ```
- [ ] Subtle badge on profile: "Trusted (120 catches)" or "New angler".
- [ ] Never used to gate features — visible signal only.
- [ ] Low-trust tier adds a note to their posts on the feed ("Account flagged by community — verify independently").

### Task 9.10 — Accessibility audit (cross-cutting)

All new UIs from 9.6–9.9 (trip broadcast, DMs, guide profile, reputation badges) must hit WCAG AA + 44×44 pt targets + `prefers-reduced-motion`.

---

## Phase 9 Acceptance

Core:
- [ ] Unit: like mutation reverts on error
- [ ] Integration: like increments `like_count`; unlike decrements
- [ ] Integration: follow user → their new catch appears in Following feed
- [ ] E2E: comment on catch → comment visible to other users in < 3s (Realtime)
- [ ] E2E: Nearby feed respects 50 km radius and excludes hidden catches

Gap injects:
- [ ] Live trip: two devices → broadcaster shows in viewer map < 5s; trip ends → history purged after 24h
- [ ] DMs + groups: 10+ msg thread lands in < 3s across devices; flag 3× → message hides
- [ ] Verified-guide badge granted only when peer-review criteria pass; upholds bot-farm mitigations
- [ ] Reputation tier visible on profile; low-trust warning renders on feed
- [ ] pgTAP: non-member cannot read DM thread / cannot subscribe to another user's trip channel

Release:
- [ ] Tag `v0.14.0-social`
