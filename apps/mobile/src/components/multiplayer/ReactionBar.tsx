import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native'
import { colors, spacing, borderRadius, typography } from '../../theme'

export const REACTIONS = ['👏', '😂', '😱', '🔥', '💪', '🙏'] as const
export type ReactionEmoji = (typeof REACTIONS)[number]

export interface IncomingReaction {
  /** Unique key cho dedup + animation lifecycle. */
  id: string
  senderName: string
  reaction: string
}

interface Props {
  onSend: (reaction: ReactionEmoji) => void
  incoming: IncomingReaction[]
  /** Notify parent reaction can be cleared (after 2s float). */
  onClear: (id: string) => void
}

const SEND_COOLDOWN_MS = 1500
const FLOAT_DURATION_MS = 2000
const MAX_VISIBLE = 6

/**
 * Bottom reaction bar + floating incoming reaction layer.
 * Parent manages incoming queue (from REACTION event); ReactionBar handles
 * the visual animation lifecycle + send cooldown.
 *
 * BE rate-limits send 3/10s; client adds 1.5s soft cooldown to avoid spam.
 */
export default function ReactionBar({ onSend, incoming, onClear }: Props) {
  const [cooldownUntil, setCooldownUntil] = useState(0)

  const handleSend = (r: ReactionEmoji) => {
    const now = Date.now()
    if (now < cooldownUntil) return
    setCooldownUntil(now + SEND_COOLDOWN_MS)
    onSend(r)
  }

  const disabled = Date.now() < cooldownUntil

  return (
    <>
      {/* Floating layer (above answers, below modals) */}
      <View pointerEvents="none" style={s.floatLayer}>
        {incoming.slice(-MAX_VISIBLE).map(item => (
          <FloatingReaction key={item.id} item={item} onClear={onClear} />
        ))}
      </View>

      {/* Sticky bar */}
      <View style={s.bar}>
        {REACTIONS.map(r => (
          <Pressable
            key={r}
            onPress={() => handleSend(r)}
            disabled={disabled}
            style={[s.btn, disabled && s.btnDisabled]}
          >
            <Text style={s.emoji}>{r}</Text>
          </Pressable>
        ))}
      </View>
    </>
  )
}

function FloatingReaction({ item, onClear }: { item: IncomingReaction; onClear: (id: string) => void }) {
  const translateY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: FLOAT_DURATION_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: FLOAT_DURATION_MS, useNativeDriver: true }),
    ]).start(() => onClear(item.id))
  }, [item.id, opacity, translateY, onClear])

  return (
    <Animated.View style={[s.floatItem, { transform: [{ translateY }], opacity }]}>
      <Text style={s.floatEmoji}>{item.reaction}</Text>
      <Text style={s.floatName}>{item.senderName}</Text>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  floatLayer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  floatItem: { alignItems: 'center' },
  floatEmoji: { fontSize: 32 },
  floatName: { fontSize: typography.size.xs, color: colors.textPrimary, fontWeight: typography.weight.bold },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  emoji: { fontSize: 22 },
})
