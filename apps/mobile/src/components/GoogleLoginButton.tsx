import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { colors } from '../theme/colors'
import { borderRadius } from '../theme/spacing'
import {
  GOOGLE_WEB_CLIENT_ID,
} from '../config/google'

interface GoogleLoginButtonProps {
  onToken: (idToken: string) => void
  onError: (message: string) => void
  disabled?: boolean
}

// Configure once — webClientId is required to get idToken
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
})

export const GoogleLoginButton = ({
  onToken,
  onError,
  disabled,
}: GoogleLoginButtonProps) => {

  const handlePress = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const response = await GoogleSignin.signIn()

      if (isSuccessResponse(response)) {
        const idToken = response.data?.idToken
        if (idToken) {
          onToken(idToken)
        } else {
          onError('Google response thiếu ID token')
        }
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // User cancelled — don't show error
            break
          case statusCodes.IN_PROGRESS:
            onError('Đang xử lý...')
            break
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            onError('Google Play Services không khả dụng')
            break
          default:
            onError(`Google error ${error.code}: ${error.message}`)
        }
      } else {
        const err = error as Error
        onError(`Google Sign-In error: ${err.message ?? 'unknown'}`)
      }
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>Đăng nhập với Google</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  text: { fontSize: 16, fontWeight: '600', color: '#333' },
})
