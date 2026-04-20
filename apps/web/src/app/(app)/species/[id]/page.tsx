import { createSupabaseServerClient } from '@/lib/auth/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function SpeciesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: species } = await supabase.from('species').select('*').eq('id', id).maybeSingle();

  if (!species) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/species" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Back to Species Guide</Link>
      <h1 className="text-4xl font-bold text-gray-900">{species.common_name}</h1>
      {species.scientific_name && <p className="text-lg text-gray-500 italic mt-1">{species.scientific_name}</p>}
      <span className="inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">{species.category}</span>

      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">VIC Fishing Regulations</h2>
        <dl className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <dt className="text-gray-600">Min. Legal Size</dt>
            <dd className="font-semibold">{species.min_legal_size_mm ? `${species.min_legal_size_mm}mm` : 'No minimum'}</dd>
          </div>
          <div className="flex justify-between py-2 border-b">
            <dt className="text-gray-600">Bag Limit</dt>
            <dd className="font-semibold">{species.bag_limit != null ? species.bag_limit : 'No limit'}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-gray-600">Closed Season</dt>
            <dd className="font-semibold">{species.closed_season_start ? `${species.closed_season_start} – ${species.closed_season_end}` : 'None'}</dd>
          </div>
        </dl>
      </div>

      {species.description && <p className="mt-6 text-gray-700 leading-relaxed">{species.description}</p>}

      <Link
        href={`/report?species=${id}`}
        className="mt-8 block text-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700"
      >
        Log a {species.common_name} catch
      </Link>
    </main>
  );
}
