import { useTranslation } from 'react-i18next'
import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { colors, typography, spacing } from '../../theme'

export default function SplashScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('LanguageSelection')
    }, 2000)
    return () => clearTimeout(timer)
  }, [navigation])

  return (
    <View style={styles.container}>
      <View style={styles.glowTopLeft} />
      <View style={styles.glowBottomRight} />

      <View style={styles.center}>
        <Text style={styles.title}>BibleQuiz</Text>
        <Text style={styles.subtitle}>Lời Chúa trong từng câu hỏi</Text>
      </View>

      <View style={styles.bottom}>
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={styles.loading}>ĐANG TẢI...</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 96,
  },
  glowTopLeft: {
    position: 'absolute', top: -50, left: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(248, 189, 69, 0.05)',
  },
  glowBottomRight: {
    position: 'absolute', bottom: -30, right: -30,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(192, 196, 232, 0.05)',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 48, fontWeight: typography.weight.bold, color: colors.gold, letterSpacing: -1 },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing.lg, letterSpacing: 1 },
  bottom: { alignItems: 'center', gap: spacing.lg },
  loading: { fontSize: 10, color: colors.textMuted, letterSpacing: 3, opacity: 0.6 },
})
