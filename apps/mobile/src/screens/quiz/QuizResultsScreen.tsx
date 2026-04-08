import { useTranslation } from 'react-i18next'
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function QuizResultsScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const stats = route.params?.stats

  const [scoreAnim, setScoreAnim] = useState(0)
  const totalScore = stats?.totalScore ?? 0
  const correct = stats?.correctAnswers ?? 0
  const total = stats?.totalQuestions ?? 0
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  useEffect(() => {
    let frame = 0
    const steps = 30
    const interval = setInterval(() => {
      frame++
      setScoreAnim(Math.round(totalScore * Math.min(1, frame / steps)))
      if (frame >= steps) clearInterval(interval)
    }, 600 / steps)
    return () => clearInterval(interval)
  }, [totalScore])

  const grade = accuracy >= 90 ? { emoji: '👑', text: 'Xuất sắc!', color: colors.gold }
    : accuracy >= 70 ? { emoji: '⭐', text: 'Tốt lắm!', color: colors.success }
    : accuracy >= 50 ? { emoji: '💪', text: 'Khá tốt!', color: colors.info }
    : { emoji: '🙏', text: 'Cố gắng thêm!', color: colors.textMuted }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Grade */}
        <View style={styles.gradeSection}>
          <Text style={styles.emoji}>{grade.emoji}</Text>
          <Text style={[styles.gradeText, { color: grade.color }]}>{grade.text}</Text>
        </View>

        {/* Score */}
        <Text style={styles.scoreText}>{scoreAnim}</Text>
        <Text style={styles.scoreLabel}>điểm</Text>

        {/* Stats grid */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>{correct}</Text>
            <Text style={styles.statLabel}>Đúng</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.error }]}>{total - correct}</Text>
            <Text style={styles.statLabel}>Sai</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.gold }]}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Chính xác</Text>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Xem lại câu trả lời"
            onPress={() => navigation.replace('QuizReview', { stats })}
            variant="outline"
            fullWidth
          />
          <Button
            title="Về trang chủ"
            onPress={() => navigation.popToTop()}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, alignItems: 'center', paddingTop: spacing['3xl'] },
  gradeSection: { alignItems: 'center', marginBottom: spacing.xl },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  gradeText: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold },
  scoreText: { fontSize: 72, fontWeight: typography.weight.black, color: colors.gold },
  scoreLabel: { fontSize: typography.size.sm, color: colors.textMuted, marginBottom: spacing['2xl'] },
  statsRow: { flexDirection: 'row', gap: spacing.md, width: '100%', marginBottom: spacing['2xl'] },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl },
  statValue: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold },
  statLabel: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.xs },
  actions: { width: '100%', gap: spacing.md },
})
