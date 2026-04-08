import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import { apiClient } from '../../api/client'
import { colors, typography, spacing } from '../../theme'

export default function GroupDetailScreen() {
  const route = useRoute<any>()
  const { data } = useQuery({ queryKey: ['group', route.params?.groupId], queryFn: () => apiClient.get('/api/groups/' + route.params?.groupId).then(r => r.data), enabled: !!route.params?.groupId })
  const group = data ?? {}
  const members: any[] = group.members ?? []

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}><Text style={{ fontSize: 48 }}>⛪</Text><Text style={s.title}>{group.name ?? 'Nhóm'}</Text>
          <Text style={s.meta}>{members.length} thành viên • Mã: {group.code ?? ''}</Text></View>
        <Text style={s.section}>Thành viên</Text>
        {members.map((m: any) => (
          <Card key={m.userId} style={s.row}>
            <Avatar uri={m.avatarUrl} name={m.name} size={36} />
            <View style={{ flex: 1 }}><Text style={s.name}>{m.name}</Text><Text style={s.role}>{m.role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}</Text></View>
            <Text style={s.pts}>{m.points?.toLocaleString() ?? 0} XP</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md }, header: { alignItems: 'center', paddingVertical: spacing.xl },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, marginTop: spacing.sm },
  meta: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing.xs },
  section: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  role: { fontSize: 10, color: colors.textMuted }, pts: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.gold },
})
