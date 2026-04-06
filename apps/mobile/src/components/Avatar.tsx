import { View, Text, Image, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'

interface AvatarProps {
  uri?: string | null
  name: string
  size?: number
}

export const Avatar = ({ uri, name, size = 40 }: AvatarProps) => {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const fontSize = size * 0.4

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    )
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.bg.surfaceContainerHigh,
  },
  fallback: {
    backgroundColor: colors.bg.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.text.primary,
    fontWeight: '600',
  },
})
