import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { colors, typography } from '../../theme'

interface AvatarProps {
  uri?: string | null
  name?: string
  size?: number
  borderColor?: string
}

export default function Avatar({ uri, name, size = 40, borderColor }: AvatarProps) {
  const initials = name ? name.slice(0, 1).toUpperCase() : '?'

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          borderColor ? { borderWidth: 2, borderColor } : undefined,
        ]}
      />
    )
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
        borderColor ? { borderWidth: 2, borderColor } : undefined,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surfaceContainerHigh },
  fallback: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.gold,
    fontWeight: typography.weight.bold,
  },
})
