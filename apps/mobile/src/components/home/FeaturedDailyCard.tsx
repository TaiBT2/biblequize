import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native'
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg'
import { useCountdownToMidnight } from './useCountdownToMidnight'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  questionCount?: number
  estimatedMinutes?: number
  onStart: () => void
}

function formatDayMonth(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function FeaturedDailyCard({
  questionCount = 5,
  estimatedMinutes = 3,
  onStart,
}: Props) {
  const countdown = useCountdownToMidnight()
  const pulse = useRef(new Animated.Value(0.5)).current
  const dayLabel = formatDayMonth(new Date())

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ]),
    ).start()
  }, [pulse])

  return (
    <View style={s.card}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="maroonGlow" cx="90%" cy="0%" rx="70%" ry="50%">
            <Stop offset="0%" stopColor="#7c2d3a" stopOpacity="0.28" />
            <Stop offset="60%" stopColor="#7c2d3a" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="goldGlow" cx="20%" cy="100%" rx="60%" ry="45%">
            <Stop offset="0%" stopColor="#e8a832" stopOpacity="0.12" />
            <Stop offset="60%" stopColor="#e8a832" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="#1c1612" />
        <Rect width="100%" height="100%" fill="url(#maroonGlow)" />
        <Rect width="100%" height="100%" fill="url(#goldGlow)" />
      </Svg>

      <View style={s.content}>
        {/* Label row: dot + label · date */}
        <View style={s.labelRow}>
          <Animated.View style={[s.pulseDot, { opacity: pulse }]} />
          <Text style={s.label}>THỬ THÁCH HÔM NAY</Text>
          <Text style={s.labelDot}>·</Text>
          <Text style={s.labelDate}>{dayLabel}</Text>
        </View>

        {/* Heading with "Lời Chúa" gold italic emphasis */}
        <Text style={s.heading} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          Bắt đầu ngày mới với <Text style={s.headingAccent}>Lời Chúa</Text>
        </Text>

        {/* Pill chips */}
        <View style={s.pillRow}>
          <View style={s.pill}>
            <Text style={s.pillIcon}>📖</Text>
            <Text style={s.pillText} numberOfLines={1}>{questionCount} câu</Text>
          </View>
          <View style={s.pill}>
            <Text style={s.pillIcon}>⏱</Text>
            <Text style={s.pillText} numberOfLines={1}>~{estimatedMinutes} phút</Text>
          </View>
          <View style={[s.pill, s.pillShrink]}>
            <Text style={s.pillIcon}>🌐</Text>
            <Text style={s.pillText} numberOfLines={1}>Cùng cộng đồng</Text>
          </View>
        </View>

        {/* Reward block */}
        <View style={s.reward}>
          <Text style={s.rewardIcon}>🏆</Text>
          <Text style={s.rewardText}>
            <Text style={s.rewardLabel}>Phần thưởng: </Text>
            <Text style={s.rewardValue}>+50 XP</Text>
          </Text>
        </View>

        {/* Footer: countdown + CTA */}
        <View style={s.footer}>
          <View style={s.countdownBlock}>
            <Text style={s.countdownLabel}>CÒN LẠI TRONG NGÀY</Text>
            <Text style={s.countdownValue}>{countdown}</Text>
          </View>
          <Pressable
            onPress={onStart}
            style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
            accessibilityLabel="Bắt đầu thử thách hôm nay"
            accessibilityRole="button"
          >
            <View style={s.ctaInsetHighlight} pointerEvents="none" />
            <Text style={s.ctaText}>Bắt đầu  →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232,168,50,0.18)',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    shadowColor: '#e8a832',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  content: { padding: spacing.xl },

  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  pulseDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold,
    shadowColor: colors.gold, shadowOpacity: 0.7, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },
  label: { fontSize: 10, fontWeight: typography.weight.bold, color: colors.gold, letterSpacing: 2 },
  labelDot: { fontSize: 10, color: colors.gold, opacity: 0.5 },
  labelDate: { fontSize: 10, fontWeight: typography.weight.semibold, color: colors.textMuted, letterSpacing: 1 },

  heading: {
    fontSize: 17, fontWeight: typography.weight.bold, color: colors.textPrimary,
    letterSpacing: -0.5, lineHeight: 22, marginBottom: spacing.md,
  },
  headingAccent: {
    color: colors.gold,
    fontStyle: 'italic',
    fontWeight: typography.weight.bold,
  },

  pillRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: 6, marginBottom: spacing.md },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.20)',
    backgroundColor: 'rgba(232,168,50,0.06)',
  },
  pillShrink: { flexShrink: 1 },
  pillIcon: { fontSize: 10 },
  pillText: { fontSize: 11, color: colors.textMuted },

  reward: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.25)',
    backgroundColor: 'rgba(232,168,50,0.08)',
    marginBottom: spacing.md,
  },
  rewardIcon: { fontSize: 16 },
  rewardText: { fontSize: 13, color: colors.textPrimary },
  rewardLabel: { color: colors.textMuted },
  rewardValue: { color: colors.gold, fontWeight: typography.weight.bold },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  countdownBlock: { gap: 2 },
  countdownLabel: {
    fontSize: 10, fontWeight: typography.weight.semibold,
    letterSpacing: 1.2, color: 'rgba(225,225,241,0.55)',
  },
  countdownValue: {
    fontSize: 18, fontWeight: typography.weight.bold,
    color: colors.tertiary, fontVariant: ['tabular-nums'], letterSpacing: 0.6,
  },

  cta: {
    backgroundColor: '#e8a832',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#e8a832',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaPressed: { opacity: 0.85, transform: [{ translateX: 2 }] },
  ctaInsetHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,220,140,0.5)',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: typography.weight.bold,
    color: '#1a1208',
    letterSpacing: 0.2,
  },
})
