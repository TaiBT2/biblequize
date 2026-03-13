// In-memory access token store — never persisted to localStorage/sessionStorage.
// This protects against XSS token theft. The refresh token lives in an httpOnly
// cookie managed by the backend, so JS never has access to it.

let accessToken: string | null = null

export const setAccessToken = (token: string | null): void => {
  accessToken = token
}

export const getAccessToken = (): string | null => accessToken
