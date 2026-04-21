# BiteMap — Architectural Decisions

## 2026-04-21 — Phase 11 deferred on infra, not cancelled

**Decision:** Treat Phase 11 (hardening) as **paused** until Vercel, Sentry, and EAS were provisioned; resume once those accounts exist. Phases 12–13 and rc tags proceeded on technical merit; Phase 11 acceptance (videos, hazards, offline tiles, etc.) remains **open work**, not skipped permanently.

**Why:** The plan bundles operator-owned services with large feature injects; blocking all engineering on dashboard clicks was wasteful.

---

## 2026-04-20 — Local Supabase for development

**Decision:** Use local Docker Supabase stack for primary development; **hosted** Supabase optional for dogfooding (link + `db push` when ready).

**Why:** Faster iteration locally; hosted stack for real-device and Vercel preview without tunneling localhost.

---

## 2026-04-20 — Turborepo pnpm monorepo

**Decision:** Single repo with `apps/mobile`, `apps/web`, `packages/shared`, `packages/ui`.

**Why:** Shared types, schemas, query helpers between web and mobile. Single CI pipeline. Design system reusable across platforms.

---

## 2026-04-20 — Version tag resequencing

**Decision:** Phase tags start at v0.6.0 (not v0.1.0) because v0.5.0-design-system was already used.

**Why:** Avoid tag conflicts. Phases 1-11 map to v0.6.0 through v1.0.0.

---

## 2026-04-20 — Zod v4 for runtime validation

**Decision:** Use Zod v4 with `z.uuid()` (not deprecated `z.string().uuid()`).

**Why:** Zod v4 shipped breaking changes. `z.string().uuid()` is deprecated.

---

## 2026-04-20 — Supabase SSR new cookie API

**Decision:** Use `getAll`/`setAll` pattern (not deprecated `get`/`set`/`remove`).

**Why:** @supabase/ssr deprecated the old API. New pattern avoids runtime warnings.

---

## 2026-04-20 — E2E tests deferred to Phase 11

**Decision:** Skip Detox (mobile) and Playwright (web) E2E tests until hardening phase.

**Why:** No blocking value in early phases. Unit tests + pgTAP + typecheck cover correctness. E2E adds complexity without early ROI.

---

---

## 2026-04-20 — Open-Meteo for weather + tide (not BOM / WorldTides)

**Decision:** Use Open-Meteo Marine API + Forecast API for all weather, tide, swell, and pressure data. Defer BOM integration to v0.11.1-enrichment-apis (if needed at all).

**Why:**
- Open-Meteo is **free**, no API key, CORS-enabled — callable directly from mobile + web clients (no Edge Function required).
- Real global data including Port Phillip Bay (sea level, waves, weather, pressure).
- BOM has no public API; would require scraping or an expensive commercial contract.
- WorldTides has a 100 req/day free tier that's easy to exhaust; requires a key and an Edge Function to hide the key.

**Tradeoffs:**
- Open-Meteo data is global physics models, not Australia-specific. For most recreational use this is fine. For safety-critical marine warnings we still defer to BOM (link out).
- BOM marine warnings overlay still planned but deferred (requires Edge Function).

---

## 2026-04-20 — No synthetic / mock scientific data

**Decision:** Every data point shown to the user must come from a real source — an API, a deterministic astronomical calculation, or the user's own database. No generated/fake tide curves, no placeholder weather.

**Why:** Recreational anglers rely on this data to plan trips. Wrong data is worse than no data — it erodes trust fast. Moon-phase math is genuinely deterministic astronomy; everything else hits an API.

**Affects:** Phase 6 rewrite — synthetic tide generator replaced with Open-Meteo Marine fetch. Any future feature must follow this rule.

---

## Related

- [[./status]] — current phase tracking
- [[./lessons]] — what gets done wrong
