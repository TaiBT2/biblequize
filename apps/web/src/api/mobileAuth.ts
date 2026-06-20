// Mobile (Capacitor) authentication transport.
//
// The web app authenticates via httpOnly cookies; the mobile app cannot use
// cross-origin cookies, so it uses the backend's `/api/auth/mobile/*` endpoints
// which take/return the refresh token in the request/response body. The refresh
// token is persisted with @capacitor/preferences (see mobileTokenStore).
//
// Raw axios is used (not the shared `api` instance) to avoid the auth-refresh
// interceptor recursing on these calls. With CapacitorHttp enabled, these XHR
// requests are routed through the native HTTP layer and bypass browser CORS.

import axios from 'axios'
import { getApiBaseUrl } from './config'
import { getRefreshToken, setRefreshToken } from './mobileTokenStore'

export interface MobileAuthResult {
  accessToken: string
  refreshToken: string
  name: string
  email: string
  avatar?: string
  role?: string
}

const base = () => getApiBaseUrl()

export async function mobileLogin(email: string, password: string): Promise<MobileAuthResult> {
  const res = await axios.post(`${base()}/api/auth/mobile/login`, { email, password })
  await setRefreshToken(res.data.refreshToken)
  return res.data
}

export async function mobileGoogle(idToken: string): Promise<MobileAuthResult> {
  const res = await axios.post(`${base()}/api/auth/mobile/google`, { idToken })
  await setRefreshToken(res.data.refreshToken)
  return res.data
}

// Refresh using the stored token. Returns the new session, or null when there
// is no stored token or the backend rejects it (session genuinely dead).
export async function mobileRefresh(): Promise<MobileAuthResult | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null
  try {
    const res = await axios.post(`${base()}/api/auth/mobile/refresh`, { refreshToken })
    if (res.data?.refreshToken) await setRefreshToken(res.data.refreshToken)
    return res.data
  } catch {
    await setRefreshToken(null)
    return null
  }
}
