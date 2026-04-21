'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getOverallLeaderboard,
  getPortPhillipLeaderboard,
  type LeaderboardRow,
} from '@bitemap/shared';

type Tab = 'overall' | 'port_phillip';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('overall');

  const overall = useQuery({
    queryKey: ['lb', 'overall'],
    queryFn: () => getOverallLeaderboard(50),
    enabled: tab === 'overall',
    staleTime: 5 * 60 * 1000,
  });
  const portPhillip = useQuery({
    queryKey: ['lb', 'port-phillip'],
    queryFn: () => getPortPhillipLeaderboard(50),
    enabled: tab === 'port_phillip',
    staleTime: 5 * 60 * 1000,
  });

  const q = tab === 'overall' ? overall : portPhillip;
  const rows: LeaderboardRow[] = q.data ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Ranked this month · updates every 10 min
      </p>

      <div className="mt-4 flex gap-2">
        {(
          [
            ['overall', 'Overall'],
            ['port_phillip', 'Port Phillip'],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 font-semibold transition ${
              tab === t
                ? 'bg-[#0E5C8A] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <p className="mt-6 text-center text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-xl bg-gray-50 p-8 text-center">
          <p className="font-semibold text-gray-900">Be the first</p>
          <p className="mt-2 text-sm text-gray-600">
            No catches on this board yet this month. Log one and you&apos;ll
            claim the top spot.
          </p>
        </div>
      ) : (
        <ol className="mt-6 divide-y divide-gray-100">
          {rows.map((r, i) => (
            <li key={r.user_id} className="flex items-center gap-3 py-3">
              <span className="w-10 text-lg font-bold text-[#0E5C8A]">
                #{i + 1}
              </span>
              <div>
                <p className="font-semibold text-gray-900">
                  angler-{r.user_id.slice(0, 6)}
                </p>
                <p className="text-xs text-gray-500">
                  {r.catch_count} catch{r.catch_count === 1 ? '' : 'es'}
                  {r.species_count ? ` · ${r.species_count} species` : ''}
                  {r.best_size_mm ? ` · PB ${r.best_size_mm}mm` : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-8 text-center text-xs italic text-gray-400">
        Catches are grouped by user for the current month. Hidden + private
        catches never appear.
      </p>
    </main>
  );
}
