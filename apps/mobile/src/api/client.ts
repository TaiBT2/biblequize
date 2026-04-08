import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const getBaseURL = () => {
  if (__DEV__) {
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:8080'
      : 'http://localhost:8080'
  }
  return process.env.EXPO_PUBLIC_API_URL || 'https://api.biblequiz.app'
}

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && error.config && !error.config._retry) {
      error.config._retry = true
      const refreshToken = await AsyncStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${getBaseURL()}/api/auth/mobile/refresh`,
            { refreshToken }
          )
          await AsyncStorage.setItem('accessToken', data.accessToken)
          if (data.refreshToken) {
            await AsyncStorage.setItem('refreshToken', data.refreshToken)
          }
          error.config.headers.Authorization = `Bearer ${data.accessToken}`
          return apiClient.request(error.config)
        } catch {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken'])
        }
      }
    }
    return Promise.reject(error)
  }
)
