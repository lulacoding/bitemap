import { createSupabaseServerClient } from '@/lib/auth/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [
    { data: species },
    { data: regs },
    { data: rarity },
  ] = await Promise.all([
    supabase.from('species').select('*').eq('id', id).maybeSingle(),
    supabase.from('species_regulations').select('*').eq('species_id', id).order('state'),
    supabase
      .from('species_rarity')
      .select('*')
      .eq('species_id', id)
      .eq('region', 'port_phillip')
      .maybeSingle(),
  ]);

  if (!species) notFound();

  const regulations = regs ?? [];

  const RARITY_CLASS: Record<string, string> = {
    common: 'bg-gray-100 text-gray-700',
    uncommon: 'bg-blue-100 text-blue-700',
    rare: 'bg-orange-100 text-orange-700',
    extraordinary: 'bg-red-100 text-red-700',
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/species"
        className="mb-4 inline-block text-sm text-blue-600 hover:underline"
      >
        ← Back to Species Guide
      </Link>
      <h1 className="text-4xl font-bold text-gray-900">{species.common_name}</h1>
      {species.scientific_name && (
        <p className="mt-1 text-lg italic text-gray-500">
          {species.scientific_name}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {species.category}
        </span>
        {rarity && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              RARITY_CLASS[rarity.rarity_tier] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {rarity.rarity_tier} · {rarity.catch_count_90d} in 90d
          </span>
        )}
        {species.family && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            Family: {species.family}
          </span>
        )}
        {species.iucn_status && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            IUCN: {species.iucn_status}
          </span>
        )}
      </div>

      <div className="mt-8 rounded-xl bg-gray-50 p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
          VIC Fishing Regulations
        </h2>
        <dl className="space-y-3">
          <div className="flex justify-between border-b py-2">
            <dt className="text-gray-600">Min. Legal Size</dt>
            <dd className="font-semibold">
              {species.min_legal_size_mm
                ? `${species.min_legal_size_mm}mm`
                : 'No minimum'}
            </dd>
          </div>
          <div className="flex justify-between border-b py-2">
            <dt className="text-gray-600">Bag Limit</dt>
            <dd className="font-semibold">
              {species.bag_limit != null ? species.bag_limit : 'No limit'}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-gray-600">Closed Season</dt>
            <dd className="font-semibold">
              {species.closed_season_start
                ? `${species.closed_season_start} – ${species.closed_season_end}`
                : 'None'}
            </dd>
          </div>
        </dl>
      </div>

      {regulations.length > 1 && (
        <div className="mt-4 rounded-xl bg-gray-50 p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Cross-state comparison
          </h2>
          <dl className="space-y-2">
            {regulations.map((r) => (
              <div key={r.state} className="flex justify-between py-1 text-sm">
                <dt className="font-bold text-[#0E5C8A]">{r.state}</dt>
                <dd className="text-gray-700">
                  {r.min_legal_size_mm ? `${r.min_legal_size_mm}mm` : 'no min'}
                  {' · '}
                  {r.bag_limit != null ? `bag ${r.bag_limit}` : 'no bag'}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs italic text-gray-400">
            Check the relevant state fisheries authority before releasing. This
            is a guide, not legal advice.
          </p>
        </div>
      )}

      {species.description && (
        <p className="mt-6 leading-relaxed text-gray-700">
          {species.description}
        </p>
      )}

      <Link
        href={`/report?species=${id}`}
        className="mt-8 block rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white hover:bg-blue-700"
      >
        Log a {species.common_name} catch
      </Link>
    </main>
  );
}
