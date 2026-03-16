import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getApiBaseUrl, isDebug } from './config'
import { getAccessToken, setAccessToken } from './tokenStore'

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  withCredentials: true // Required so httpOnly refresh_token cookie is sent
})

// Axios instance with longer timeout for AI generation calls
export const aiApi = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 90000, // 90s — Gemini can be slow
  withCredentials: true
})

// Shared request interceptor factory
function addAuthInterceptor(instance: typeof api) {
  instance.interceptors.request.use(
    (config: any) => {
      const token = getAccessToken()
      if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
      return config
    },
    (error) => Promise.reject(error)
  )
}
addAuthInterceptor(api)
addAuthInterceptor(aiApi)

// Request interceptor to add JWT token from in-memory store
api.interceptors.request.use(
  (config: any) => {
    const token = getAccessToken()
    if (isDebug()) {
      console.log('=== API CLIENT: Request Interceptor ===')
      console.log('URL:', config.url)
      console.log('Token exists:', !!token)
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean })

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/refresh')
    ) {
      originalRequest._retry = true

      try {
        // Refresh token is in httpOnly cookie — no need to send it in body
        const response = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, {}, {
          withCredentials: true
        })

        const { accessToken } = response.data
        setAccessToken(accessToken)

        // Retry the original request with new token
        if (!originalRequest.headers) originalRequest.headers = {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed — clear in-memory token and redirect to login
        setAccessToken(null)
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userAvatar')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)
