import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

const DIFFICULTIES = [
  { key: 'all', label: 'Tất cả', color: colors.textPrimary },
  { key: 'easy', label: 'Dễ', color: colors.success },
  { key: 'medium', label: 'Trung bình', color: colors.warning },
  { key: 'hard', label: 'Khó', color: colors.error },
]

const COUNTS = [5, 10, 15, 20]

export default function PracticeSelectScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const [difficulty, setDifficulty] = useState('all')
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)

  const startQuiz = async () => {
    setLoading(true)
    try {
      const res = await apiClient.post('/api/sessions', {
        mode: 'practice',
        questionCount: count,
        difficulty,
        showExplanation: true,
      })
      navigation.navigate('Quiz', {
        sessionId: res.data.sessionId,
        questions: res.data.questions,
        mode: 'practice',
        showExplanation: true,
      })
    } catch {
      setLoading(false)
    }
  }

  return (
    <SafeScreen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Luyện Tập</Text>
        <Text style={styles.subtitle}>Chọn cấu hình quiz của bạn</Text>

        {/* Difficulty */}
        <Text style={styles.label}>Độ khó</Text>
        <View style={styles.chips}>
          {DIFFICULTIES.map((d) => (
            <Pressable
              key={d.key}
              onPress={() => setDifficulty(d.key)}
              style={[styles.chip, difficulty === d.key && { borderColor: d.color, backgroundColor: `${d.color}15` }]}
            >
              <Text style={[styles.chipText, difficulty === d.key && { color: d.color }]}>{d.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Question count */}
        <Text style={styles.label}>Số câu hỏi</Text>
        <View style={styles.chips}>
          {COUNTS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCount(c)}
              style={[styles.chip, count === c && styles.chipSelected]}
            >
              <Text style={[styles.chipText, count === c && styles.chipTextSelected]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        {/* Summary card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Độ khó</Text>
            <Text style={styles.summaryValue}>{DIFFICULTIES.find(d => d.key === difficulty)?.label}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số câu</Text>
            <Text style={styles.summaryValue}>{count}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thời gian</Text>
            <Text style={styles.summaryValue}>30s / câu</Text>
          </View>
        </Card>

        <Button title="Bắt đầu" onPress={startQuiz} loading={loading} fullWidth />
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.xl },
  title: { fontSize: typography.size['3xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: -spacing.md },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
  },
  chipSelected: { borderColor: colors.gold, backgroundColor: 'rgba(248, 189, 69, 0.1)' },
  chipText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  chipTextSelected: { color: colors.gold },
  summaryCard: { gap: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: typography.size.sm, color: colors.textMuted },
  summaryValue: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
})
