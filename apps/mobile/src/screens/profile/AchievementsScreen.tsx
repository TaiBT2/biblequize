import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import { ProgressBar } from '../../components/ProgressBar'

export const AchievementsScreen = () => {
  const navigation = useNavigation()

  const query = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get('/api/me/achievements').then((r) => r.data),
    retry: false,
  })

  const achievements = query.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Thành Tích</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={achievements}
        keyExtractor={(item: any) => item.id ?? item.type}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có thành tích</Text>
        }
        renderItem={({ item }) => {
          const unlocked = !!item.earnedAt
          const progress = item.target ? (item.progress ?? 0) / item.target : unlocked ? 1 : 0

          return (
            <GlassCard style={[styles.badge, !unlocked && styles.badgeLocked]}>
              <Text style={styles.badgeIcon}>{unlocked ? '🏅' : '🔒'}</Text>
              <Text style={styles.badgeName} numberOfLines={2}>{item.name ?? item.type}</Text>
              {item.target && !unlocked && (
                <ProgressBar progress={progress} height={4} />
              )}
            </GlassCard>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text.primary },

  list: { padding: spacing.xl, paddingBottom: spacing['4xl'] },
  row: { gap: spacing.md, marginBottom: spacing.md },
  emptyText: { color: colors.text.muted, textAlign: 'center', marginTop: spacing['3xl'] },

  badge: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  badgeLocked: { opacity: 0.5 },
  badgeIcon: { fontSize: 32 },
  badgeName: { fontSize: 12, color: colors.text.primary, fontWeight: '500', textAlign: 'center' },
})
