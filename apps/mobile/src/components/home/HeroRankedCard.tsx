import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Defs, RadialGradient, Stop, Rect, Path } from 'react-native-svg'
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
      {/* Radial gold glow + cross/sunburst ornament — web parity với V2
          Radial Glow design. Glow anchored right-center, ornament inside
          glow zone reads như light source. */}
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="hrGlow" cx="85%" cy="55%" rx="65%" ry="80%">
            <Stop offset="0%" stopColor="#e8a832" stopOpacity="0.45" />
            <Stop offset="35%" stopColor="#e8a832" stopOpacity="0.18" />
            <Stop offset="70%" stopColor="#e8a832" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hrGlow)" />
      </Svg>

      {/* Cross + sunburst ornament — cream color reads as light source
          inside gold glow zone. Web hides on <md breakpoint nhưng mobile
          phone modern (~412dp) đủ rộng để render. */}
      <Svg
        style={s.ornament}
        width={140}
        height={140}
        viewBox="0 0 200 200"
        fill="none"
      >
        {/* 8 main sunburst rays */}
        <Path d="M100 100 L100 20 M100 100 L100 180 M100 100 L20 100 M100 100 L180 100 M100 100 L160 40 M100 100 L40 40 M100 100 L160 160 M100 100 L40 160"
          stroke="#fff5dc" strokeWidth={1.5} opacity={0.35} strokeLinecap="round" />
        {/* 8 secondary rays */}
        <Path d="M100 100 L140 25 M100 100 L60 25 M100 100 L175 60 M100 100 L25 60 M100 100 L175 140 M100 100 L25 140 M100 100 L140 175 M100 100 L60 175"
          stroke="#fff5dc" strokeWidth={1} opacity={0.22} strokeLinecap="round" />
        {/* Inner halo circle */}
        <Path d="M100 50 a50 50 0 1 0 0 100 a50 50 0 1 0 0 -100"
          stroke="#fff5dc" strokeWidth={1.2} opacity={0.32} fill="rgba(255,245,220,0.04)" />
        {/* Cross */}
        <Path d="M92 60 L108 60 L108 92 L140 92 L140 108 L108 108 L108 160 L92 160 L92 108 L60 108 L60 92 L92 92 Z"
          fill="#fff5dc" opacity={0.16} />
      </Svg>

      <View style={s.content}>
        <Text style={s.label}>{t('home.heroRanked.label')}</Text>
        <Text style={s.title}>{t('home.ranked')}</Text>
        <Text style={s.tagline}>{t('home.heroRanked.tagline')}</Text>

        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                fill="none" stroke={colors.gold} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={s.statText}>
              {t('home.heroRanked.energyMeta', { remaining: energyRemaining, max: energyMax })}
            </Text>
          </View>
          <View style={s.statItem}>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d="M12 6v6l4 2" fill="none" stroke={colors.gold} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke={colors.gold} strokeWidth={2} />
            </Svg>
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
  ornament: {
    position: 'absolute',
    right: -30, top: '50%', marginTop: -70,
    pointerEvents: 'none',
  },
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
