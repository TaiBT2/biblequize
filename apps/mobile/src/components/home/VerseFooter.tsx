import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import { getDailyVerse, type DailyVerse } from '../../data/dailyVerse'
import { colors, typography, spacing } from '../../theme'

interface Props {
  /** Override verse cho test/preview. */
  verse?: DailyVerse
  /** Translation note (BTTHĐ 2011 canonical per CLAUDE.md C4). */
  source?: string
}

/**
 * Daily verse footer — port web `apps/web/src/components/VerseFooter.tsx`.
 * Ornament gold-gradient line · star · line ở trên, italic serif verse text
 * giữa, em-dash uppercase cite below. RN không có Cormorant Garamond bundled
 * → fallback serif italic system font (vẫn giữ aesthetic vẻ devotional).
 */
export default function VerseFooter({ verse, source = 'BTTHĐ 2011' }: Props) {
  const v = verse ?? getDailyVerse()
  return (
    <View style={s.section}>
      {/* Ornament: gradient line · star · gradient line */}
      <View style={s.ornament}>
        <Svg width={120} height={2} style={s.line}>
          <Defs>
            <LinearGradient id="vfLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="rgba(232,168,50,0)" />
              <Stop offset="50%" stopColor="rgba(232,168,50,0.6)" />
              <Stop offset="100%" stopColor="rgba(232,168,50,0)" />
            </LinearGradient>
          </Defs>
          <Rect width="120" height="2" fill="url(#vfLine)" />
        </Svg>
        <Svg width={18} height={18} viewBox="0 0 24 24" style={s.star}>
          <Path
            d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"
            fill="none" stroke="#e8a832" strokeWidth={1.6}
            strokeLinecap="round" strokeLinejoin="round" opacity={0.85}
          />
        </Svg>
        <Svg width={120} height={2} style={s.line}>
          <Defs>
            <LinearGradient id="vfLine2" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="rgba(232,168,50,0)" />
              <Stop offset="50%" stopColor="rgba(232,168,50,0.6)" />
              <Stop offset="100%" stopColor="rgba(232,168,50,0)" />
            </LinearGradient>
          </Defs>
          <Rect width="120" height="2" fill="url(#vfLine2)" />
        </Svg>
      </View>

      <Text style={s.text}>{v.text}</Text>

      <Text style={s.cite}>
        <Text style={s.dashFaint}>—</Text>
        <Text style={s.citeText}>  {v.ref} · {source}  </Text>
        <Text style={s.dashFaint}>—</Text>
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  section: { marginTop: spacing.xl, paddingTop: spacing.lg, alignItems: 'center' },
  ornament: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  line: { flexShrink: 0 },
  star: { flexShrink: 0 },
  text: {
    // Cormorant Garamond không bundled — dùng serif system font + italic
    // để giữ devotional aesthetic. Web HR-1 typography rule cho phép
    // (mobile fallback acceptable).
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontStyle: 'italic',
    fontSize: 18,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
    maxWidth: 360,
    paddingHorizontal: spacing.lg,
    lineHeight: 28,
  },
  cite: {
    marginTop: spacing.md,
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  dashFaint: { color: 'rgba(225,225,241,0.3)' },
  citeText: { color: colors.textMuted },
})
