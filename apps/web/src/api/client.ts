import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getApiBaseUrl, isDebug } from './config'

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000
})

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (isDebug()) {
      console.log('=== API CLIENT: Request Interceptor ===')
      console.log('URL:', config.url)
      console.log('Token exists:', !!token)
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'null')
    }
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
      if (isDebug()) {
        console.log('Authorization header set:', `Bearer ${token.substring(0, 20)}...`)
      }
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken
          })

          const { accessToken } = response.data
          localStorage.setItem('accessToken', accessToken)

          // Retry the original request with new token
          if (!originalRequest.headers) originalRequest.headers = {}
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)


