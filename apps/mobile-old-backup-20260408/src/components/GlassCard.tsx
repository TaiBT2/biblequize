import { View, StyleSheet, type ViewProps } from 'react-native'
import { colors } from '../theme/colors'
import { borderRadius } from '../theme/spacing'

interface GlassCardProps extends ViewProps {
  children: React.ReactNode
}

export const GlassCard = ({ children, style, ...props }: GlassCardProps) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
)

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
})
