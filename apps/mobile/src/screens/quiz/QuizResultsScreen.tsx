import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import { GoldButton } from '../../components/GoldButton'
import { ProgressBar } from '../../components/ProgressBar'
import type { QuizStackParamList } from '../../navigation/types'

function getGrade(accuracy: number): { text: string; color: string; icon: string } {
  if (accuracy >= 90) return { text: 'Xuất sắc!', color: '#22c55e', icon: 'star' }
  if (accuracy >= 70) return { text: 'Tốt lắm!', color: colors.gold, icon: 'thumb-up' }
  if (accuracy >= 50) return { text: 'Khá tốt', color: '#3b82f6', icon: 'emoticon-happy' }
  return { text: 'Cố gắng thêm!', color: '#ef4444', icon: 'emoticon-sad' }
}

export const QuizResultsScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute<RouteProp<QuizStackParamList, 'QuizResults'>>()
  const { sessionId } = route.params

  const { data, isLoading } = useQuery({
    queryKey: ['session-review', sessionId],
    queryFn: () => api.get(`/api/sessions/${sessionId}/review`).then((r) => r.data),
  })

  const totalQuestions = data?.totalQuestions ?? data?.questions?.length ?? 0
  const correctAnswers = data?.correctAnswers ?? data?.correct ?? 0
  const totalScore = data?.totalScore ?? data?.score ?? 0
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const grade = getGrade(accuracy)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Grade */}
        <View style={styles.gradeSection}>
          <View style={[styles.gradeCircle, { backgroundColor: `${grade.color}20` }]}>
            <MaterialCommunityIcons name={grade.icon as any} size={48} color={grade.color} />
          </View>
          <Text style={[styles.gradeText, { color: grade.color }]}>{grade.text}</Text>
        </View>

        {/* Score */}
        <Text style={styles.scoreNumber}>{totalScore}</Text>
        <Text style={styles.scoreLabel}>Tổng điểm</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{correctAnswers}/{totalQuestions}</Text>
            <Text style={styles.statLabel}>Đúng</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Chính xác</Text>
          </GlassCard>
        </View>

        {/* Accuracy bar */}
        <GlassCard style={styles.accuracyCard}>
          <Text style={styles.accuracyLabel}>Độ chính xác</Text>
          <ProgressBar progress={accuracy / 100} height={10} color={grade.color} />
        </GlassCard>

        {/* Actions */}
        <View style={styles.actions}>
          <GoldButton
            title="Xem lại đáp án"
            onPress={() => navigation.navigate('Review', { sessionId })}
          />
          <GoldButton
            title="Về Trang chủ"
            variant="outline"
            onPress={() => navigation.popToTop()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.xl, alignItems: 'center', paddingBottom: spacing['4xl'] },

  gradeSection: { alignItems: 'center', marginTop: spacing['3xl'], marginBottom: spacing.xl },
  gradeCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  gradeText: { fontSize: 24, fontWeight: '700' },

  scoreNumber: { fontSize: 56, fontWeight: '800', color: colors.gold, marginBottom: spacing.xs },
  scoreLabel: { fontSize: 15, color: colors.text.secondary, marginBottom: spacing['2xl'] },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, width: '100%' },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  statLabel: { fontSize: 13, color: colors.text.secondary },

  accuracyCard: { width: '100%', marginBottom: spacing['2xl'] },
  accuracyLabel: { fontSize: 13, color: colors.text.secondary, marginBottom: spacing.sm },

  actions: { width: '100%', gap: spacing.md },
})
