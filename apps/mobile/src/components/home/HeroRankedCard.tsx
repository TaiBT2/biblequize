import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  energyRemaining: number
  energyMax: number
  rankedAnswered: number
  rankedCap: number
  onEnter: () => void
}

/**
 * State B ranked hero card — port web apps/web/src/components/HeroRankedCard.tsx
 * (V2 Radial Glow). Dark glass base + radial gold glow anchored bottom-center
 * (mobile variant). Title gold-bright với glow text shadow, stats inline row
 * (⚡ năng lượng + 🕒 progress), CTA dark button với gold text.
 *
 * KHÔNG dùng full gold background như trước (was inverted vs web). Web pattern:
 * dark base + gold accents (label dim, title bright, glow halo).
 */
export default function HeroRankedCard({
  energyRemaining, energyMax, rankedAnswered, rankedCap, onEnter,
}: Props) {
  const { t } = useTranslation()

  return (
    <Pressable
      onPress={onEnter}
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      accessibilityLabel="Vào Đấu Hạng"
      accessibilityRole="button"
    >
      {/* Soft blended background — 2 layered radial gradients tạo cảm giác
          card phẳng + warm fade thay vì patches glow/ornament rõ rệt.
          - Layer 1: gold spread rộng cover toàn card, opacity rất nhẹ.
          - Layer 2: highlight đậm hơn tại corner để gợi depth, fade nhanh.
          KHÔNG dùng ornament (user feedback: card hòa vào nhau như web). */}
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="hrGlowWide" cx="50%" cy="50%" rx="120%" ry="100%">
            <Stop offset="0%" stopColor="#e8a832" stopOpacity="0.10" />
            <Stop offset="50%" stopColor="#e8a832" stopOpacity="0.05" />
            <Stop offset="100%" stopColor="#e8a832" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="hrGlowAccent" cx="100%" cy="0%" rx="60%" ry="80%">
            <Stop offset="0%" stopColor="#e8a832" stopOpacity="0.18" />
            <Stop offset="60%" stopColor="#e8a832" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#e8a832" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hrGlowWide)" />
        <Rect width="100%" height="100%" fill="url(#hrGlowAccent)" />
      </Svg>

      <View style={s.content}>
        <Text style={s.label}>{t('home.heroRanked.label')}</Text>
        <Text style={s.title}>{t('home.ranked')}</Text>
        <Text style={s.tagline}>{t('home.heroRanked.tagline')}</Text>

        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statIcon}>⚡</Text>
            <Text style={s.statText}>
              {t('home.heroRanked.energyMeta', { remaining: energyRemaining, max: energyMax })}
            </Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statIcon}>🕒</Text>
            <Text style={s.statText}>
              {t('home.heroRanked.progressMeta', { answered: rankedAnswered, cap: rankedCap })}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onEnter}
          style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
        >
          <Text style={s.ctaText}>{t('home.heroRanked.cta')}</Text>
          <Text style={s.ctaArrow}>→</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: 'rgba(50,52,64,0.5)',
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.15)',
    padding: spacing.xl,
    overflow: 'hidden',
    // shadow approximation cho boxShadow `0 18px 50px -10px rgba(232,168,50,0.18)`.
    shadowColor: '#e8a832', shadowOpacity: 0.18, shadowRadius: 25,
    shadowOffset: { width: 0, height: 18 }, elevation: 6,
  },
  cardPressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
  content: { gap: 10, position: 'relative', zIndex: 1 },

  label: {
    fontSize: 10, fontWeight: typography.weight.bold,
    letterSpacing: 2.2, textTransform: 'uppercase',
    color: 'rgba(225,225,241,0.55)',
    marginBottom: 2,
  },
  title: {
    fontSize: 30, fontWeight: typography.weight.black,
    color: '#f5d273', // gold-bright
    letterSpacing: -1, lineHeight: 34,
    textShadowColor: 'rgba(232,168,50,0.3)',
    textShadowRadius: 16, textShadowOffset: { width: 0, height: 0 },
  },
  tagline: {
    fontSize: 12, fontWeight: typography.weight.medium,
    color: 'rgba(225,225,241,0.55)',
    marginBottom: 4,
  },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginVertical: spacing.xs },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statIcon: { fontSize: 13, color: colors.gold },
  statText: { fontSize: 12, fontWeight: typography.weight.semibold, color: 'rgba(225,225,241,0.65)' },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a1208',
    paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    borderWidth: 1, borderColor: 'rgba(232,168,50,0.15)',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  ctaPressed: { opacity: 0.9, transform: [{ translateX: 3 }] },
  ctaText: { fontSize: 15, fontWeight: typography.weight.bold, color: colors.gold, letterSpacing: 0.2 },
  ctaArrow: { fontSize: 16, color: colors.gold, fontWeight: typography.weight.bold },
})
