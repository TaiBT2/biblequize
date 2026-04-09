import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../stores/authStore'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function LoginScreen() {
  const { t } = useTranslation()
  const { setAuth } = useAuthStore()
  const { signIn: googleSignIn, isReady: googleReady } = useGoogleAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      await googleSignIn()
    } catch (err) {
      setError(t('errors.somethingWrong'))
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    Alert.alert('Email Login', t('errors.somethingWrong'))
  }

  // Dev: quick login for testing
  const handleDevLogin = async () => {
    if (!__DEV__) return
    setLoading(true)
    try {
      const res = await apiClient.post('/api/auth/mobile/login', {
        email: 'mobile@test.com',
        password: 'password123',
      })
      const d = res.data
      setAuth(
        { id: d.id ?? '', name: d.name, email: d.email, avatarUrl: d.avatar, role: d.role },
        d.accessToken,
        d.refreshToken
      )
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Hero section */}
        <View style={styles.hero}>
          <View style={styles.glowBg} />
          <Text style={styles.title}>BibleQuiz</Text>
          <Text style={styles.tagline}>Học Kinh Thánh cùng anh chị em</Text>
          <Text style={styles.subtext}>Miễn phí, không quảng cáo</Text>
        </View>

        {/* Auth section */}
        <View style={styles.authSection}>
          {/* Google login */}
          <Pressable onPress={handleGoogleLogin} disabled={!googleReady || loading} style={[styles.googleBtn, (!googleReady || loading) && { opacity: 0.6 }]}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>{t('auth.loginWithGoogle')}</Text>
          </Pressable>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email login */}
          <Button title={t('auth.loginWithEmail')} onPress={handleEmailLogin} variant="outline" fullWidth />

          {/* Dev login */}
          {__DEV__ && (
            <Button title="[DEV] Quick Login" onPress={handleDevLogin} variant="ghost" loading={loading} fullWidth />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.legalText}>
            Bằng việc đăng nhập, bạn đồng ý với{' '}
            <Text style={styles.legalLink}>Điều khoản sử dụng</Text>
            {' '}và{' '}
            <Text style={styles.legalLink}>Chính sách bảo mật</Text>
          </Text>
        </View>
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  hero: { alignItems: 'center', paddingTop: spacing['4xl'], paddingBottom: spacing['3xl'] },
  glowBg: {
    position: 'absolute', top: 0, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(248, 189, 69, 0.05)',
  },
  title: { fontSize: 40, fontWeight: typography.weight.bold, color: colors.gold, letterSpacing: -1 },
  tagline: { fontSize: typography.size.base, color: colors.textPrimary, marginTop: spacing.lg, fontWeight: typography.weight.medium },
  subtext: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing.xs },
  authSection: { gap: spacing.lg },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: borderRadius.lg, paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  googleIcon: { fontSize: 20, fontWeight: typography.weight.bold, color: '#4285F4' },
  googleText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: '#1f1f1f' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  dividerText: { fontSize: typography.size.sm, color: colors.textMuted },
  errorText: { fontSize: typography.size.sm, color: colors.error, textAlign: 'center' },
  footer: { paddingBottom: spacing.lg, alignItems: 'center' },
  legalText: { fontSize: 10, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
  legalLink: { color: colors.gold },
})
