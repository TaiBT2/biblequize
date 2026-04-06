import { View, Text, StyleSheet } from 'react-native'
import { getTierByPoints, type Tier } from '../data/tiers'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

interface TierBadgeProps {
  points: number
  showName?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const TIER_COLORS: Record<string, string> = {
  gray: colors.tier.tanTinHuu,
  green: colors.tier.nguoiTimKiem,
  blue: colors.tier.monDo,
  purple: colors.tier.hienTriet,
  gold: colors.tier.tienTri,
  red: colors.tier.suDo,
}

const SIZES = {
  sm: { icon: 20, text: 11, padding: 4 },
  md: { icon: 28, text: 13, padding: 6 },
  lg: { icon: 40, text: 16, padding: 8 },
}

export const TierBadge = ({ points, showName = true, size = 'md' }: TierBadgeProps) => {
  const tier = getTierByPoints(points)
  const tierColor = TIER_COLORS[tier.color] || colors.text.muted
  const s = SIZES[size]

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            width: s.icon + s.padding * 2,
            height: s.icon + s.padding * 2,
            borderRadius: (s.icon + s.padding * 2) / 2,
            backgroundColor: `${tierColor}20`,
          },
        ]}
      >
        <Text style={{ fontSize: s.icon }}>{tier.icon}</Text>
      </View>
      {showName && (
        <Text style={[styles.name, { fontSize: s.text, color: tierColor }]}>
          {tier.name}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: '600',
  },
})
