import { useEffect } from 'react';
import { supabase } from '@bitemap/shared';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Subscribes to INSERTs on the `catches` table via Supabase Realtime.
 * When a new catch lands, invalidates the ['catches'] query so the map refreshes.
 */
export function useCatchSubscription() {
  const qc = useQueryClient();

  useEffect(() => {
    const client = supabase();
    const channel = client
      .channel('catches-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'catches' },
        () => {
          qc.invalidateQueries({ queryKey: ['catches'] });
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [qc]);
}
