# BiteMap — Smoke Test Checklist

Run before every release tag. A single P0 failure blocks the tag.

## 1. Sign up + sign in (5 min)

- [ ] Web: sign up with a new email → verification email arrives → confirm → sign in → redirected to /map
- [ ] Mobile: same flow through the Expo dev client
- [ ] Sign out clears all persisted state (try the map — should redirect to sign-in)

## 2. Map + data layers (5 min)

- [ ] Map loads centered on Port Phillip Bay at zoom 9
- [ ] Marine-park polygons render (red, toggleable)
- [ ] POI layer toggleable → 25+ boat ramps visible
- [ ] Pin vs Heatmap toggle switches modes cleanly
- [ ] Empty state shows when DB has zero catches

## 3. Log a catch (5 min)

- [ ] Pick species from /species guide
- [ ] Tap "+ Catch" → form loads with that species pre-filled
- [ ] Submit with privacy=area → pin appears on map within 5s (Realtime)
- [ ] Repeat with privacy=hidden → pin does NOT appear on your own map view
- [ ] Inside a marine park → red warning banner renders

## 4. Tide + weather (3 min)

- [ ] /tide loads with a rising/falling/slack hero
- [ ] Next extreme time + height rendered
- [ ] 48h tide chart draws high/low markers
- [ ] Pressure trend card renders with Δ hPa
- [ ] Swell card renders with period + direction
- [ ] 4 feed-times table renders; active window highlighted

## 5. Profile + bag-limit (3 min)

- [ ] /profile hero + stats render
- [ ] /profile/edit saves username, bio, home state
- [ ] Change home state → reg card on /species/:id updates accordingly
- [ ] Log 4 flathead today → bag-limit counter turns amber; 5th → red

## 6. Social (5 min)

- [ ] /feed "Following" tab loads (empty if not following anyone)
- [ ] /feed "Nearby" tab loads catches within 50 km
- [ ] /catch/:id shows catch detail with like + comment UI
- [ ] Post comment → appears inline
- [ ] Delete own comment → removed
- [ ] Follow another user → their catches appear in Following feed

## 7. Leaderboard (2 min)

- [ ] /leaderboard loads both Overall and Port Phillip tabs
- [ ] Empty state renders when MV hasn't refreshed yet
- [ ] After `select refresh_leaderboards()` → rows appear, ranked by count

## 8. POIs (3 min)

- [ ] Tap a POI circle on map → detail sheet opens
- [ ] Boat ramp below tide threshold → red "Tide below safe threshold" banner
- [ ] Post status pulse → appears in Active reports section
- [ ] Rate 1-5 stars → rating_avg on the POI updates

## 9. Privacy & data retention (2 min)

- [ ] Set a catch to expires_at = now() + 1 minute manually via SQL
- [ ] Wait 61s, refetch /map → row gone
- [ ] Hidden catch owned by User A → invisible from User B's session

## 10. Dark mode + accessibility (5 min)

- [ ] Every screen renders OK in dark mode (iOS + Android system toggle)
- [ ] VoiceOver / TalkBack reads every interactive element
- [ ] Tap targets ≥ 44 pt

## 11. Offline resilience (3 min)

- [ ] Turn airplane mode on after map loads → last-cached state renders
- [ ] Tide screen shows "loading" then error state gracefully
- [ ] Reconnect → data refetches

## 12. Sentry + monitoring (when wired in Phase 11)

- [ ] Throw a synthetic error → appears in Sentry dashboard
- [ ] Log a catch → PostHog event `catch_posted` recorded

---

## P0 / P1 / P2

- **P0** (blocks tag): crashes, data loss, privacy leaks, auth failure
- **P1** (fix before rollout): broken CTA, missing empty state, stale data
- **P2** (track, fix next release): cosmetic, minor a11y, non-blocking UX polish

Capture failures as GitHub issues with reproduction steps. Attach a screenshot + device/OS.
