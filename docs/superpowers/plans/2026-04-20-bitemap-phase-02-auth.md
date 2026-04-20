# BiteMap Phase 2 — Auth (Detailed TDD Plan)

**Goal:** Email + Google auth on mobile + web, session persistence, auth-gated routes, `profiles` row created on signup (trigger from Phase 1).

**Tech Stack:** `@supabase/supabase-js` v2, `@supabase/ssr` (web), `expo-auth-session`, `expo-secure-store`, Expo Router, Next.js middleware.

---

## File Structure

```
packages/shared/src/supabase/
├── browser.ts           (singleton browser/mobile client)
├── server.ts            (Next.js server-side client)
└── middleware.ts        (Next.js session refresh helper)

apps/mobile/
├── app/
│   ├── _layout.tsx      (auth provider)
│   ├── (auth)/_layout.tsx
│   ├── (auth)/sign-in.tsx
│   ├── (auth)/sign-up.tsx
│   └── (app)/
│       ├── _layout.tsx  (auth guard)
│       └── index.tsx    (home placeholder)
├── src/auth/
│   ├── AuthProvider.tsx
│   ├── useAuth.ts
│   └── googleSignIn.ts

apps/web/src/
├── middleware.ts
├── app/
│   ├── layout.tsx
│   ├── (auth)/sign-in/page.tsx
│   ├── (auth)/sign-up/page.tsx
│   └── (app)/page.tsx
└── lib/auth/server.ts
```

---

## Task 2.1 — Supabase Client Singletons

- [ ] **Step 1: Test `browser.ts`**

```ts
import { supabase } from './browser';
test('browser client is singleton', () => {
  const a = supabase();
  const b = supabase();
  expect(a).toBe(b);
});
```

- [ ] **Step 2: FAIL → Implement**

```ts
// packages/shared/src/supabase/browser.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

let _client: SupabaseClient<Database> | null = null;
export function supabase(): SupabaseClient<Database> {
  if (_client) return _client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  _client = createClient<Database>(url, key, {
    auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
  });
  return _client;
}
```

- [ ] **Step 3: PASS + commit**

---

## Task 2.2 — Mobile: Expo SecureStore persistence

- [ ] Create `apps/mobile/src/supabase/secureStorage.ts` implementing `@supabase/supabase-js` `Storage` interface backed by `expo-secure-store`.
- [ ] Inject into browser client factory when running in RN (detect via `typeof window === 'undefined' || navigator.product === 'ReactNative'`).
- [ ] Test via RN Jest: write → read → delete.

---

## Task 2.3 — Mobile: `AuthProvider` + `useAuth`

- [ ] **Step 1: Test hook**

```tsx
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from './AuthProvider';
test('unauthenticated by default', () => {
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  expect(result.current.session).toBeNull();
});
```

- [ ] **Step 2: Implement**

```tsx
// AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@bitemap/shared/supabase/browser';

const Ctx = createContext<{ session: Session | null; loading: boolean } | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return <Ctx.Provider value={{ session, loading }}>{children}</Ctx.Provider>;
}
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('wrap with AuthProvider'); return c; };
```

---

## Task 2.4 — Mobile: Sign-in / Sign-up screens (Expo Router)

- [ ] Install `expo-router` if not already.
- [ ] `app/(auth)/sign-in.tsx` — Input email, Input password, Button "Sign in", Button ghost "Sign up →", Button "Continue with Google" (Task 2.5).

```tsx
import { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '@bitemap/ui';
import { supabase } from '@bitemap/shared/supabase/browser';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const r = useRouter();
  const submit = async () => {
    const { error } = await supabase().auth.signInWithPassword({ email, password: pw });
    if (error) Alert.alert('Sign-in failed', error.message);
    else r.replace('/(app)');
  };
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Input label="Email" value={email} onChange={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Input label="Password" value={pw} onChange={setPw} secureTextEntry />
      <Button onPress={submit}>Sign in</Button>
    </View>
  );
}
```

- [ ] Similar `sign-up.tsx` — calls `supabase().auth.signUp`; on success routes to `/(app)`.

- [ ] `app/(app)/_layout.tsx` — Redirect to `/(auth)/sign-in` if no session.

```tsx
import { Redirect, Slot } from 'expo-router';
import { useAuth } from '@/src/auth/AuthProvider';
export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  return <Slot />;
}
```

---

## Task 2.5 — Google OAuth (Mobile)

- [ ] Install `expo-auth-session`, `expo-crypto`, `expo-web-browser`.
- [ ] Configure Google OAuth in Supabase Dashboard (redirect URI = Expo proxy).
- [ ] `googleSignIn.ts`:

```ts
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@bitemap/shared/supabase/browser';

export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'bitemap' });
  const { data, error } = await supabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('No OAuth URL');
  const result = await AuthSession.startAsync({ authUrl: data.url });
  if (result.type === 'success' && result.url) {
    await supabase().auth.exchangeCodeForSession(result.url);
  }
}
```

- [ ] E2E: Detox launches, taps Google, fake-webview completes flow, profile row exists.

---

## Task 2.6 — Web: `@supabase/ssr` setup

- [ ] Install `@supabase/ssr`.

- [ ] `apps/web/src/lib/auth/server.ts`:

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@bitemap/shared/types/database';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o: CookieOptions) => { try { cookieStore.set({ name: n, value: v, ...o }); } catch {} },
        remove: (n, o: CookieOptions) => { try { cookieStore.set({ name: n, value: '', ...o }); } catch {} },
      },
    },
  );
}
```

- [ ] `apps/web/src/middleware.ts` — refresh session on every request, redirect `/(app)/*` to `/sign-in` if no session.

```ts
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: (n) => req.cookies.get(n)?.value,
      set: (n, v, o) => res.cookies.set({ name: n, value: v, ...o }),
      remove: (n, o) => res.cookies.set({ name: n, value: '', ...o }),
    },
  });
  const { data: { session } } = await sb.auth.getSession();
  const isApp = req.nextUrl.pathname.startsWith('/(app)');
  if (isApp && !session) return NextResponse.redirect(new URL('/sign-in', req.url));
  return res;
}
export const config = { matcher: ['/((?!_next/|api/|static/).*)'] };
```

---

## Task 2.7 — Web: Sign-in / Sign-up pages (parity)

- [ ] `apps/web/src/app/(auth)/sign-in/page.tsx` — client component with email/password + Google.
- [ ] Sign-up parity.
- [ ] Home `/(app)/page.tsx` — reads session server-side and greets user.

---

## Task 2.8 — E2E

- [ ] **Detox (mobile)**:
  1. Launch app → routed to `/(auth)/sign-in`
  2. Sign up with fresh email → lands on `/(app)`
  3. Kill and relaunch → still on `/(app)` (session persisted)
  4. Sign out → routed back to `/(auth)/sign-in`

- [ ] **Playwright (web)**:
  - Same four scenarios, plus verify middleware redirect on direct `/profile` hit without session.

- [ ] **Integration**: after signup, query `profiles` → row exists with auto-generated username.

---

## Phase 2 Acceptance

- [ ] Mobile: email signup + login + Google OAuth works; session persists across kills
- [ ] Web: same via Next.js middleware
- [ ] Profile row auto-created on signup (unit + integration test)
- [ ] Detox + Playwright E2E suites green in CI
- [ ] Tag `v0.2.0-auth`

**If all pass → proceed to Phase 3.**
