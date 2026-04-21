import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '../src/auth/AuthProvider';
import { initMobileSentry } from '../src/observability/sentry';
import { MaybePostHog } from '../src/telemetry/MaybePostHog';

initMobileSentry();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <MaybePostHog>
          <AuthProvider>
            <Slot />
          </AuthProvider>
        </MaybePostHog>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
