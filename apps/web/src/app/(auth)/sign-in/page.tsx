'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@bitemap/shared';
import { initWebPosthog, webCapture } from '@/telemetry/posthogWeb';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { error: err } = await supabase().auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); return; }
    initWebPosthog();
    webCapture('sign_in', { method: 'password' });
    router.replace('/');
  };

  const handleGoogle = async () => {
    await supabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSignIn} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-bold">Sign in to BiteMap</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="rounded border px-3 py-2" required
        />
        <input
          type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="rounded border px-3 py-2" required
        />
        <button type="submit" className="rounded bg-[#0E5C8A] py-2 text-white">Sign in</button>
        <button type="button" onClick={handleGoogle} className="rounded border py-2">Continue with Google</button>
        <a href="/sign-up" className="text-center text-sm text-[#0E5C8A]">No account? Sign up →</a>
        <p className="text-center text-xs text-gray-500">
          <Link className="text-[#0E5C8A]" href="/legal/privacy">Privacy</Link>
          {' · '}
          <Link className="text-[#0E5C8A]" href="/legal/terms">Terms</Link>
        </p>
      </form>
    </main>
  );
}
