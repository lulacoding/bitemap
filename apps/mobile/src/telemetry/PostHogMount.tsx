import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import { useQuery } from '@tanstack/react-query';
import { getMyProfile, supabase } from '@bitemap/shared';
import { setMobileProductCapture } from './mobileProductEvents';

/**
 * Registers the PostHog capture bridge + mirrors `analytics_opt_out` from profile.
 */
export function PostHogMount() {
  const posthog = usePostHog();
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    void supabase()
      .auth.getUser()
      .then(({ data }) => setUid(data.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase().auth.onAuthStateChange(() => {
      void supabase()
        .auth.getUser()
        .then(({ data }) => setUid(data.user?.id ?? null));
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
    enabled: !!uid,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!posthog) {
      setMobileProductCapture(null);
      return;
    }
    setMobileProductCapture((event, props) => {
      // PostHog JSON properties — narrow at capture sites; bridge stays loose-typed.
      posthog.capture(event, props as Record<string, string | number | boolean | null>);
    });
    return () => setMobileProductCapture(null);
  }, [posthog]);

  useEffect(() => {
    if (!posthog) return;
    void (async () => {
      if (!uid) {
        await posthog.optOut();
        return;
      }
      if (profile?.analytics_opt_out) await posthog.optOut();
      else await posthog.optIn();
    })();
  }, [posthog, uid, profile?.analytics_opt_out]);

  return null;
}
