import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useCountdownToMidnight } from './useCountdownToMidnight'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  questionCount?: number
  estimatedMinutes?: number
  onStart: () => void
}

/**
 * State A daily hero (chưa hoàn thành) — port từ web HR-3.
 * Maroon+gold gradient feel, pulsing label, countdown, gold CTA.
 */
export default function FeaturedDailyCard({ questionCount = 5, estimatedMinutes, onStart }: Props) {
  const countdown = useCountdownToMidnight()

  return (
    <View style={s.card}>
      <View style={s.labelRow}>
        <View style={s.pulseDot} />
        <Text style={s.label}>THỬ THÁCH HÔM NAY</Text>
      </View>

      <Text style={s.heading}>{questionCount} câu Kinh Thánh</Text>
      {estimatedMinutes && <Text style={s.meta}>⏱ ~{estimatedMinutes} phút</Text>}

      <View style={s.dotsRow}>
        {Array.from({ length: questionCount }).map((_, i) => (
          <View key={i} style={s.questionDot} />
        ))}
      </View>

      <View style={s.footer}>
        <View>
          <Text style={s.countdownLabel}>Hết hạn sau</Text>
          <Text style={s.countdown}>{countdown}</Text>
        </View>
        <Pressable
          onPress={onStart}
          style={s.cta}
          accessibilityLabel="Vào chơi thử thách hôm nay"
          accessibilityRole="button"
        >
          <Text style={s.ctaText}>Vào chơi ngay →</Text>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#3a1d24', // maroon base
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(232,168,50,0.3)',
    gap: spacing.md,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  label: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.gold, letterSpacing: 2 },
  heading: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  meta: { fontSize: typography.size.sm, color: colors.textSecondary },
  dotsRow: { flexDirection: 'row', gap: 6 },
  questionDot: { width: 28, height: 4, borderRadius: 2, backgroundColor: 'rgba(232,168,50,0.4)' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  countdownLabel: { fontSize: typography.size.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  countdown: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.gold, fontVariant: ['tabular-nums'] },
  cta: { backgroundColor: colors.gold, borderRadius: borderRadius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  ctaText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.onSecondary },
})
