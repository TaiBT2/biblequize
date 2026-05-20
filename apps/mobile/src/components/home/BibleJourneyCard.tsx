import React from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Svg, { Path, Rect } from 'react-native-svg'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface BookProgress {
  book: string
  bookVi: string
  order: number
  testament: 'OLD' | 'NEW'
  totalQuestions: number
  masteredQuestions: number
  masteryPercent: number
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED'
}

interface JourneyData {
  summary: {
    totalBooks: number
    completedBooks: number
    inProgressBooks: number
    lockedBooks: number
    overallMasteryPercent: number
    oldTestamentCompleted: number
    newTestamentCompleted: number
    currentBook: string | null
  }
  books?: BookProgress[]
}

interface Props {
  onPress?: () => void
}

const VISIBLE_CHIPS = 6

/**
 * Bible Journey card — port web apps/web/src/components/BibleJourneyCard.tsx.
 * Horizontal scroll row of book chips (6 visible + overflow). Current
 * (IN_PROGRESS) chip gold-highlight, completed có ✓, locked có 🔒 icon.
 * Endpoint /api/me/journey?language=X shared với web (queryKey same).
 */
export default function BibleJourneyCard({ onPress }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const { data } = useQuery<JourneyData>({
    queryKey: ['journey-summary', lang],
    queryFn: () => apiClient.get(`/api/me/journey?language=${lang}`).then(r => r.data),
    staleTime: 60_000,
  })

  if (!data) return null

  const summary = data.summary
  const books = data.books ?? []
  const totalDone = summary.completedBooks
  const total = summary.totalBooks || 66
  const isVi = lang !== 'en'

  const currentBookEntry = books.find(b => b.book === summary.currentBook)
  const localizedName = (b: BookProgress | undefined) =>
    !b ? '' : isVi ? b.bookVi || b.book : b.book || b.bookVi
  const currentLabel = localizedName(currentBookEntry) || summary.currentBook || ''

  const visible = books.slice(0, VISIBLE_CHIPS)
  const remaining = Math.max(0, books.length - VISIBLE_CHIPS)

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && s.cardPressed]}>
      <View style={s.headerRow}>
        <View style={s.titleRow}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d="M9 5l-6 2v14l6-2 6 2 6-2V5l-6 2-6-2z" fill="none" stroke="#e8a832" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M9 5v14M15 7v14" fill="none" stroke="#e8a832" strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <Text style={s.title}>{t('home.journey.title')}</Text>
        </View>
        <Text style={s.meta}>
          <Text style={s.metaCount}>{totalDone}</Text>
          <Text style={s.metaSuffix}> {t('home.journeyExtra.metaCountSuffix', { total })}</Text>
        </Text>
      </View>

      {currentLabel ? (
        <Text style={s.currentLabel}>{t('home.journeyExtra.metaCurrent', { book: currentLabel })}</Text>
      ) : null}

      <Text style={s.subline}>{t('home.journeyExtra.subUnlock')}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
        {visible.map(b => <BookChip key={b.book} book={b} isVi={isVi} />)}
        {remaining > 0 && (
          <View style={[s.chip, s.chipLocked]}>
            <Text style={s.chipOrder}>…</Text>
            <Text style={s.chipName}>{t('home.journeyExtra.overflowLabel', { remaining })}</Text>
            <Text style={s.chipStatus}>{t('home.journeyExtra.overflowSub')}</Text>
            <View style={s.chipBar} />
          </View>
        )}
      </ScrollView>
    </Pressable>
  )
}

