import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { useAuthStore } from '../../stores/authStore'
import { api } from '../../api/client'
import { GoldButton } from '../../components/GoldButton'
import { GoogleLoginButton } from '../../components/GoogleLoginButton'
import { getDailyVerse } from '../../data/verses'

import { GOOGLE_ENABLED } from '../../config/google'

export const LoginScreen = () => {
  const { login } = useAuthStore()
  const verse = getDailyVerse()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Google ID Token → backend verifies + returns JWT tokens
  const handleGoogleToken = async (idToken: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/mobile/google', { idToken })
      await login({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        name: res.data.name,
        email: res.data.email,
        avatar: res.data.avatar,
        role: res.data.role,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại')
    } finally {
      setLoading(false)
    }
  }

  // Email/password auth
  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu')
      return
    }
    if (mode === 'register' && !name.trim()) {
      setError('Vui lòng nhập tên')
      return
    }

    setLoading(true)
    setError('')
    try {
      const endpoint = mode === 'login' ? '/api/auth/mobile/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { email, password, name }

      const res = await api.post(endpoint, body)
      await login({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        name: res.data.name || name,
        email: res.data.email || email,
        avatar: res.data.avatar,
        role: res.data.role,
      })
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(msg || (mode === 'login' ? 'Email hoặc mật khẩu không đúng' : 'Đăng ký thất bại'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>✝</Text>
            <Text style={styles.title}>BibleQuiz</Text>
            <Text style={styles.verse}>"{verse.text}"</Text>
            <Text style={styles.verseRef}>— {verse.ref}</Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Google Login — conditional render, hook lives inside GoogleLoginButton */}
          {GOOGLE_ENABLED && (
            <>
              <GoogleLoginButton
                onToken={handleGoogleToken}
                onError={(msg) => setError(msg)}
                disabled={loading}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>hoặc</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          {/* Email/Password Form */}
          {mode === 'register' && (
            <TextInput
              style={styles.input}
              placeholder="Tên hiển thị"
              placeholderTextColor={colors.text.muted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.text.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            placeholderTextColor={colors.text.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <GoldButton
            title={mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            onPress={handleEmailAuth}
            loading={loading}
            disabled={loading}
          />

          {/* Toggle login/register */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
          >
            <Text style={styles.toggleText}>
              {mode === 'login'
                ? 'Chưa có tài khoản? Đăng ký'
                : 'Đã có tài khoản? Đăng nhập'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing['2xl'],
  },

  header: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logo: { fontSize: 56, color: colors.gold, marginBottom: spacing.md },
  title: { fontSize: 36, fontWeight: '700', color: colors.gold, marginBottom: spacing.lg },
  verse: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.xl,
  },
  verseRef: { fontSize: 12, color: colors.gold, marginTop: spacing.xs },

  errorBox: {
    backgroundColor: colors.errorContainer,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.error, fontSize: 14, textAlign: 'center' },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  dividerText: {
    color: colors.text.muted,
    fontSize: 13,
    paddingHorizontal: spacing.lg,
  },

  input: {
    backgroundColor: colors.bg.surfaceContainer,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    color: colors.text.primary,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },

  toggleButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '500',
  },
})
