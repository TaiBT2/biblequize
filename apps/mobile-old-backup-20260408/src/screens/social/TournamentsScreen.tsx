import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'

type Tab = 'active' | 'upcoming' | 'past'

const STATUS_LABELS: Record<string, string> = {
  LOBBY: 'Chờ',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Kết thúc',
}

export const TournamentsScreen = () => {
  const navigation = useNavigation<any>()
  const [tab, setTab] = useState<Tab>('active')

  const query = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => api.get('/api/tournaments').then((r) => r.data),
  })

  const all = query.data?.content ?? query.data ?? []
  const filtered = all.filter((t: any) => {
    if (tab === 'active') return t.status === 'IN_PROGRESS'
    if (tab === 'upcoming') return t.status === 'LOBBY'
    return t.status === 'COMPLETED'
  })

  const TABS: { key: Tab; label: string }[] = [
    { key: 'active', label: 'Đang diễn ra' },
    { key: 'upcoming', label: 'Sắp tới' },
    { key: 'past', label: 'Đã kết thúc' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Giải Đấu</Text>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có giải đấu</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('TournamentDetail', { tournamentId: item.id })}
            activeOpacity={0.7}
          >
            <GlassCard style={styles.card}>
              <MaterialCommunityIcons name="trophy" size={24} color="#f59e0b" />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.currentParticipants}/{item.maxParticipants} • {STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.muted} />
            </GlassCard>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  title: {
    fontSize: 24, fontWeight: '700', color: colors.text.primary,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, marginBottom: spacing.lg,
  },

  tabs: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  tabActive: { backgroundColor: colors.goldLight },
  tabText: { fontSize: 13, color: colors.text.muted, fontWeight: '500' },
  tabTextActive: { color: colors.gold },

  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing['4xl'] },
  emptyText: { color: colors.text.muted, textAlign: 'center', marginTop: spacing['3xl'] },

  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 0 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  meta: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
})
