'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMyProfile, getLogbook, supabase } from '@bitemap/shared';

export default function MyProfilePage() {
  const router = useRouter();

  const profile = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const logbook = useQuery({
    queryKey: ['my-logbook', profile.data?.id],
    queryFn: () => (profile.data ? getLogbook(profile.data.id, 100) : []),
    enabled: !!profile.data,
  });

  const signOut = async () => {
    await supabase().auth.signOut();
    router.replace('/sign-in');
  };

  if (profile.isLoading) {
    return <p className="p-8 text-gray-500">Loading…</p>;
  }
  if (!profile.data) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <p className="text-gray-600">Not signed in.</p>
        <Link href="/sign-in" className="mt-4 inline-block text-blue-600">
          Sign in →
        </Link>
      </main>
    );
  }

  const p = profile.data;
  const rows = (logbook.data ?? []) as Array<{
    id: string;
    quantity: number;
    size_mm: number | null;
    created_at: string;
    location_name: string | null;
    privacy_level: string;
    is_hidden: boolean;
  }>;
  const total = rows.length;
  const distinctSpecies = new Set(
    (rows as unknown as Array<{ species_id: string }>).map((r) => r.species_id),
  ).size;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0E5C8A] text-2xl font-bold text-white">
          {(p.username ?? 'Y').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {p.username ?? 'Unnamed angler'}
          </h1>
          {p.location && <p className="text-sm text-gray-500">📍 {p.location}</p>}
          {p.home_state && (
            <p className="text-xs text-gray-500">Home state: {p.home_state}</p>
          )}
          {p.is_guide && p.is_verified && (
            <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
              ✓ Verified Guide
            </span>
          )}
        </div>
      </header>

      {p.bio && <p className="mt-4 text-gray-700">{p.bio}</p>}

      <section className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-50 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">catches</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{distinctSpecies}</p>
          <p className="text-xs text-gray-500">species</p>
        </div>
      </section>

      <section className="mt-6 flex gap-3">
        <Link
          href="/profile/edit"
          className="flex-1 rounded-xl bg-gray-100 py-3 text-center font-semibold text-gray-900 hover:bg-gray-200"
        >
          Edit profile
        </Link>
        <Link
          href="/stats"
          className="flex-1 rounded-xl bg-gray-100 py-3 text-center font-semibold text-gray-900 hover:bg-gray-200"
        >
          Analytics
        </Link>
        <button
          onClick={signOut}
          className="rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-700 hover:bg-red-100"
        >
          Sign out
        </button>
      </section>

      <h2 className="mt-8 text-xs font-bold uppercase tracking-wider text-gray-500">
        Recent logbook
      </h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm italic text-gray-500">
          No catches logged yet.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100">
          {rows.slice(0, 20).map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold">
                  {c.quantity}× catch
                  {c.size_mm ? ` · ${c.size_mm}mm` : ''}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(c.created_at).toLocaleString()}
                  {c.location_name ? ` · ${c.location_name}` : ''}
                </p>
              </div>
              {(c.is_hidden || c.privacy_level === 'hidden') && (
                <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
                  {c.is_hidden ? 'hidden' : 'private'}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
