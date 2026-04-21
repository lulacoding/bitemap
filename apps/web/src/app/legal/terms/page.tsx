import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms — BiteMap',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-gray-800">
      <p className="text-sm text-gray-500">
        <Link href="/sign-in" className="text-[#0E5C8A]">
          ← Back to sign in
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Terms of use</h1>
      <p className="mt-2 text-sm text-gray-600">Last updated April 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Community conduct</h2>
        <p>
          Be respectful to other anglers. Harassment, hate speech, doxxing, or posting false catch
          locations to mislead others may result in moderation action up to account suspension.
        </p>

        <h2 className="text-lg font-semibold">Content and accuracy</h2>
        <p>
          Catch reports and species information are user-generated or sourced from public datasets.
          BiteMap is not a substitute for official Victorian Fisheries Authority (VFA) or interstate
          rules — always verify limits, sizes, and closures before fishing.
        </p>

        <h2 className="text-lg font-semibold">Moderation</h2>
        <p>
          We may remove content that violates these terms, poses a safety risk, or infringes law.
          Repeated violations can lead to permanent bans.
        </p>

        <h2 className="text-lg font-semibold">Service availability</h2>
        <p>
          The app is provided as-is. We strive for reliability but do not guarantee uninterrupted
          access. Tide and weather data depend on third-party APIs.
        </p>
      </section>
    </main>
  );
}
