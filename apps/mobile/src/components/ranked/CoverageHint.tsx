import { useTranslation } from 'react-i18next'
import { View, Text, StyleSheet } from 'react-native'
import type { CoverageStatus } from '../../types/coverage'
import { colors, typography, spacing } from '../../theme'

interface CoverageHintProps {
  coverage: CoverageStatus
}

/**
 * Minimal Liturgical Coverage hint for mobile (Option C — Alt C strategy).
 *
 * Shows season name + days remaining + the first uncovered book of the
 * current week ("Hôm nay ôn: [book]"). Full CoverageCard parity (6-book
 * grid, badge ceremony) deferred to v1.1 — tracked in BL-COVERAGE-MOBILE-MIGRATE.
 */
export default function CoverageHint({ coverage }: CoverageHintProps) {
  const { t } = useTranslation()
  const firstUncovered = coverage.currentWeek.books.find((b) => !b.covered)
  const todayBook = firstUncovered?.code ?? coverage.currentWeek.books[0]?.code

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <Text style={s.icon}>📖</Text>
        <Text style={s.seasonName}>{coverage.season.name}</Text>
      </View>
      <Text style={s.remaining}>
        {t('ranked.season_remaining', { days: coverage.season.daysRemaining })}
      </Text>
      {todayBook && (
        <Text style={s.todayBook}>
          {t('ranked.today_book')}: <Text style={s.todayBookName}>{todayBook}</Text>
        </Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(50,52,64,0.4)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(232,168,50,0.12)',
    padding: spacing.lg,
    gap: 4,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { fontSize: 18 },
  seasonName: {
    fontSize: 16,
    fontWeight: typography.weight.black,
    color: colors.textPrimary,
    flex: 1,
  },
  remaining: { fontSize: 12, color: colors.textMuted },
  todayBook: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  todayBookName: { color: colors.gold, fontWeight: typography.weight.bold },
})
