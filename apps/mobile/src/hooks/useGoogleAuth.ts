import { useEffect } from 'react'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/authStore'

WebBrowser.maybeCompleteAuthSession()

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? ''

export function useGoogleAuth() {
  const setAuth = useAuthStore(s => s.setAuth)

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  })

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response
      if (authentication?.accessToken) {
        handleGoogleToken(authentication.accessToken)
      }
    }
  }, [response])

  const handleGoogleToken = async (googleAccessToken: string) => {
    try {
      // Get user info from Google
      const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      })
      const userInfo = await userInfoRes.json()

      // Send to our backend
      const { data } = await apiClient.post('/api/auth/mobile/google', {
        idToken: googleAccessToken,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      })

      setAuth(
        { id: data.id ?? '', name: data.name, email: data.email, avatarUrl: data.avatar, role: data.role },
        data.accessToken,
        data.refreshToken
      )
    } catch (error) {
      console.error('Google auth failed:', error)
      throw error
    }
  }

  return {
    signIn: () => promptAsync(),
    isReady: !!request,
  }
}