function BookChip({ book, isVi }: { book: BookProgress; isVi: boolean }) {
  const { t } = useTranslation()
  const displayName = isVi ? (book.bookVi || book.book) : (book.book || book.bookVi)
  const isCurrent = book.status === 'IN_PROGRESS'
  const isLocked = book.status === 'LOCKED'
  const isDone = book.status === 'COMPLETED'

  const testamentName = t(book.testament === 'OLD' ? 'home.journeyExtra.testamentOld' : 'home.journeyExtra.testamentNew')
  const orderLabel = isCurrent ? `${testamentName} · ${String(book.order).padStart(2, '0')}` : String(book.order).padStart(2, '0')

  const pct = Math.round(book.masteryPercent)
  const status = isCurrent
    ? t('home.journeyExtra.statusInProgress', { pct })
    : isDone
      ? t('home.journeyExtra.statusDone', { pct })
      : t('home.journeyExtra.statusLocked')

  const fillPct = Math.max(0, Math.min(100, book.masteryPercent))

  return (
    <View style={[
      s.chip,
      isCurrent && s.chipCurrent,
      isLocked && s.chipLocked,
    ]}>
      <Text style={[s.chipOrder, isCurrent && s.chipOrderGold]}>{orderLabel}</Text>
      <View style={s.chipNameRow}>
        {isLocked ? (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke={colors.textMuted} strokeWidth={2} />
            <Path d="M8 11V7a4 4 0 018 0v4" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        ) : isDone ? (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path d="M5 13l4 4L19 7" fill="none" stroke="#7AB87A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        ) : (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path d="M4 5v15a2 2 0 002 2h14V3H6a2 2 0 00-2 2z" fill="none" stroke={isCurrent ? '#f5e3a8' : colors.textPrimary} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        )}
        <Text style={[s.chipName, isCurrent && s.chipNameCurrent]} numberOfLines={1}>{displayName}</Text>
      </View>
      <Text style={[s.chipStatus, isCurrent && s.chipStatusCurrent]}>{status}</Text>
      <View style={s.chipBar}>
        {(isCurrent || isDone) && fillPct > 0 && (
          <View style={[s.chipBarFill, { width: `${fillPct}%` }]} />
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(245,240,230,0.06)',
    backgroundColor: 'rgba(24,26,36,0.55)',
    padding: spacing.lg,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.9 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  title: { fontSize: 16, fontWeight: typography.weight.bold, color: colors.textPrimary, letterSpacing: -0.3 },
  meta: { fontSize: 12, color: colors.textMuted, fontWeight: typography.weight.medium },
  metaCount: { color: colors.gold, fontWeight: typography.weight.black, fontSize: 16, fontVariant: ['tabular-nums'] },
  metaSuffix: { color: colors.textMuted },
  currentLabel: { fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', marginTop: -2 },
  subline: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.sm },

  chipsRow: { gap: 10, paddingBottom: 4, paddingRight: spacing.lg },
  chip: {
    width: 138,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(245,240,230,0.025)',
    borderWidth: 1, borderColor: 'rgba(245,240,230,0.06)',
  },
  chipCurrent: {
    backgroundColor: 'rgba(232,168,50,0.05)',
    borderColor: 'rgba(232,168,50,0.45)',
    shadowColor: '#e8a832', shadowOpacity: 0.25, shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  chipLocked: { opacity: 0.45 },
  chipOrder: { fontSize: 9, fontWeight: typography.weight.bold, color: colors.textMuted, letterSpacing: 1.6, textTransform: 'uppercase' },
  chipOrderGold: { color: '#d97706' },
  chipNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  chipName: { flex: 1, fontSize: 13, fontWeight: typography.weight.bold, color: colors.textPrimary, letterSpacing: -0.2 },
  chipNameCurrent: { color: '#f5e3a8' },
  chipStatus: { fontSize: 11, color: colors.textMuted, marginTop: 6, fontWeight: typography.weight.medium },
  chipStatusCurrent: { color: colors.tertiary },
  chipBar: { height: 3, borderRadius: 1.5, marginTop: 6, backgroundColor: 'rgba(245,240,230,0.05)', overflow: 'hidden' },
  chipBarFill: { height: '100%', backgroundColor: colors.gold },
})
