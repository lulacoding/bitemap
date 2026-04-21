'use client';

import { useEffect } from 'react';
import { getMyProfile, supabase } from '@bitemap/shared';
import { initWebPosthog, webPosthogSetOptOut } from '@/telemetry/posthogWeb';

/**
 * Starts PostHog when configured, and mirrors `profiles.analytics_opt_out` after sign-in.
 */
export function PostHogConsent() {
  useEffect(() => {
    initWebPosthog();

    const sync = async () => {
      const { data } = await supabase().auth.getUser();
      if (!data.user) {
        webPosthogSetOptOut(true);
        return;
      }
      const profile = await getMyProfile();
      webPosthogSetOptOut(profile?.analytics_opt_out ?? false);
    };

    void sync();
    const {
      data: { subscription },
    } = supabase().auth.onAuthStateChange(() => {
      void sync();
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
