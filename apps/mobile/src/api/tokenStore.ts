// In-memory access token store.
// On React Native, refresh token is stored via AsyncStorage (not httpOnly cookie).
// Access token stays in memory for XSS-equivalent protection.

import AsyncStorage from '@react-native-async-storage/async-storage'

let accessToken: string | null = null

export const setAccessToken = (token: string | null): void => {
  accessToken = token
}

export const getAccessToken = (): string | null => accessToken

// Refresh token persistence (RN doesn't have httpOnly cookies)
const REFRESH_TOKEN_KEY = 'refreshToken'

export const setRefreshToken = async (token: string | null): Promise<void> => {
  if (token) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export const getRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY)
}
