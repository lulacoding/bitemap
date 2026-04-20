import { createSupabaseServerClient } from '@/lib/auth/server';
import Link from 'next/link';

export default async function SpeciesPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('species').select('*').order('common_name');
  const species = data ?? [];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Species Guide</h1>
      <div className="grid gap-3">
        {species.map((s) => (
          <Link
            key={s.id}
            href={`/species/${s.id}`}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
          >
            <div>
              <p className="font-semibold text-gray-900">{s.common_name}</p>
              {s.scientific_name && <p className="text-sm text-gray-500 italic">{s.scientific_name}</p>}
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">{s.category}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
