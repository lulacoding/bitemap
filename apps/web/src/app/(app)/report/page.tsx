'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createCatch,
  getSpeciesById,
  type PrivacyLevel,
} from '@bitemap/shared';

export default function ReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const speciesId = searchParams.get('species');

  const [quantity, setQuantity] = useState('1');
  const [sizeMm, setSizeMm] = useState('');
  const [baitUsed, setBaitUsed] = useState('');
  const [technique, setTechnique] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyLevel>('exact');
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: -38.1, lng: 144.85 }),
    );
  }, []);

  const speciesQuery = useQuery({
    queryKey: ['species', speciesId],
    queryFn: () => (speciesId ? getSpeciesById(speciesId) : null),
    enabled: !!speciesId,
  });

  const mutation = useMutation({
    mutationFn: createCatch,
    onSuccess: () => router.push('/(app)/map'),
    onError: (e: unknown) =>
      setError(e instanceof Error ? e.message : 'Failed to save catch'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!speciesId) {
      setError('Please choose a species first.');
      return;
    }
    if (!coords) {
      setError('Location is required. Please allow location access.');
      return;
    }
    mutation.mutate({
      species_id: speciesId,
      quantity: parseInt(quantity, 10) || 1,
      size_mm: sizeMm ? parseInt(sizeMm, 10) : undefined,
      bait_used: baitUsed || undefined,
      technique: technique || undefined,
      location_name: locationName || undefined,
      lat: coords.lat,
      lng: coords.lng,
      privacy_level: privacy,
    });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Log a catch</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <section className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Species
          </label>
          {speciesQuery.data ? (
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="font-semibold">{speciesQuery.data.common_name}</p>
              {speciesQuery.data.scientific_name && (
                <p className="text-sm italic text-gray-600">
                  {speciesQuery.data.scientific_name}
                </p>
              )}
              <a
                href="/species"
                className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline"
              >
                Change
              </a>
            </div>
          ) : (
            <a
              href="/species"
              className="block rounded-lg border-2 border-dashed border-blue-400 p-4 text-center font-semibold text-blue-600 hover:bg-blue-50"
            >
              Choose species →
            </a>
          )}
        </section>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </Field>
          <Field label="Size (mm)">
            <input
              type="number"
              min={0}
              value={sizeMm}
              onChange={(e) => setSizeMm(e.target.value)}
              placeholder="e.g. 320"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </Field>
        </div>

        <Field label="Bait used">
          <input
            type="text"
            value={baitUsed}
            onChange={(e) => setBaitUsed(e.target.value)}
            placeholder="e.g. pilchard, soft plastic"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </Field>

        <Field label="Technique">
          <input
            type="text"
            value={technique}
            onChange={(e) => setTechnique(e.target.value)}
            placeholder="e.g. bottom fishing, trolling"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </Field>

        <Field label="Location name (optional)">
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Ricketts Point"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </Field>

        <section className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Privacy
          </label>
          <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
            {(['exact', 'area', 'hidden'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrivacy(p)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  privacy === p
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {p === 'exact' ? 'Exact' : p === 'area' ? '~1km area' : 'Hidden'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {privacy === 'exact' && 'Full GPS — others see the precise spot.'}
            {privacy === 'area' && 'Snapped to a ~1km grid cell.'}
            {privacy === 'hidden' && 'Location never shared publicly.'}
          </p>
        </section>

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
          {mutation.isPending ? 'Logging…' : 'Log catch'}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}
