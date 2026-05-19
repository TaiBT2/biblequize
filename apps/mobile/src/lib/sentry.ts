import * as Sentry from '@sentry/react-native'

/**
 * Init wrapper cho Sentry mobile. No-op khi EXPO_PUBLIC_SENTRY_DSN missing
 * (an toàn cho local dev + CI không có DSN).
 *
 * Env tag từ EXPO_PUBLIC_ENV (set via eas.json profile) — dùng để filter
 * trong Sentry dashboard giữa development/preview/production.
 */
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_ENV ?? 'development',
    tracesSampleRate: 0.1,
    enableAutoSessionTracking: true,
    // attachStacktrace cho captured exceptions outside ErrorBoundary
    attachStacktrace: true,
  })
}

export { Sentry }
