import * as Sentry from '@sentry/react-native';

let initialized = false;

/** Call once at app startup. No-op if `EXPO_PUBLIC_SENTRY_DSN` is unset. */
export function initMobileSentry() {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1 : 0.2,
  });
}
