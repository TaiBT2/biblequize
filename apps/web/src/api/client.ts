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
      if (isDebug()) {
        console.log('=== API CLIENT: Request Interceptor ===')
        console.log('URL:', config.url)
        console.log('Token exists:', !!token)
      }
      if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
      return config
    },
    (error) => Promise.reject(error)
  )
}
addAuthInterceptor(api)
addAuthInterceptor(aiApi)

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
        // Refresh failed — notify the app to handle session expiry via React Router
        setAccessToken(null)
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
      }
    }

    // Attach user-friendly error message
    if (!error.response) {
      error.userMessage = 'Không thể kết nối server. Kiểm tra kết nối mạng.'
    } else {
      switch (error.response.status) {
        case 401:
          error.userMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
          break
        case 403:
          error.userMessage = 'Bạn không có quyền thực hiện thao tác này.'
          break
        case 404:
          error.userMessage = 'Nội dung không tìm thấy.'
          break
        case 429:
          error.userMessage = 'Bạn thao tác quá nhanh. Vui lòng chờ một chút.'
          break
        case 500:
          error.userMessage = 'Lỗi hệ thống. Chúng tôi đang xử lý.'
          break
        default:
          error.userMessage = error.response.data?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.'
      }
    }

    return Promise.reject(error)
  }
)
