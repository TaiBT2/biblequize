import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { colors, typography, spacing, borderRadius } from '../../theme'

type Theme = 'blue' | 'gold'

interface Props {
  theme: Theme
  icon: string
  title: string
  description: string
  /** Top-right badge (status chip / unlock label / etc). */
  badge?: string
  /** Footer left meta (e.g. "100/100 năng lượng"). */
  meta?: string
  /** Footer right CTA label (with → arrow). */
  ctaLabel: string
  onPress: () => void
  disabled?: boolean
  testID?: string
}

const TOKENS: Record<Theme, {
  bg: string; border: string;
  iconBg: string; iconBorder: string; iconColor: string;
  arrowColor: string;
  badgeColor: string;
}> = {
  blue: {
    bg: 'rgba(50,52,64,0.4)',
    border: 'rgba(232,168,50,0.10)',
    iconBg: 'rgba(96,165,250,0.20)',
    iconBorder: 'rgba(96,165,250,0.30)',
    iconColor: '#60a5fa',
    arrowColor: '#60a5fa',
    badgeColor: 'rgba(225,225,241,0.4)',
  },
  gold: {
    bg: 'rgba(50,52,64,0.4)',
    border: 'rgba(232,168,50,0.30)',
    iconBg: 'rgba(232,168,50,0.20)',
    iconBorder: 'rgba(232,168,50,0.30)',
    iconColor: '#e8a832',
    arrowColor: '#e8a832',
    badgeColor: '#e8a832',
  },
}

/**
 * Featured "core experience" mode card — port web apps/web/src/components/
 * FeaturedCard.tsx. Dùng cho Practice + Ranked trên Home (section "Chế độ
 * chơi chính"). Layout:
 *
 *   ┌─────────────────────────────────────────┐
 *   │ [icon] Title                  badge     │
 *   │        Description                       │
 *   ├──────────────────────────────────────────│
 *   │ meta                       cta →         │
 *   └──────────────────────────────────────────┘
 */
export default function FeaturedModeCard({
  theme, icon, title, description, badge, meta, ctaLabel, onPress, disabled, testID,
}: Props) {
  const k = TOKENS[theme]

  // Gold theme: thêm gradient overlay subtle. RN không support multi-bg
  // gradient native — dùng single bg + border gold để gợi ý featured state.
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.card,
        { backgroundColor: k.bg, borderColor: k.border },
        theme === 'gold' && s.cardGoldOverlay,
        disabled && s.disabled,
        pressed && !disabled && s.pressed,
      ]}
    >
      {/* Top row: icon + title/desc + badge */}
      <View style={s.topRow}>
        <View style={s.iconTitleRow}>
          <View style={[s.iconBox, { backgroundColor: k.iconBg, borderColor: k.iconBorder }]}>
            <Text style={[s.iconText, { color: k.iconColor }]}>{icon}</Text>
          </View>
          <View style={s.titleBlock}>
            <Text style={s.title} numberOfLines={1}>{title}</Text>
            <Text style={s.desc} numberOfLines={1}>{description}</Text>
          </View>
        </View>
        {badge && (
          <Text style={[s.badge, { color: k.badgeColor }]} numberOfLines={1}>{badge}</Text>
        )}
      </View>

      {/* Footer: meta + cta arrow */}
      <View style={s.footer}>
        <Text style={s.meta} numberOfLines={1}>{meta ?? ' '}</Text>
        <View style={s.ctaRow}>
          <Text style={[s.ctaLabel, { color: k.arrowColor }]}>{ctaLabel}</Text>
          <Text style={[s.ctaArrow, { color: k.arrowColor }]}>→</Text>
        </View>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 120,
  },
  cardGoldOverlay: {
    // RN tinted background approximation cho gold gradient overlay.
    backgroundColor: 'rgba(58,52,48,0.42)',
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85, transform: [{ translateY: 1 }] },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  iconTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  iconBox: {
    width: 40, height: 40, borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 20 },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: typography.weight.bold, color: colors.textPrimary, letterSpacing: -0.2 },
  desc: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  badge: { fontSize: 9, fontWeight: typography.weight.bold, letterSpacing: 0.5, maxWidth: 80 },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6,
    paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  meta: { flex: 1, fontSize: 10, color: colors.textMuted },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaLabel: { fontSize: 12, fontWeight: typography.weight.bold },
  ctaArrow: { fontSize: 14, fontWeight: typography.weight.bold },
})
