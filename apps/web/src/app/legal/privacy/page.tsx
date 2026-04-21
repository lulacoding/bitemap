import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy — BiteMap',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-gray-800">
      <p className="text-sm text-gray-500">
        <Link href="/sign-in" className="text-[#0E5C8A]">
          ← Back to sign in
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Privacy policy</h1>
      <p className="mt-2 text-sm text-gray-600">Last updated April 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">What we collect</h2>
        <p>
          Account email and authentication data (via Supabase Auth), profile fields you choose
          (username, bio, location, home state), GPS coordinates and optional photos when you log
          a catch, species and gear metadata, and in-app activity (likes, comments, follows).
        </p>

        <h2 className="text-lg font-semibold">Catch visibility</h2>
        <p>
          Public map pins respect your per-catch privacy setting (exact, area-snapped, or hidden).
          Community-visible catches are designed to age off the public map within 48 hours while
          remaining in your private logbook unless you delete them.
        </p>

        <h2 className="text-lg font-semibold">Third parties</h2>
        <p>
          We use Supabase (database, auth, storage, realtime), Mapbox (maps), Open-Meteo (weather and
          marine data), Sentry (crash reports when configured), and PostHog (optional product
          analytics when enabled and not opted out in your profile). We do not sell your personal
          data.
        </p>

        <h2 className="text-lg font-semibold">Your choices</h2>
        <p>
          You may update or delete profile information in the app, opt out of product analytics in
          profile settings, and request account deletion (which removes your auth record; contact
          support for a full data export if needed).
        </p>

        <p className="text-xs text-gray-500">
          This text is a plain-language summary and is not legal advice. Always follow local fishing
          regulations from the official VFA / state sources.
        </p>
      </section>
    </main>
  );
}
