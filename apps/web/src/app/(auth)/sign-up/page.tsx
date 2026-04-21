'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@bitemap/shared';
import { initWebPosthog, webCapture } from '@/telemetry/posthogWeb';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    const { error: err } = await supabase().auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (err) { setError(err.message); return; }
    initWebPosthog();
    webCapture('sign_up', { email_domain: email.split('@')[1] ?? 'unknown' });
    setMessage('Check your email to confirm your account.');
    setTimeout(() => router.replace('/sign-in'), 3000);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSignUp} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-bold">Create BiteMap account</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-700 text-sm">{message}</p>}
        <input
          type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="rounded border px-3 py-2" required
        />
        <input
          type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)}
          className="rounded border px-3 py-2" minLength={6} required
        />
        <button type="submit" className="rounded bg-[#0E5C8A] py-2 text-white">Create account</button>
        <a href="/sign-in" className="text-center text-sm text-[#0E5C8A]">Already have an account? Sign in</a>
        <p className="text-center text-xs text-gray-500">
          <Link className="text-[#0E5C8A]" href="/legal/privacy">Privacy</Link>
          {' · '}
          <Link className="text-[#0E5C8A]" href="/legal/terms">Terms</Link>
        </p>
      </form>
    </main>
  );
}
