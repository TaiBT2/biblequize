import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useCountdownToMidnight } from './useCountdownToMidnight'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  correctCount: number
  totalCount: number
  onReview: () => void
}

/**
 * State B daily completed pill — port từ web HR-6.
 * Sage tint, check icon, score, countdown next daily, review button.
 */
export default function DailyCompletedStrip({ correctCount, totalCount, onReview }: Props) {
  const countdown = useCountdownToMidnight()
  const pct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
  const verdict = pct >= 80 ? 'Xuất sắc!' : pct >= 60 ? 'Giỏi lắm!' : 'Cố gắng hơn nhé!'

  return (
    <View style={s.strip}>
      <Text style={s.checkIcon}>✓</Text>
      <View style={s.info}>
        <Text style={s.score}>{correctCount}/{totalCount} đúng — {verdict}</Text>
        <Text style={s.countdown}>Lượt tiếp theo sau {countdown}</Text>
      </View>
      <Pressable
        onPress={onReview}
        accessibilityLabel="Xem lại bài làm"
        accessibilityRole="button"
        style={s.reviewBtn}
      >
        <Text style={s.reviewText}>Xem lại</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(122,184,122,0.12)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(122,184,122,0.3)',
  },
  checkIcon: { fontSize: 28, color: colors.success, fontWeight: typography.weight.bold },
  info: { flex: 1, gap: 2 },
  score: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
  countdown: { fontSize: typography.size.xs, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  reviewBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.success },
  reviewText: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.success },
})
