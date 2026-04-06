import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getApiBaseUrl, isDebug } from './config'
import { getAccessToken, setAccessToken, getRefreshToken, setRefreshToken } from './tokenStore'

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
})

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config: any) => {
    const token = getAccessToken()
    if (isDebug()) {
      console.log('[API] Request:', config.url, 'Token:', !!token)
    }
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 + token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean })

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/mobile/refresh')
    ) {
      originalRequest._retry = true

      try {
        const refreshToken = await getRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')

        // Mobile endpoint: refresh token in body, returns both tokens in body
        const response = await axios.post(
          `${getApiBaseUrl()}/api/auth/mobile/refresh`,
          { refreshToken }
        )

        const { accessToken, refreshToken: newRefreshToken } = response.data
        setAccessToken(accessToken)
        if (newRefreshToken) {
          await setRefreshToken(newRefreshToken)
        }

        // Retry original request with new token
        if (!originalRequest.headers) originalRequest.headers = {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch {
        // Refresh failed — clear tokens + force logout (skip API call to avoid loop)
        setAccessToken(null)
        await setRefreshToken(null)
        const { useAuthStore } = require('../stores/authStore')
        useAuthStore.setState({ user: null, isAuthenticated: false, isAdmin: false })
      }
    }

    return Promise.reject(error)
  }
)
