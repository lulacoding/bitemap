'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  getFollowingFeed,
  getNearbyFeed,
  PORT_PHILLIP_BAY_CENTER,
  type FeedItem,
} from '@bitemap/shared';

type Tab = 'following' | 'nearby';

export default function FeedPage() {
  const [tab, setTab] = useState<Tab>('following');
  const [coords, setCoords] = useState<[number, number]>([
    PORT_PHILLIP_BAY_CENTER[1],
    PORT_PHILLIP_BAY_CENTER[0],
  ]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords([pos.coords.latitude, pos.coords.longitude]),
      () => {},
    );
  }, []);

  const [lat, lng] = coords;

  const following = useQuery({
    queryKey: ['feed', 'following'],
    queryFn: () => getFollowingFeed(40),
    enabled: tab === 'following',
    refetchInterval: 60 * 1000,
  });

  const nearby = useQuery({
    queryKey: ['feed', 'nearby', lat.toFixed(2), lng.toFixed(2)],
    queryFn: () => getNearbyFeed(lat, lng, 50, 40),
    enabled: tab === 'nearby',
    refetchInterval: 60 * 1000,
  });

  const active = tab === 'following' ? following : nearby;
  const data = (active.data ?? []) as FeedItem[];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Activity feed</h1>

      <div className="mt-4 flex gap-2">
        {(['following', 'nearby'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 font-semibold transition ${
              tab === t
                ? 'bg-[#0E5C8A] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t === 'following' ? 'Following' : 'Nearby (50km)'}
          </button>
        ))}
      </div>

      {active.isLoading ? (
        <p className="mt-6 text-center text-gray-500">Loading…</p>
      ) : data.length === 0 ? (
        <div className="mt-10 rounded-xl bg-gray-50 p-8 text-center">
          <p className="font-semibold text-gray-900">
            {tab === 'following'
              ? 'Follow some anglers'
              : 'No catches nearby yet'}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {tab === 'following'
              ? "Tap a pin on the map, view a profile, and follow — their catches land here."
              : 'Be the first to log one.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((item) => (
            <li key={item.id}>
              <Link
                href={`/catch/${item.id}`}
                className="block rounded-xl bg-gray-50 p-4 hover:bg-gray-100"
              >
                <div className="flex justify-between">
                  <p className="font-semibold text-gray-900">
                    {item.quantity}× catch
                    {item.size_mm ? ` · ${item.size_mm}mm` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {timeAgo(item.created_at)}
                  </p>
                </div>
                {item.location_name && (
                  <p className="mt-1 text-sm text-gray-600">
                    📍 {item.location_name}
                  </p>
                )}
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>♥ {item.like_count}</span>
                  <span>💬 {item.comment_count}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
