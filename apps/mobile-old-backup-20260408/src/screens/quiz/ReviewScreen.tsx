import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import type { QuizStackParamList } from '../../navigation/types'

type Filter = 'all' | 'correct' | 'wrong'

export const ReviewScreen = () => {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<QuizStackParamList, 'Review'>>()
  const { sessionId } = route.params
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data } = useQuery({
    queryKey: ['session-review', sessionId],
    queryFn: () => api.get(`/api/sessions/${sessionId}/review`).then((r) => r.data),
  })

  const questions = data?.questions ?? data?.answers ?? []
  const filtered = questions.filter((q: any) => {
    if (filter === 'correct') return q.correct || q.isCorrect
    if (filter === 'wrong') return !(q.correct || q.isCorrect)
    return true
  })

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'correct', label: 'Đúng' },
    { key: 'wrong', label: 'Sai' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xem lại</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.tab, filter === f.key && styles.tabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.tabText, filter === f.key && styles.tabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Questions list */}
      <FlatList
        data={filtered}
        keyExtractor={(item: any, i) => item.questionId ?? item.id ?? String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const isCorrect = item.correct || item.isCorrect
          const isExpanded = expanded === (item.questionId ?? item.id ?? String(index))
          const questionText = item.questionText ?? item.content ?? item.question ?? ''

          return (
            <TouchableOpacity
              onPress={() =>
                setExpanded(isExpanded ? null : (item.questionId ?? item.id ?? String(index)))
              }
              activeOpacity={0.7}
            >
              <GlassCard style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <MaterialCommunityIcons
                    name={isCorrect ? 'check-circle' : 'close-circle'}
                    size={20}
                    color={isCorrect ? '#22c55e' : '#ef4444'}
                  />
                  <Text style={styles.questionText} numberOfLines={isExpanded ? undefined : 2}>
                    {questionText}
                  </Text>
                </View>

                {isExpanded && item.explanation && (
                  <View style={styles.explanation}>
                    <Text style={styles.explanationLabel}>Giải thích:</Text>
                    <Text style={styles.explanationText}>{item.explanation}</Text>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },

  tabs: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tabActive: { backgroundColor: colors.goldLight },
  tabText: { fontSize: 14, color: colors.text.muted, fontWeight: '500' },
  tabTextActive: { color: colors.gold },

  list: { padding: spacing.xl, gap: spacing.md },
  questionCard: { marginBottom: 0 },
  questionHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  questionText: { flex: 1, fontSize: 14, color: colors.text.primary, lineHeight: 20 },

  explanation: {
    marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.outlineVariant,
  },
  explanationLabel: { fontSize: 12, fontWeight: '600', color: colors.gold, marginBottom: spacing.xs },
  explanationText: { fontSize: 13, color: colors.text.secondary, lineHeight: 20 },
})
