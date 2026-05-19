import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useAuthStore } from '../../stores/authStore'
import { getTierProgress } from '../../logic/tierProgression'
import { colors, typography, spacing } from '../../theme'

interface Props {
  totalPoints: number
  streak: number
  energyRemaining?: number
  energyMax?: number
  seasonPoints?: number
}

type StatIcon = '🔥' | '⚡' | '🏆'

/**
 * Mobile port của web HomeBanner (HR-2 Modern Spiritual `.banner`).
 *
 * Visual contract:
 * - Card: linear-gradient bg (135deg) + top-left gold radial glow + bottom accent line (SVG)
 * - Avatar 64px: gold gradient circle (SVG defs) với initial letter + dashed gold ring outer
 * - Greeting uppercase tracked + name 22px sans-extrabold
 * - Tier row: current (gold) → next (dim) + 5px gradient progress bar với terminal dot + tabular XP
 * - 3 stats với vertical borders: emoji + sans-extrabold tabular number + uppercase tracked label
 */
export default function HomeBanner({
  totalPoints, streak, energyRemaining, energyMax, seasonPoints,
}: Props) {
  const navigation = useNavigation<any>()
  const { user } = useAuthStore()
  const tier = getTierProgress(totalPoints)
  const userName = user?.name || 'Bạn'
  const initial = userName.charAt(0).toUpperCase()
  const isMaxTier = tier.next === null

  const greeting = (() => {
    const hr = new Date().getHours()
    if (hr < 12) return 'CHÀO BUỔI SÁNG'
    if (hr < 18) return 'CHÀO BUỔI CHIỀU'
    return 'CHÀO BUỔI TỐI'
  })()

  return (
    <View style={s.card}>
      {/* Background atmosphere — linear gradient + top-left gold glow + bottom accent */}
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="bannerBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#28201c" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#181a24" stopOpacity="0.4" />
          </LinearGradient>
          <RadialGradient id="topLeftGlow" cx="-10%" cy="-40%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor="#e8a832" stopOpacity="0.18" />
            <Stop offset="65%" stopColor="#e8a832" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="bottomAccent" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#e8a832" stopOpacity="0" />
            <Stop offset="50%" stopColor="#e8a832" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#e8a832" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="#181a24" fillOpacity="0.55" />
        <Rect width="100%" height="100%" fill="url(#bannerBg)" />
        <Rect width="100%" height="100%" fill="url(#topLeftGlow)" />
        {/* Bottom accent line — 100x1, positioned 30% from left */}
        <Rect x="30%" y="99%" width="35%" height="1" fill="url(#bottomAccent)" />
      </Svg>

      <View style={s.contentRow}>
        {/* Avatar — gold gradient circle với initial + dashed ring */}
        <Pressable
          onPress={() => navigation.navigate('ProfileTab')}
          accessibilityLabel="Mở hồ sơ"
          accessibilityRole="button"
          style={s.avatarWrap}
        >
          <Svg width={64} height={64} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="avatarGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#e8a832" />
                <Stop offset="70%" stopColor="#c98a1c" />
                <Stop offset="100%" stopColor="#7a5818" />
              </LinearGradient>
            </Defs>
            <Rect width={64} height={64} rx={32} fill="url(#avatarGold)" />
          </Svg>
          <Text style={s.avatarLetter}>{initial}</Text>
          <View style={s.avatarRing} pointerEvents="none" />
        </Pressable>

        {/* Info: greeting + name + tier row */}
        <View style={s.info}>
          <Text style={s.greeting}>{greeting}</Text>
          <Text style={s.name} numberOfLines={1}>{userName}</Text>

          {isMaxTier ? (
            <Text style={s.maxTier}>👑 Đã đạt hạng cao nhất</Text>
          ) : (
            <View style={s.tierRow}>
              <Text style={s.tierCurrent}>{tier.current.name}</Text>
              <Text style={s.tierArrow}>→</Text>
              <Text style={s.tierNext} numberOfLines={1}>{tier.next?.name}</Text>
            </View>
          )}
        </View>
      </View>

      {!isMaxTier && (
        <View style={s.progressBlock}>
          <View style={s.progressTrack}>
            <Svg style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="progressFill" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#c98a1c" />
                  <Stop offset="50%" stopColor="#e8a832" />
                  <Stop offset="100%" stopColor="#e7c268" />
                </LinearGradient>
              </Defs>
              <Rect
                width={`${tier.percent}%`}
                height="100%"
                rx={3}
                ry={3}
                fill="url(#progressFill)"
              />
            </Svg>
            {/* Terminal dot at end of fill */}
            <View style={[s.terminalDot, { left: `${Math.max(0, Math.min(100, tier.percent)) - 2}%` }]} />
          </View>
          <Text style={s.xpText}>
            <Text style={s.xpCurrent}>{totalPoints.toLocaleString()}</Text>
            <Text style={s.xpNext}> / {tier.next?.minPoints.toLocaleString()} XP</Text>
          </Text>
        </View>
      )}

      {/* Stats row — 3 columns với vertical borders */}
      <View style={s.statsRow}>
        <Stat icon="🔥" value={streak} label="STREAK" breathe />
        <Stat
          icon="⚡"
          value={energyRemaining ?? 0}
          label="NĂNG LƯỢNG"
        />
        <Stat
          icon="🏆"
          value={seasonPoints ?? totalPoints}
          label={seasonPoints != null ? 'ĐIỂM MÙA' : 'XP'}
        />
      </View>
    </View>
  )
}

