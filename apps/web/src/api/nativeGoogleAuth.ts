// Native Google Sign-In for the Capacitor (mobile) target via
// @capgo/capacitor-social-login. Returns a Google ID token that the backend
// verifies at POST /api/auth/mobile/google (audience = the Web OAuth client id
// passed here as webClientId; see MOB-0a / MobileAuthService.verifyGoogleIdToken).

import { SocialLogin } from '@capgo/capacitor-social-login'

let initialized = false

export async function nativeGoogleIdToken(): Promise<string> {
  const webClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  if (!webClientId) {
    throw new Error('[nativeGoogleAuth] VITE_GOOGLE_CLIENT_ID is not set')
  }

  if (!initialized) {
    await SocialLogin.initialize({ google: { webClientId } })
    initialized = true
  }

  const res = (await SocialLogin.login({
    provider: 'google',
    options: { scopes: ['email', 'profile'] },
  })) as { result?: { idToken?: string | null } }

  const idToken = res?.result?.idToken
  if (!idToken) {
    throw new Error('[nativeGoogleAuth] Google sign-in returned no idToken')
  }
  return idToken
}
