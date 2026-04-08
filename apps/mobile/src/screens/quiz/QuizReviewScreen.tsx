import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { colors, typography, spacing, borderRadius } from '../../theme'

const LETTERS = ['A', 'B', 'C', 'D']

export default function QuizReviewScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const stats = route.params?.stats
  const questions = stats?.questions ?? []
  const userAnswers = stats?.userAnswers ?? []

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Xem lại</Text>
          <Text style={styles.subtitle}>{stats?.correctAnswers}/{stats?.totalQuestions} đúng</Text>
        </View>

        {questions.map((q: any, qIdx: number) => {
          const userAns = userAnswers[qIdx]
          const correctIdx = q.correctAnswer?.[0] ?? -1
          const isCorrect = userAns === correctIdx

          return (
            <Card key={q.id ?? qIdx} style={styles.questionCard}>
              <View style={styles.qHeader}>
                <Text style={styles.qNumber}>#{qIdx + 1}</Text>
                <Text style={[styles.qStatus, { color: isCorrect ? colors.success : colors.error }]}>
                  {isCorrect ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={styles.qText}>{q.content}</Text>

              {q.options?.map((opt: string, i: number) => {
                const isUser = i === userAns
                const isAnswer = i === correctIdx
                return (
                  <View key={i} style={[
                    styles.optionRow,
                    isAnswer && styles.optCorrect,
                    isUser && !isCorrect && styles.optWrong,
                  ]}>
                    <Text style={styles.optLetter}>{LETTERS[i]}</Text>
                    <Text style={[styles.optText, isAnswer && { color: colors.success }]}>{opt}</Text>
                    {isUser && <Text style={styles.optBadge}>{isCorrect ? '✓' : 'Bạn chọn'}</Text>}
                  </View>
                )
              })}

              {q.explanation && (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>💡 Giải thích</Text>
                  <Text style={styles.explanationText}>{q.explanation}</Text>
                </View>
              )}

              {q.verseStart && (
                <Text style={styles.verseRef}>📖 {q.book} {q.chapter}:{q.verseStart}{q.verseEnd && q.verseEnd !== q.verseStart ? `–${q.verseEnd}` : ''}</Text>
              )}
            </Card>
          )
        })}

        <Button title="Về trang chủ" onPress={() => navigation.popToTop()} fullWidth />
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['4xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold },
  questionCard: { gap: spacing.md },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qNumber: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.textMuted },
  qStatus: { fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  qText: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.textPrimary, lineHeight: 24 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainerHigh,
  },
  optCorrect: { borderLeftWidth: 3, borderLeftColor: colors.success },
  optWrong: { borderLeftWidth: 3, borderLeftColor: colors.error },
  optLetter: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.textMuted, marginRight: spacing.md, width: 16 },
  optText: { flex: 1, fontSize: typography.size.sm, color: colors.textPrimary },
  optBadge: { fontSize: 10, color: colors.textMuted, fontWeight: typography.weight.bold },
  explanationBox: { backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.lg, padding: spacing.md },
  explanationLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.gold, marginBottom: spacing.xs },
  explanationText: { fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 20 },
  verseRef: { fontSize: typography.size.xs, color: colors.gold, fontWeight: typography.weight.medium },
})
