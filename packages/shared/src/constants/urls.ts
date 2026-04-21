/** Production web app (Vercel). Override per environment for previews. */
export const DEFAULT_WEB_APP_URL =
  'https://bitemap-joz2xyiia-lulacodings-projects.vercel.app';

/** Base URL for legal pages and in-app “open in browser” links. */
export function webAppBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WEB_APP_URL) {
    return process.env.NEXT_PUBLIC_WEB_APP_URL.replace(/\/$/, '');
  }
  if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_WEB_APP_URL) {
    return process.env.EXPO_PUBLIC_WEB_APP_URL.replace(/\/$/, '');
  }
  return DEFAULT_WEB_APP_URL;
}
