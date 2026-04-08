import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface JourneyBook {
  bookCode: string
  bookName: string
  testament: 'OT' | 'NT'
  totalQuestions: number
  answeredCorrectly: number
  mastery: number
  unlocked: boolean
}

interface JourneyData {
  summary: {
    totalBooks: number
    completedBooks: number
    overallMastery: number
  }
  books: JourneyBook[]
}

type Testament = 'OT' | 'NT'

export default function JourneyMapScreen() {
  const navigation = useNavigation<any>()
  const [activeTab, setActiveTab] = useState<Testament>('OT')

  const { data, isLoading, error, refetch } = useQuery<JourneyData>({
    queryKey: ['journey'],
    queryFn: () => apiClient.get('/api/me/journey').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Loading journey...</Text>
        </View>
      </SafeScreen>
    )
  }

  if (error) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>Failed to load journey</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeScreen>
    )
  }

  const summary = data?.summary
  const books = (data?.books ?? []).filter(b => b.testament === activeTab)

  return (
    <SafeScreen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.title}>Bible Journey</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Summary Card */}
        {summary && (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{summary.completedBooks}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{summary.totalBooks}</Text>
                <Text style={styles.statLabel}>Total Books</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{summary.overallMastery}%</Text>
                <Text style={styles.statLabel}>Mastery</Text>
              </View>
            </View>
            <ProgressBar progress={summary.overallMastery} height={8} />
          </Card>
        )}

        {/* OT / NT Tabs */}
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setActiveTab('OT')}
            style={[styles.tab, activeTab === 'OT' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'OT' && styles.tabTextActive]}>
              Old Testament
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('NT')}
            style={[styles.tab, activeTab === 'NT' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'NT' && styles.tabTextActive]}>
              New Testament
            </Text>
          </Pressable>
        </View>

        {/* Book Cards */}
        {books.map((book) => (
          <Pressable
            key={book.bookCode}
            onPress={() => {
              if (book.unlocked) {
                navigation.navigate('QuizTab', {
                  screen: 'PracticeSelect',
                  params: { book: book.bookCode },
                })
              }
            }}
            disabled={!book.unlocked}
            style={({ pressed }) => [pressed && book.unlocked && styles.pressed]}
          >
            <Card style={{...styles.bookCard, ...(!book.unlocked ? styles.bookLocked : {})}}>
              <View style={styles.bookHeader}>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookName}>{book.bookName}</Text>
                  <Text style={styles.bookStats}>
                    {book.answeredCorrectly}/{book.totalQuestions} questions
                  </Text>
                </View>
                {book.unlocked ? (
                  <Text style={styles.masteryText}>{book.mastery}%</Text>
                ) : (
                  <Text style={styles.lockIcon}>🔒</Text>
                )}
              </View>
              {book.unlocked && (
                <ProgressBar
                  progress={book.mastery}
                  height={6}
                  color={book.mastery >= 80 ? colors.success : colors.gold}
                />
              )}
            </Card>
          </Pressable>
        ))}

        {books.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No books found</Text>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing.md },
  errorIcon: { fontSize: typography.size['3xl'], fontWeight: typography.weight.bold, color: colors.error, marginBottom: spacing.md },
  errorText: { fontSize: typography.size.base, color: colors.textSecondary, marginBottom: spacing.lg },
  retryBtn: { backgroundColor: colors.gold, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  retryText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.onSecondary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18, color: colors.textPrimary, fontWeight: typography.weight.bold },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary },
  placeholder: { width: 36 },
  summaryCard: { marginBottom: spacing.xl },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.gold },
  statLabel: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.xs },
  tabs: { flexDirection: 'row', marginBottom: spacing.lg, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, padding: spacing.xs },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.md },
  tabActive: { backgroundColor: colors.gold },
  tabText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted },
  tabTextActive: { color: colors.onSecondary },
  bookCard: { marginBottom: spacing.md },
  bookLocked: { opacity: 0.5 },
  bookHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  bookInfo: { flex: 1 },
  bookName: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  bookStats: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: spacing.xs },
  masteryText: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.gold },
  lockIcon: { fontSize: 20 },
  pressed: { opacity: 0.8 },
  empty: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyText: { fontSize: typography.size.base, color: colors.textMuted },
})
