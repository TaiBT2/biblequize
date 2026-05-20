import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, typography, spacing, borderRadius } from '../../theme'

interface Props {
  onStartDaily: () => void
}

/**
 * Onboarding nudge cho brand-new user (port web apps/web/src/components/
 * MotivationCard.tsx). HomeScreen gate render qua isNewUser + no engagement
 * signals (xem HomeScreen logic).
 */
export default function MotivationCard({ onStartDaily }: Props) {
  const { t } = useTranslation()

  return (
    <View style={s.card} testID="motivation-card">
      <View style={s.row}>
        <View style={s.iconBox}>
          <Text style={s.iconText}>💡</Text>
        </View>

        <View style={s.body}>
          <View style={s.titleRow}>
            <View style={s.stepBadge}>
              <Text style={s.stepText}>{t('home.motivation.step')}</Text>
            </View>
            <Text style={s.title} numberOfLines={2}>{t('home.motivation.title')}</Text>
          </View>
          <Text style={s.desc} numberOfLines={3}>{t('home.motivation.description')}</Text>
        </View>
      </View>

      <Pressable
        onPress={onStartDaily}
        style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
        testID="motivation-card-cta"
      >
        <Text style={s.ctaText}>{t('home.motivation.cta')}</Text>
        <Text style={s.ctaArrow}>→</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.20)',
    backgroundColor: 'rgba(96,165,250,0.08)',
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 44, height: 44, borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(96,165,250,0.20)',
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 22 },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  stepBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  stepText: { fontSize: 10, fontWeight: typography.weight.bold, color: '#93c5fd' },
  title: { flex: 1, fontSize: 14, fontWeight: typography.weight.bold, color: colors.textPrimary, lineHeight: 19 },
  desc: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.30)',
    backgroundColor: 'rgba(96,165,250,0.10)',
  },
  ctaPressed: { backgroundColor: 'rgba(96,165,250,0.18)' },
  ctaText: { fontSize: 13, fontWeight: typography.weight.bold, color: '#93c5fd' },
  ctaArrow: { fontSize: 14, color: '#93c5fd', fontWeight: typography.weight.bold },
})
