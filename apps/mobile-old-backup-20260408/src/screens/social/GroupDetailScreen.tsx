import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { colors } from '../../theme/colors'
import { spacing, borderRadius } from '../../theme/spacing'
import { GlassCard } from '../../components/GlassCard'
import { Avatar } from '../../components/Avatar'
import type { GroupStackParamList } from '../../navigation/types'

type Tab = 'leaderboard' | 'members' | 'announcements'

export const GroupDetailScreen = () => {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<GroupStackParamList, 'GroupDetail'>>()
  const { groupId } = route.params
  const [tab, setTab] = useState<Tab>('leaderboard')

  const groupQuery = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.get(`/api/groups/${groupId}`).then((r) => r.data),
  })

  const lbQuery = useQuery({
    queryKey: ['group-leaderboard', groupId],
    queryFn: () => api.get(`/api/groups/${groupId}/leaderboard`).then((r) => r.data),
    enabled: tab === 'leaderboard',
  })

  const group = groupQuery.data
  const entries = lbQuery.data?.content ?? lbQuery.data ?? []

  const TABS: { key: Tab; label: string }[] = [
    { key: 'leaderboard', label: 'Xếp hạng' },
    { key: 'members', label: 'Thành viên' },
    { key: 'announcements', label: 'Thông báo' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.groupName}>{group?.name ?? 'Nhóm'}</Text>
          <Text style={styles.groupSub}>{group?.memberCount ?? 0} thành viên</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === 'leaderboard' && (
        <FlatList
          data={entries}
          keyExtractor={(item: any, i) => item.userId ?? String(i)}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <GlassCard style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Avatar uri={item.avatarUrl} name={item.name ?? 'User'} size={32} />
              <Text style={styles.name} numberOfLines={1}>{item.name ?? 'User'}</Text>
              <Text style={styles.score}>{(item.score ?? 0).toLocaleString()}</Text>
            </GlassCard>
          )}
        />
      )}

      {tab === 'members' && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Danh sách thành viên</Text>
        </View>
      )}

      {tab === 'announcements' && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Chưa có thông báo</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  headerInfo: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  groupSub: { fontSize: 12, color: colors.text.secondary },

  tabs: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  tabActive: { backgroundColor: colors.goldLight },
  tabText: { fontSize: 13, color: colors.text.muted, fontWeight: '500' },
  tabTextActive: { color: colors.gold },

  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing['4xl'] },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 0 },
  rank: { width: 24, fontSize: 14, fontWeight: '700', color: colors.text.secondary, textAlign: 'center' },
  name: { flex: 1, fontSize: 14, color: colors.text.primary },
  score: { fontSize: 14, fontWeight: '600', color: colors.gold },

  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: colors.text.muted, fontSize: 15 },
})
