import type { ReactNode } from 'react';
import { PostHogProvider } from 'posthog-react-native';
import { PostHogMount } from './PostHogMount';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host =
  process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';

export function MaybePostHog({ children }: { children: ReactNode }) {
  if (!apiKey) return <>{children}</>;
  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{ host }}
      autocapture={false}
    >
      <PostHogMount />
      {children}
    </PostHogProvider>
  );
}
