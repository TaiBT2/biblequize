// Persistent refresh-token store for the Capacitor (mobile) target.
//
// On web the refresh token lives in an httpOnly cookie (never visible to JS).
// In the mobile app there is no cross-origin cookie, so the backend's
// `/api/auth/mobile/*` endpoints return the refresh token in the body and we
// persist it with @capacitor/preferences (native secure-ish key/value store).

import { Preferences } from '@capacitor/preferences'

const REFRESH_TOKEN_KEY = 'bq_refresh_token'

export async function getRefreshToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY })
  return value ?? null
}

export async function setRefreshToken(token: string | null): Promise<void> {
  if (token) {
    await Preferences.set({ key: REFRESH_TOKEN_KEY, value: token })
  } else {
    await Preferences.remove({ key: REFRESH_TOKEN_KEY })
  }
}
