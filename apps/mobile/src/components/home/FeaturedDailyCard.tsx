import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native'
import Svg, { Defs, RadialGradient, Stop, Rect, Path, Circle } from 'react-native-svg'
import { useCountdownToMidnight } from './useCountdownToMidnight'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  questionCount?: number
  estimatedMinutes?: number
  globalParticipants?: number
  onStart: () => void
}

/**
 * State A daily hero — match web `FeaturedDailyCard` (home_modern.html `.daily-featured`).
 * Maroon+gold radial atmosphere via SVG defs, gold left-border accent (3px),
 * top-right decorative ornament, pulsing label dot, dot-style question
 * indicator, gold CTA with subtle inset highlight.
 */
export default function FeaturedDailyCard({
  questionCount = 5,
  estimatedMinutes = 3,
  globalParticipants,
  onStart,
}: Props) {
  const countdown = useCountdownToMidnight()
  const pulse = useRef(new Animated.Value(0.5)).current

  // Pulsing dot animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ]),
    ).start()
  }, [pulse])

  const showParticipants = typeof globalParticipants === 'number' && globalParticipants > 0

  return (
    <View style={s.card}>
      {/* Radial gradient atmosphere — maroon top-right + gold bottom-left + dark base */}
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

      {/* Top-right decorative ornament */}
      <Svg
        style={s.ornament}
        width={70}
        height={50}
        viewBox="0 0 70 50"
      >
        <Path d="M5 25 Q20 8 35 25 Q50 42 65 25" stroke="#e8a832" strokeWidth={1} opacity={0.5} fill="none" />
        <Circle cx={35} cy={25} r={2.5} fill="#e8a832" opacity={0.6} />
        <Circle cx={35} cy={12} r={1.2} fill="#e8a832" opacity={0.5} />
        <Circle cx={35} cy={38} r={1.2} fill="#e8a832" opacity={0.5} />
        <Path d="M2 25 L10 25 M60 25 L68 25" stroke="#e8a832" strokeWidth={0.8} opacity={0.4} fill="none" />
      </Svg>

      <View style={s.content}>
        {/* Label row with pulsing dot */}
        <View style={s.labelRow}>
          <Animated.View style={[s.pulseDot, { opacity: pulse }]} />
          <Text style={s.label}>THỬ THÁCH HÔM NAY · MỚI SẴN SÀNG</Text>
        </View>

        {/* Heading + subline */}
        <Text style={s.heading}>Bắt đầu ngày mới với Lời Chúa</Text>
        <Text style={s.subline}>
          {questionCount} câu · {estimatedMinutes} phút · Reset mỗi 24 giờ
        </Text>

        {/* Meta row: dots + question count + clock */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <View style={s.dotsInline}>
              {Array.from({ length: questionCount }).map((_, i) => (
                <View key={i} style={s.questionDot} />
              ))}
            </View>
            <Text style={s.metaText}>{questionCount} câu hỏi</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaIcon}>⏱</Text>
            <Text style={s.metaText}>~{estimatedMinutes} phút</Text>
          </View>
          {showParticipants && (
            <View style={s.metaItem}>
              <Text style={s.metaIcon}>👥</Text>
              <Text style={s.metaText}>{globalParticipants!.toLocaleString()} đã chơi</Text>
            </View>
          )}
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
            accessibilityLabel="Vào chơi thử thách hôm nay"
            accessibilityRole="button"
          >
            {/* Inset highlight overlay top — fake gradient bevel */}
            <View style={s.ctaInsetHighlight} pointerEvents="none" />
            <Text style={s.ctaText}>Vào chơi ngay →</Text>
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
    // RN doesn't support box-shadow with offset Y + spread well on Android;
    // use elevation + shadowColor for cross-platform glow.
    shadowColor: '#e8a832',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  ornament: { position: 'absolute', top: 12, right: 16, opacity: 0.5 },
  content: { padding: spacing.xl, gap: spacing.xs },

  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  pulseDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold,
    shadowColor: colors.gold, shadowOpacity: 0.7, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },
  label: { fontSize: 10, fontWeight: typography.weight.bold, color: colors.gold, letterSpacing: 2 },

  heading: { fontSize: 22, fontWeight: typography.weight.bold, color: colors.textPrimary, letterSpacing: -0.5, lineHeight: 28 },
  subline: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaIcon: { fontSize: 13, color: colors.tertiary },
  metaText: { fontSize: 11, color: colors.textMuted },
  dotsInline: { flexDirection: 'row', gap: 4 },
  questionDot: {
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5, borderColor: 'rgba(232,168,50,0.5)',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 11,
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
    fontSize: 13,
    fontWeight: typography.weight.bold,
    color: '#1a1208',
    letterSpacing: 0.2,
  },
})
