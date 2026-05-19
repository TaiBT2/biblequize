import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import ProgressBar from '../ui/ProgressBar'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  energyRemaining: number
  energyMax: number
  rankedAnswered: number
  rankedCap: number
  onEnter: () => void
}

/**
 * State B ranked hero card (port từ web HR-4).
 * Full gold gradient, dark text overlay, energy + ranked progress, dark CTA.
 */
export default function HeroRankedCard({ energyRemaining, energyMax, rankedAnswered, rankedCap, onEnter }: Props) {
  const energyPct = energyMax > 0 ? (energyRemaining / energyMax) * 100 : 0
  const rankedPct = rankedCap > 0 ? (rankedAnswered / rankedCap) * 100 : 0

  return (
    <View style={s.card}>
      <Text style={s.label}>SẴN SÀNG ĐẤU HẠNG</Text>
      <Text style={s.title}>Đấu Hạng</Text>
      <Text style={s.subtitle}>Tranh tài xếp hạng — energy {energyRemaining}/{energyMax}</Text>

      <View style={s.progressBlock}>
        <Text style={s.progressLabel}>⚡ Năng lượng</Text>
        <ProgressBar progress={energyPct} height={6} />
      </View>

      <View style={s.progressBlock}>
        <Text style={s.progressLabel}>📊 Câu hôm nay {rankedAnswered}/{rankedCap}</Text>
        <ProgressBar progress={rankedPct} height={6} />
      </View>

      <Pressable
        onPress={onEnter}
        style={s.cta}
        accessibilityLabel="Vào Đấu Hạng"
        accessibilityRole="button"
      >
        <Text style={s.ctaText}>Vào trận →</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    gap: spacing.sm,
    shadowColor: colors.gold,
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  label: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: 'rgba(65,45,0,0.7)', letterSpacing: 2 },
  title: { fontSize: typography.size['3xl'], fontWeight: typography.weight.black, color: colors.onSecondary },
  subtitle: { fontSize: typography.size.sm, color: 'rgba(65,45,0,0.7)' },
  progressBlock: { marginTop: spacing.sm, gap: 4 },
  progressLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.onSecondary },
  cta: { backgroundColor: colors.onSecondary, borderRadius: borderRadius.full, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  ctaText: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.gold },
})
