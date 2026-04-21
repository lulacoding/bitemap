'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyProfile,
  updateMyProfile,
  AU_STATES,
  type AuState,
} from '@bitemap/shared';

export default function EditProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [homeState, setHomeState] = useState<AuState>('VIC');
  const [photoBackup, setPhotoBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username ?? '');
    setBio(profile.bio ?? '');
    setLocation(profile.location ?? '');
    setHomeState((profile.home_state as AuState) ?? 'VIC');
    setPhotoBackup(profile.photo_backup_enabled);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      router.push('/profile');
    },
    onError: (e: unknown) => {
      setError(
        e instanceof Error && e.message.toLowerCase().includes('unique')
          ? 'Username taken, try another.'
          : e instanceof Error
            ? e.message
            : 'Could not save profile',
      );
    },
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate({
      username: username.trim(),
      bio: bio.trim(),
      location: location.trim(),
      home_state: homeState,
      photo_backup_enabled: photoBackup,
    });
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Edit profile</h1>

      <form onSubmit={save} className="mt-6 space-y-5">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700">
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="3-24 chars, no spaces"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell other anglers about your style (≤280 chars)"
            maxLength={280}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Williamstown VIC"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700">
            Home state
          </label>
          <div className="flex flex-wrap gap-2">
            {AU_STATES.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => setHomeState(state)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  homeState === state
                    ? 'bg-[#0E5C8A] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Sets which state&apos;s bag limits + closed seasons show on your
            catch reports.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
          <input
            type="checkbox"
            checked={photoBackup}
            onChange={(e) => setPhotoBackup(e.target.checked)}
            className="mt-1 h-5 w-5"
          />
          <div>
            <p className="font-semibold text-gray-900">Back up catch photos</p>
            <p className="text-xs text-gray-500">
              Opt-in. When off, photos are local-only and deleted with the 48h
              catch decay.
            </p>
          </div>
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-[#0E5C8A] py-4 font-bold text-white disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </form>
    </main>
  );
}
