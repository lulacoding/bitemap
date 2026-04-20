'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getMyStats,
  getMySpeciesBreakdown,
  getMyMonthlyCounts,
} from '@bitemap/shared';

export default function StatsPage() {
  const stats = useQuery({ queryKey: ['my-stats'], queryFn: getMyStats });
  const breakdown = useQuery({
    queryKey: ['my-species-breakdown'],
    queryFn: getMySpeciesBreakdown,
  });
  const monthly = useQuery({
    queryKey: ['my-monthly-counts'],
    queryFn: getMyMonthlyCounts,
  });

  const maxMonth = Math.max(1, ...(monthly.data ?? []).map((m) => m.count));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Your analytics</h1>

      <section className="mt-6 grid grid-cols-3 gap-4">
        <Hero label="Total catches" value={stats.data?.total_catches ?? 0} />
        <Hero
          label="Distinct species"
          value={stats.data?.distinct_species ?? 0}
        />
        <Hero label="This month" value={stats.data?.catches_this_month ?? 0} />
      </section>

      <h2 className="mt-10 text-xs font-bold uppercase tracking-wider text-gray-500">
        By species
      </h2>
      {breakdown.data && breakdown.data.length > 0 ? (
        <ul className="mt-2 divide-y divide-gray-100">
          {breakdown.data.slice(0, 10).map((b) => (
            <li
              key={b.species_id}
              className="flex justify-between py-2 text-sm"
            >
              <span className="font-semibold text-gray-900">{b.common_name}</span>
              <span className="text-gray-600">
                {b.count}×{b.best_size_mm ? ` · PB ${b.best_size_mm}mm` : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 italic text-gray-500">No catches logged yet.</p>
      )}

      <h2 className="mt-10 text-xs font-bold uppercase tracking-wider text-gray-500">
        Last 12 months
      </h2>
      {monthly.data && monthly.data.length > 0 ? (
        <div className="mt-2 flex h-36 items-end gap-2 rounded-xl bg-gray-50 p-4">
          {monthly.data.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-t bg-[#0E5C8A]"
                style={{
                  height: `${Math.max(4, (m.count / maxMonth) * 100)}px`,
                }}
              />
              <p className="mt-1 text-[10px] text-gray-500">
                {m.month.slice(5)}/{m.month.slice(2, 4)}
              </p>
              <p className="text-[11px] font-bold text-gray-900">{m.count}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 italic text-gray-500">No catches logged yet.</p>
      )}

      <p className="mt-10 text-center text-xs italic text-gray-400">
        CSV export + correlation insights ship later in this release cycle.
      </p>
    </main>
  );
}

function Hero({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-blue-50 p-4 text-center">
      <p className="text-4xl font-bold text-[#0E5C8A]">{value}</p>
      <p className="mt-1 text-xs text-gray-600">{label}</p>
    </div>
  );
}
