import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '../src/auth/AuthProvider';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
