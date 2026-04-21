'use client';

import posthog from 'posthog-js';

let started = false;

export function initWebPosthog(): void {
  if (typeof window === 'undefined' || started) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    persistence: 'localStorage',
  });
  started = true;
}

export function webCapture(
  event: string,
  props?: Record<string, unknown>,
): void {
  if (!started || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, props);
}

export function webPosthogSetOptOut(optOut: boolean): void {
  if (!started || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if (optOut) posthog.opt_out_capturing();
  else posthog.opt_in_capturing();
}
