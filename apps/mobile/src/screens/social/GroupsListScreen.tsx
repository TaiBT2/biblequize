import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { apiClient } from '../../api/client'
import { colors, typography, spacing } from '../../theme'

export default function GroupsListScreen() {
  const navigation = useNavigation<any>()
  const { data } = useQuery({ queryKey: ['my-groups'], queryFn: () => apiClient.get('/api/groups/my').then(r => r.data), staleTime: 60_000 })
  const groups: any[] = Array.isArray(data) ? data : []

  return (
    <SafeScreen>
      <View style={s.header}>
        <Text style={s.title}>Nhóm của tôi</Text>
        <Button title="+ Tham gia" onPress={() => navigation.navigate('GroupJoin')} size="sm" variant="outline" />
      </View>
      <ScrollView contentContainerStyle={s.list}>
        {groups.map((g: any) => (
          <Pressable key={g.id} onPress={() => navigation.navigate('GroupDetail', { groupId: g.id })}>
            <Card style={s.row}><Text style={s.icon}>⛪</Text>
              <View style={{ flex: 1 }}><Text style={s.name}>{g.name}</Text><Text style={s.meta}>{g.memberCount ?? 0} thành viên</Text></View>
            </Card>
          </Pressable>
        ))}
        {groups.length === 0 && <View style={s.empty}><Text style={{ fontSize: 48 }}>👥</Text><Text style={s.emptyText}>Chưa có nhóm</Text>
          <Button title="Tham gia nhóm" onPress={() => navigation.navigate('GroupJoin')} /></View>}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  list: { padding: spacing.lg, gap: spacing.md }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { fontSize: 28 }, name: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  meta: { fontSize: typography.size.xs, color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: spacing['4xl'], gap: spacing.lg },
  emptyText: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textMuted },
})
