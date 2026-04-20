# BiteMap Phase 10.5 — Citizen Science (Optional)

**Tag:** `v0.15.25-citizen-science` (optional, only if earned traction from phases 9–10)

**Purpose:** Bundle rare-catch alerts, expert verification, research export, and seasonal/breeding data into a formal citizen-science offering. Positions BiteMap for research partnerships (VFA, Museums Victoria, university fisheries programs) without drifting from the free-forever principle.

**Scope decision criteria before launching this phase:**
- ≥ 2,000 active users contributing catches
- ≥ 100 distinct experts (hand-granted or community-elected from Phase 10)
- At least one verbal partnership expression from VFA or a university group

If none of those by post-Phase 10, defer this phase indefinitely and fold individual items into later phases organically.

---

## Task 10.5.1 — Seasonal spawning + breeding-condition data layer

**Source:** competitor-gap backlog Phase 10.5 bullet 1.

- [ ] `species.breeding_window_start date`, `breeding_window_end date` — backfilled from VFA / Museums Vic references.
- [ ] Catch report: when a user attempts to log a species during its breeding window, show a non-blocking info banner:
  > "Bream are spawning Aug–Nov. Low-stress handling and catch-and-release recommended. [Handling guide →]"
- [ ] Catch row persists the banner-acknowledgment (`handling_aware boolean`) for research export correlation.
- [ ] Species detail renders the breeding window as a calendar band.

## Task 10.5.2 — Anonymised research export endpoint

**Source:** competitor-gap backlog Phase 10.5 bullet 2.

- [ ] New Edge Function `research-export`:
  - Requires a `Research-API-Key` header, issued by an operator to approved partners
  - Accepts a date range + region bbox
  - Returns a ZIP of CSVs, one per species, with PII stripped:
    - No `user_id`, no `photo_url`, no `location_name`
    - Coordinates rounded to 2 decimal places (~1 km)
    - All standard enrichment columns (tide, weather, moon, solunar, pressure)
- [ ] RLS: only the operator service role can read the raw rows; the function does PII stripping before returning.
- [ ] Partner agreement template filed at `docs/research/data-use-agreement.md`. Signed before any key issued.

## Task 10.5.3 — Indigenous knowledge layer (co-designed)

**Source:** competitor-gap backlog Phase 10.5 bullet 3.

**This item is partnership-driven, not a unilateral build.** Do not ship without formal engagement.

- [ ] Open dialogue with VFA's Aboriginal-engagement team + a Kulin Nation cultural representative (Port Phillip = Kulin Country).
- [ ] Agree on scope: which species, which cultural/ecological context is appropriate to surface publicly, protocols around sacred knowledge.
- [ ] Implementation (once scope agreed): species detail gains a "Cultural + Ecological Context" card authored by the partnership group. Opt-in to surface globally (off by default until community-tested).
- [ ] Attribution visible + editable by the partnership. Never presumptuous.

**If no partnership materialises within 6 months of Phase 10.5 start, close this task and document why.**

---

## Phase 10.5 Acceptance

- [ ] Breeding-window banner renders in catch report during active windows
- [ ] Research export endpoint works end-to-end with test API key; PII-strip verified; ZIP downloads
- [ ] Indigenous knowledge scope agreed in writing with partnership (or task closed with rationale)
- [ ] Tag `v0.15.25-citizen-science`

---

## Why optional?

BiteMap's free-forever principle means every byte of engineering has to earn its place. Citizen science is compelling but if the core product isn't retaining users, this phase burns energy that belongs in retention + polish. The criteria above force a genuine product-market-fit gate before it ships.
