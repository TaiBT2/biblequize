import { Platform } from 'react-native'

export function isDebug(): boolean {
  return __DEV__
}

export function getApiBaseUrl(): string {
  if (__DEV__) {
    // Android emulator uses 10.0.2.2 to reach host machine
    // iOS simulator can use localhost directly
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:8080'
      : 'http://localhost:8080'
  }
  return 'https://api.biblequiz.app'
}

export function getWsBaseUrl(): string {
  if (__DEV__) {
    return Platform.OS === 'android'
      ? 'ws://10.0.2.2:8080'
      : 'ws://localhost:8080'
  }
  return 'wss://api.biblequiz.app'
}

export function resolveWsUrl(pathOrAbsolute: string): string {
  if (pathOrAbsolute.startsWith('ws://') || pathOrAbsolute.startsWith('wss://')) {
    return pathOrAbsolute
  }
  const base = getWsBaseUrl()
  return pathOrAbsolute.startsWith('/')
    ? `${base}${pathOrAbsolute}`
    : `${base}/${pathOrAbsolute}`
}
