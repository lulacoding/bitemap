'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@bitemap/shared';

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
      </form>
    </main>
  );
}
