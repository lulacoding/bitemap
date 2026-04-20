# BiteMap — Design Specification

**Date:** 2026-04-20  
**Status:** Design approved, ready for implementation planning  
**App Name:** BiteMap  
**Tagline:** "Real-time fishing reports, by the community, for the community. Free forever."

---

## Context

BiteMap is a Waze-style crowdsourced fishing activity tracker. Fishers report what species are biting, where, what bait is working, and conditions — so others can benefit in real time. 100% free, built out of love for the fishing community. No paywalls, no feature gates.

**Competitive insight:** Fishbrain (15M users) is widely hated for aggressive paywalls that make the core app "virtually unusable." Being genuinely free is BiteMap's single biggest competitive advantage.

**Scope:** Launch for Port Phillip Bay / Australia first. Architecture designed to scale globally.

---

## Architecture

**Approach:** Turborepo Monorepo — Direct Supabase

```
bitemap/
├── apps/
│   ├── mobile/          (Expo React Native — iOS + Android)
│   └── web/             (Next.js 14 — web app + admin)
├── packages/
│   ├── shared/          (TypeScript types, Supabase client, utils, validation)
│   └── ui/              (shared React components — NativeWind on mobile, Tailwind on web)
└── supabase/
    ├── migrations/      (Postgres schema)
    └── functions/       (Deno Edge Functions — AI forecasts, notifications, decay jobs)
```

**Stack:**
- **Mobile:** Expo (React Native), NativeWind, Expo Router, Mapbox React Native SDK
- **Web:** Next.js 14, Tailwind CSS, Mapbox GL JS
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage, Edge Functions)
- **Maps:** Mapbox (heatmaps, custom styling, generous free tier)
- **Weather/Tide:** BOM API (Australian Bureau of Meteorology) + WorldTides API
- **AI Fish ID:** Claude claude-sonnet-4-6 Vision (optional, on-demand)
- **AI Forecast:** Claude claude-sonnet-4-6 (learns from community catch pattern data)
- **Push notifications:** Expo Push Notifications + Supabase triggers
- **Catch cards:** Satori (server-side image generation for social sharing)

---

## Database Schema (Supabase / Postgres)

### Core tables

```sql
-- Users
profiles (id, username, avatar_url, bio, location, is_guide, is_verified, created_at)

-- Species
species (id, common_name, scientific_name, category, min_legal_size_mm, bag_limit, 
         closed_season_start, closed_season_end, state, image_url, description)

-- Catches (the core report)
catches (
  id, user_id, species_id,
  quantity, size_mm,             -- how many, how big
  bait_used, technique,          -- what worked
  lat, lng, location_name,       -- where
  privacy_level,                 -- 'exact' | 'area' | 'hidden'
  photo_url,                     -- optional photo
  weather_json,                  -- auto-attached: temp, wind, pressure, cloud
  tide_json,                     -- auto-attached: tide height, state (incoming/outgoing)
  moon_phase, solunar_rating,    -- moon + solunar feeding score
  flag_count,                    -- community moderation
  is_hidden,                     -- admin can hide
  expires_at,                    -- 48 hours from created_at
  created_at
)

-- Saved spots (private)
saved_spots (id, user_id, name, lat, lng, notes, created_at)

-- Tackle shops / POIs
poi (id, name, type, lat, lng, address, phone, website, verified, created_at)

-- Social
catch_likes (catch_id, user_id, created_at)
catch_comments (id, catch_id, user_id, body, created_at)
follows (follower_id, following_id, created_at)

-- Gamification
user_achievements (id, user_id, achievement_key, earned_at)
user_streaks (user_id, current_streak, longest_streak, last_fish_date)
seasonal_tournaments (id, name, species_id, start_date, end_date, scoring_method)
tournament_entries (tournament_id, user_id, catch_id, score)
```

---

## Features

### 1. Map (Home Screen)
- **Default:** Map-first. Fullscreen Mapbox map with catch pins.
- **Toggle:** Heatmap mode ↔ Individual pins mode
- **Pins:** Coloured by species category (saltwater, freshwater, etc.)
- **Decay:** Pins fade after 48 hours automatically
- **Filter bar:** By species, bait, technique, freshness (6h / 24h / 48h)
- **Layers:** Toggle tackle shops / POIs on/off
- **Anonymous:** Anyone can view the map without logging in

### 2. Catch Reporting (3-tap flow)
1. Tap "+" → Select species (search or AI photo ID)
2. Enter: quantity, size, bait, technique
3. Auto-attached: GPS, weather, tide, moon phase, solunar — confirm and post

**Privacy per report:** Exact GPS / General area / Hidden from map

### 3. User Accounts + Profiles
- Sign up via email or Google (Supabase Auth)
- Public profile: username, avatar, bio, total catch count, species caught, badges
- Private logbook: full personal stats, size records, streak history
- Follow other fishers

### 4. Species Database
- ~100 curated Australian fish species to start
- Per species: photo, description, habitat, min legal size, bag limit, closed seasons (by state)
- Users can suggest new species (admin reviews)
- Optional: Claude Vision AI identification from uploaded photo

