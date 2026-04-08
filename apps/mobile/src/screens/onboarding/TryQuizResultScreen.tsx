import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function TryQuizResultScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { setHasSeenOnboarding } = useOnboardingStore()
  const { score = 0, total = 3 } = route.params ?? {}
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0

  const getGrade = () => {
    if (accuracy >= 90) return { emoji: '👑', text: 'Xuất sắc!' }
    if (accuracy >= 60) return { emoji: '⭐', text: 'Tốt lắm!' }
    return { emoji: '💪', text: 'Bạn có tiềm năng!' }
  }
  const grade = getGrade()

  const handleRegister = () => {
    setHasSeenOnboarding(true)
    // Navigation to Auth will happen automatically via RootNavigator
  }

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Score */}
        <View style={styles.scoreSection}>
          <Text style={styles.emoji}>{grade.emoji}</Text>
          <Text style={styles.scoreText}>{score}/{total}</Text>
          <Text style={styles.gradeText}>{grade.text}</Text>
          <Text style={styles.subText}>Bạn có tiềm năng học Kinh Thánh!</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.success }]}>{score}</Text>
            <Text style={styles.statLabel}>Đúng</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.error }]}>{total - score}</Text>
            <Text style={styles.statLabel}>Sai</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.gold }]}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Chính xác</Text>
          </View>
        </View>

        {/* Community */}
        <View style={styles.communityBox}>
          <Text style={styles.communityText}>2,405 người đã tham gia hôm nay</Text>
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          <Button title="Đăng ký miễn phí" onPress={handleRegister} fullWidth />
          <Button title="Để sau" onPress={handleRegister} variant="ghost" fullWidth />
        </View>
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  scoreSection: { alignItems: 'center', paddingTop: spacing['3xl'] },
  emoji: { fontSize: 64, marginBottom: spacing.lg },
  scoreText: { fontSize: 56, fontWeight: typography.weight.black, color: colors.gold },
  gradeText: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, marginTop: spacing.sm },
  subText: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statBox: {
    flex: 1, backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl, padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold },
  statLabel: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.xs },
  communityBox: {
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg,
    padding: spacing.lg, alignItems: 'center',
  },
  communityText: { fontSize: typography.size.sm, color: colors.textSecondary },
  footer: { gap: spacing.md, paddingBottom: spacing.lg },
})
