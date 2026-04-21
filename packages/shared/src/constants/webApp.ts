/** Production web host for deep links / legal URLs from mobile (Phase 11). */
const DEFAULT_WEB_APP =
  'https://bitemap-joz2xyiia-lulacodings-projects.vercel.app';

export function getWebAppBaseUrl(): string {
  const a =
    typeof process !== 'undefined'
      ? (process.env.EXPO_PUBLIC_WEB_APP_URL ?? process.env.NEXT_PUBLIC_WEB_APP_URL)
      : undefined;
  const t = a?.trim();
  if (t) return t.replace(/\/$/, '');
  return DEFAULT_WEB_APP;
}
