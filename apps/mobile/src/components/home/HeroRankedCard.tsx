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
      {/* Blended background — 3 layered radials tạo warm fade từ giữa ra
          rìa + accent corner. Không có hard edges, card hòa vào parent
          background tối. */}
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          {/* Center spread — warmth lan tỏa toàn card */}
          <RadialGradient id="hrGlowCenter" cx="50%" cy="50%" rx="140%" ry="110%">
            <Stop offset="0%" stopColor="#e8a832" stopOpacity="0.14" />
            <Stop offset="45%" stopColor="#e8a832" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#e8a832" stopOpacity="0" />
          </RadialGradient>
          {/* Top accent — gold corner highlight depth */}
          <RadialGradient id="hrGlowTop" cx="80%" cy="-10%" rx="80%" ry="90%">
            <Stop offset="0%" stopColor="#e8a832" stopOpacity="0.22" />
            <Stop offset="55%" stopColor="#e8a832" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#e8a832" stopOpacity="0" />
          </RadialGradient>
          {/* Subtle border-gradient replacement — tô tint nhẹ rìa */}
          <RadialGradient id="hrEdgeFade" cx="50%" cy="50%" rx="95%" ry="95%">
            <Stop offset="80%" stopColor="#e8a832" stopOpacity="0" />
            <Stop offset="100%" stopColor="#e8a832" stopOpacity="0.10" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hrGlowCenter)" />
        <Rect width="100%" height="100%" fill="url(#hrGlowTop)" />
        <Rect width="100%" height="100%" fill="url(#hrEdgeFade)" />
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
    // Bg gần đen mờ hơn để blend vào surrounding screen bg. Trước
    // rgba(50,52,64,0.5) tạo hard edge "box" rõ. Giảm xuống 0.18 + bỏ
    // border visible → card chỉ là tint khác biệt subtle với surrounding.
    backgroundColor: 'rgba(40,38,46,0.35)',
    borderRadius: 20,
    // Border gradient mềm via SVG layer phía dưới (xem hrGlowAccent).
    // KHÔNG dùng borderWidth solid (tạo edge cứng).
    padding: spacing.xl,
    overflow: 'hidden',
    // Outer gold shadow bleed rộng vào surrounding để card "hòa" vào
    // background tối thay vì cắt ra như box.
    shadowColor: '#e8a832', shadowOpacity: 0.22, shadowRadius: 40,
    shadowOffset: { width: 0, height: 8 }, elevation: 8,
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
