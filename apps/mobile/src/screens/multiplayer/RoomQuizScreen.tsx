import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { spacing } from '../../theme/spacing'

// RoomQuizScreen reuses QuizScreen with mode='multiplayer'.
// This screen is kept as a potential future override for multiplayer-specific UI
// (e.g., live scoreboard overlay, elimination banners).
// For now, navigation goes directly to QuizScreen with multiplayer params.

export const RoomQuizScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.title}>Room Quiz</Text>
      <Text style={styles.subtitle}>Redirected to QuizScreen</Text>
    </View>
  </SafeAreaView>
)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm },
  subtitle: { fontSize: 15, color: colors.text.muted },
})
