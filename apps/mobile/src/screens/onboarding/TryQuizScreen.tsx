import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import ProgressBar from '../../components/ui/ProgressBar'
import { colors, typography, spacing, borderRadius } from '../../theme'

const SAMPLE_QUESTIONS = [
  {
    content: 'Sách đầu tiên trong Kinh Thánh là gì?',
    options: ['Sáng Thế Ký', 'Xuất Hành', 'Ma-thi-ơ', 'Thi Thiên'],
    correctAnswer: 0,
    book: 'Cựu Ước',
  },
  {
    content: 'Ai đã xây tàu theo lệnh Đức Chúa Trời?',
    options: ['Áp-ra-ham', 'Nô-ê', 'Môi-se', 'Đa-vít'],
    correctAnswer: 1,
    book: 'Sáng Thế Ký',
  },
  {
    content: 'Chúa Giê-su sinh ra tại thành nào?',
    options: ['Na-xa-rét', 'Giê-ru-sa-lem', 'Bết-lê-hem', 'Ca-bê-na-um'],
    correctAnswer: 2,
    book: 'Ma-thi-ơ',
  },
]

const LETTERS = ['A', 'B', 'C', 'D']

export default function TryQuizScreen() {
  const navigation = useNavigation<any>()
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)

  const question = SAMPLE_QUESTIONS[qIndex]
  const progress = ((qIndex + (showResult ? 1 : 0)) / SAMPLE_QUESTIONS.length) * 100

  const handleSelect = (idx: number) => {
    if (showResult) return
    setSelected(idx)
    setShowResult(true)
    if (idx === question.correctAnswer) {
      setScore((s) => s + 1)
    }

    setTimeout(() => {
      if (qIndex < SAMPLE_QUESTIONS.length - 1) {
        setQIndex((i) => i + 1)
        setSelected(null)
        setShowResult(false)
      } else {
        navigation.replace('TryQuizResult', { score: score + (idx === question.correctAnswer ? 1 : 0), total: SAMPLE_QUESTIONS.length })
      }
    }, 1200)
  }

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.questionCount}>Câu {qIndex + 1} / {SAMPLE_QUESTIONS.length}</Text>
          <Text style={styles.bookLabel}>{question.book}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <ProgressBar progress={progress} height={4} />
        </View>

        {/* Question card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.content}</Text>
        </View>

        {/* Answer options */}
        <View style={styles.answers}>
          {question.options.map((opt, idx) => {
            const isSelected = selected === idx
            const isCorrect = showResult && idx === question.correctAnswer
            const isWrong = showResult && isSelected && idx !== question.correctAnswer

            return (
              <Pressable
                key={idx}
                onPress={() => handleSelect(idx)}
                disabled={showResult}
                style={[
                  styles.answerBtn,
                  isCorrect && styles.answerCorrect,
                  isWrong && styles.answerWrong,
                  isSelected && !showResult && styles.answerSelected,
                ]}
              >
                <View style={[
                  styles.letterBadge,
                  isCorrect && styles.letterCorrect,
                  isWrong && styles.letterWrong,
                ]}>
                  <Text style={styles.letterText}>{LETTERS[idx]}</Text>
                </View>
                <Text style={[
                  styles.answerText,
                  isCorrect && { color: colors.success },
                  isWrong && { color: colors.error },
                ]}>
                  {opt}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionCount: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold },
  bookLabel: { fontSize: typography.size.xs, color: colors.textMuted, fontWeight: typography.weight.medium },
  progressWrap: { marginTop: spacing.lg, marginBottom: spacing['2xl'] },
  questionCard: {
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'], marginBottom: spacing['2xl'], minHeight: 120,
    justifyContent: 'center', alignItems: 'center',
  },
  questionText: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center', lineHeight: 30 },
  answers: { gap: spacing.md },
  answerBtn: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
    backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl,
    borderWidth: 2, borderColor: 'transparent',
  },
  answerSelected: { borderColor: colors.gold, backgroundColor: 'rgba(248, 189, 69, 0.08)' },
  answerCorrect: { borderColor: colors.success, backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  answerWrong: { borderColor: colors.error, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  letterBadge: {
    width: 36, height: 36, borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  letterCorrect: { backgroundColor: colors.success },
  letterWrong: { backgroundColor: colors.error },
  letterText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.gold },
  answerText: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.textPrimary, flex: 1 },
})
