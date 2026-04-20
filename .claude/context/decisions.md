# BiteMap — Architectural Decisions

## 2026-04-20 — Local Supabase for development

**Decision:** Use local Docker Supabase stack for all development. Hosted migration via `supabase link + supabase db push` deferred to Phase 11.

**Why:** Faster iteration, no network dependency, free. Production hosting decision can wait.

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

## Related

- [[./status]] — current phase tracking
- [[./lessons]] — what gets done wrong