### 5. Tide Charts + Weather
- Standalone tide view: tide chart for next 7 days at nearest tidal station
- Moon phase + solunar feeding peak times (best 2 periods per day)
- BOM weather: wind speed/direction, air temp, pressure, rainfall
- All auto-attached to catch reports at time of posting

### 6. Social Layer
- Activity feed (secondary tab): recent catches from followed users + nearby activity
- Likes / kudos on reports
- Comments on reports
- Follow/unfollow anglers
- Leaderboards: by species, by area, by season

### 7. Gamification
- **Badges & achievements:** First catch, Night fisher, 100 reports, Species collector, Tide master (caught fish on high tide), etc.
- **Species Pokédex:** Visual collection — tick off every species you've caught. % completion shown on profile.
- **Streaks:** Days fished in a row. Longest streak shown on profile.
- **Seasonal tournaments:** Monthly/seasonal community competitions. E.g. "October Snapper Challenge" — most snapper caught. Leaderboard + winner announced.

### 8. Notifications (user-configurable, all opt-in)
- "Species biting near you" — push when recent catches < 5km away
- Followed user posted a catch
- Tournament starting / ending soon
- Streak reminder ("You haven't fished in 2 days — keep your streak!")
- Regulation reminders (e.g. snapper season closing this week)

### 9. AI-Powered Fishing Forecast
- "Based on community reports, snapper bite best at this spot on incoming tide in Autumn between 5–8am"
- Powered by Claude analysing historical catch data for a given location + conditions
- Shown per species per location as a "Community Intelligence" card
- Surfaces after enough data points exist for a spot (minimum threshold: 20 catches)

### 10. Shareable Catch Cards
- Auto-generated image card: species photo, catch details, BiteMap branding, map thumbnail
- Share to Instagram, TikTok, Facebook with one tap
- Generated server-side (Satori / Supabase Edge Function)

### 11. Tackle Shop / POI Finder
- Map layer: nearby bait shops, tackle stores, boat ramps, fishing jetties
- Each POI: name, address, phone, website, hours, user ratings/reviews
- Curated by admin + community submissions

### 12. Verified Guide Profiles
- Fishing guides / charter operators can apply for "Guide" badge
- Verified badge shown on profile + pins on map
- Builds trust + potential future sponsorship angle

### 13. Privacy + Moderation
- 3-tier privacy per report: Exact GPS / Area only / Hidden
- Community flag button on every report
- Admin dashboard: review flagged reports, hide/remove, ban users
- Auto-hide if flag_count > 10

### 14. Admin Dashboard (Next.js web)
- View flagged reports queue
- Manage species database (add, edit, approve user suggestions)
- App stats: DAU, reports today, top species, top locations
- Manage tournaments
- Ban/unban users

---

## Sustainability Model
- **Self-funded passion project** — hosting costs minimal on Supabase free/pro tier
- **Optional donations** — "Buy me a coffee" link in app settings
- **Fishing brand sponsorships** — branded POI pins (e.g. "Complements of [TackleCo]"), sponsor a tournament
- **Premium cosmetic tier** — custom profile themes, animated badge frames, no feature gates ever

---

## v1 MVP Scope (Phase 1)

Must ship in v1:
1. Map + catch reporting (core loop)
2. User accounts + profiles
3. Species database with Australian regulations
4. Auto-attached tide + weather on reports
5. 3-tier privacy per report
6. Community likes + comments
7. Basic leaderboard
8. Offline report queue

Post-MVP (Phase 2+):
- Gamification (badges, Pokédex, streaks, tournaments)
- AI forecast
- Shareable catch cards
- Verified guide profiles
- Tackle shop POI layer
- Notifications
- Admin dashboard

---

## Key Risks + Mitigations

| Risk | Mitigation |
|------|------------|
| Cold start (no data) | Pre-populate Port Phillip Bay with seed data; invite local fishing Facebook groups |
| Fake/troll reports | Community flagging + admin review; flag_count auto-hide threshold |
| API costs (BOM, WorldTides, Claude) | Cache weather/tide per location per hour; AI only on-demand |
| Mapbox costs at scale | Mapbox free tier generous (50K loads/month); upgrade if needed |
| Location privacy concerns | 3-tier privacy is default; exact GPS never shared without explicit user consent |

---

## Verification Plan

Before calling v1 complete:
1. Post a catch report on mobile — verify pin appears on map within 5 seconds (Supabase Realtime)
2. Post with "area only" privacy — verify exact GPS is not exposed in API response
3. Report expires: create a catch with `expires_at = now() + 1 minute`, verify it disappears from map
4. Anonymous user: verify map is readable without logging in; verify "+" button requires auth
5. Offline: disable network, create report, re-enable, verify it syncs automatically
6. Species regulation: tap a species, verify correct legal size + bag limit displays for VIC
7. Tide chart: open tide view, verify tide data loads for user's nearest tidal station
