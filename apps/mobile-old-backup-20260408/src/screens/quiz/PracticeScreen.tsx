import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import { GoldButton } from '../../components/GoldButton'

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const
const DIFF_LABELS: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
const QUESTION_COUNTS = [5, 10, 15, 20]

export const PracticeScreen = () => {
  const navigation = useNavigation<any>()
  const [difficulty, setDifficulty] = useState<string>('MEDIUM')
  const [questionCount, setQuestionCount] = useState(10)
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await api.post('/api/sessions', {
        mode: 'PRACTICE',
        difficulty,
        questionCount,
      })
      const sessionId = res.data?.id ?? res.data?.sessionId
      if (sessionId) {
        navigation.navigate('Quiz', { sessionId, mode: 'practice' })
      }
    } catch {
      Alert.alert('Lỗi', 'Không tạo được phiên luyện tập')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Luyện Tập</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.subtitle}>Không áp lực, không giới hạn thời gian</Text>

        {/* Difficulty */}
        <Text style={styles.sectionLabel}>Độ khó</Text>
        <View style={styles.optionRow}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, difficulty === d && styles.chipActive]}
              onPress={() => setDifficulty(d)}
            >
              <Text style={[styles.chipText, difficulty === d && styles.chipTextActive]}>
                {DIFF_LABELS[d]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Question count */}
        <Text style={styles.sectionLabel}>Số câu hỏi</Text>
        <View style={styles.optionRow}>
          {QUESTION_COUNTS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, questionCount === c && styles.chipActive]}
              onPress={() => setQuestionCount(c)}
            >
              <Text style={[styles.chipText, questionCount === c && styles.chipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            {questionCount} câu • {DIFF_LABELS[difficulty]} • Không giới hạn
          </Text>
        </GlassCard>

        <GoldButton title="Bắt đầu" onPress={handleStart} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { padding: spacing.xl, paddingBottom: spacing['4xl'] },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text.primary },
  subtitle: { fontSize: 14, color: colors.text.secondary, marginBottom: spacing['2xl'] },

  sectionLabel: {
    fontSize: 14, fontWeight: '600', color: colors.text.primary,
    marginBottom: spacing.md, marginTop: spacing.lg,
  },
  optionRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.outlineVariant,
  },
  chipActive: { backgroundColor: colors.goldLight, borderColor: colors.gold },
  chipText: { fontSize: 14, color: colors.text.muted, fontWeight: '500' },
  chipTextActive: { color: colors.gold },

  summaryCard: { marginVertical: spacing['2xl'], alignItems: 'center' },
  summaryText: { fontSize: 15, color: colors.text.primary, fontWeight: '500' },
})