interface StatProps {
  icon: StatIcon
  value?: number
  /** Override numeric value với pre-formatted string (vd "40/100"). */
  valueText?: string
  label: string
  /** Apply breath animation (used cho flame icon, web parity animate-breathe). */
  breathe?: boolean
}

function Stat({ icon, value, valueText, label, breathe }: StatProps) {
  const scale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!breathe) return
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start()
  }, [breathe, scale])

  return (
    <View style={s.statItem}>
      <Animated.Text style={[s.statIcon, breathe && { transform: [{ scale }] }]}>
        {icon}
      </Animated.Text>
      <Text style={s.statValue}>
        {valueText ?? (value ?? 0).toLocaleString()}
      </Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232,168,50,0.14)',
    padding: spacing.lg,
    gap: spacing.md,
  },

  contentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  // Avatar
  avatarWrap: { width: 64, height: 64, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: {
    fontSize: 26,
    fontWeight: typography.weight.black,
    color: '#1a1208',
    // Inset shadow approximation
    textShadowColor: 'rgba(255,220,140,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  avatarRing: {
    position: 'absolute',
    top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(232,168,50,0.25)',
  },

  // Info
  info: { flex: 1, gap: 4 },
  greeting: { fontSize: 10, fontWeight: typography.weight.semibold, letterSpacing: 1.8, color: colors.gold },
  name: { fontSize: 22, fontWeight: typography.weight.black, color: colors.textPrimary, letterSpacing: -0.5, lineHeight: 26 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  tierCurrent: { fontSize: 13, fontWeight: typography.weight.bold, color: colors.gold, letterSpacing: 0.2 },
  tierArrow: { fontSize: 12, color: colors.textMuted },
  tierNext: { fontSize: 12, color: colors.textSecondary, fontWeight: typography.weight.medium, flex: 1 },
  maxTier: { fontSize: 13, fontWeight: typography.weight.semibold, color: colors.gold, marginTop: 2 },

  // Progress
  progressBlock: { gap: 6 },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    overflow: 'visible',
  },
  terminalDot: {
    position: 'absolute',
    top: -3,
    width: 11, height: 11,
    borderRadius: 5.5,
    backgroundColor: '#f5e3a8',
    shadowColor: colors.gold,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  xpText: { fontSize: 12, fontVariant: ['tabular-nums'], textAlign: 'right' },
  xpCurrent: { color: colors.gold, fontWeight: typography.weight.bold, fontSize: 13 },
  xpNext: { color: colors.textMuted, fontWeight: typography.weight.medium },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: 'rgba(232,168,50,0.10)',
    gap: 2,
  },
  statIcon: { fontSize: 18, lineHeight: 22 },
  statValue: {
    fontSize: 20,
    fontWeight: typography.weight.black,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: typography.weight.semibold,
    color: 'rgba(225,225,241,0.55)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
