# BiteMap — Lessons & Corrections

Things that get done wrong repeatedly. Check these before writing code.

---

## 1. Zod v4: z.uuid() not z.string().uuid()

**What goes wrong:** Uses `z.string().uuid()` which is deprecated in Zod v4.
**Correct:** `z.uuid()`
**When to check:** Any new Zod schema with UUID fields.

---

## 2. Supabase SSR: getAll/setAll cookie API

**What goes wrong:** Uses old `get`/`set`/`remove` cookie methods from @supabase/ssr.
**Correct:** Use `getAll()`/`setAll()` pattern in middleware and server client.
**When to check:** Any Supabase server client or middleware code.

---

## 3. Next.js 'use server' vs server module

**What goes wrong:** Adds `'use server'` directive to utility modules. Next.js requires 'use server' files to only export async functions.
**Correct:** Only use `'use server'` for Server Actions. Regular server modules don't need it.
**When to check:** Any `apps/web/src/lib/` utility files.

---

## 4. supabase gen types leaks stderr

**What goes wrong:** `supabase gen types typescript --local` prints "Connecting to db 5432" to stdout, corrupting the output file.
**Correct:** Redirect stderr: `supabase gen types typescript --local --schema public 2>/dev/null > database.ts`
**When to check:** The `gen-types` script in `packages/shared/package.json`.

---

## 5. Mobile entry point

**What goes wrong:** Sets `"main": "index.ts"` in mobile package.json.
**Correct:** `"main": "expo-router/entry"` for expo-router apps.
**When to check:** `apps/mobile/package.json`.

---

## Related

- [[./decisions]] — design context for these patterns
- [[./status]] — current phase
