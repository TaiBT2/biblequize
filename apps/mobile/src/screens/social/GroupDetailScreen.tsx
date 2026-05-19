import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import { apiClient } from '../../api/client'
import { colors, typography, spacing, borderRadius } from '../../theme'

export default function GroupDetailScreen() {
  const { t } = useTranslation()
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const groupId: string = route.params?.groupId ?? ''
  const { data } = useQuery({ queryKey: ['group', groupId], queryFn: () => apiClient.get('/api/groups/' + groupId).then(r => r.data), enabled: !!groupId })
  const group = data ?? {}
  const members: any[] = group.members ?? []

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}><Text style={{ fontSize: 48 }}>⛪</Text><Text style={s.title}>{group.name ?? 'Nhóm'}</Text>
          <Text style={s.meta}>{members.length} thành viên • Mã: {group.code ?? ''}</Text></View>

        <Pressable style={s.quizSetsBtn} onPress={() => navigation.navigate('GroupQuizSetList', { groupId })}>
          <Text style={s.quizSetsIcon}>📚</Text>
          <Text style={s.quizSetsLabel}>Bộ câu hỏi nhóm</Text>
          <Text style={s.quizSetsArrow}>›</Text>
        </Pressable>

        <Pressable style={s.quizSetsBtn} onPress={() => navigation.navigate('ScheduledQuizList', { groupId, canManage: group.myRole === 'LEADER' || group.myRole === 'MOD' })}>
          <Text style={s.quizSetsIcon}>📅</Text>
          <Text style={s.quizSetsLabel}>Lịch thi đấu</Text>
          <Text style={s.quizSetsArrow}>›</Text>
        </Pressable>

        {(group.myRole === 'LEADER' || group.myRole === 'MOD') && (
          <Pressable style={s.quizSetsBtn} onPress={() => navigation.navigate('GroupAnalytics', { groupId })}>
            <Text style={s.quizSetsIcon}>📊</Text>
            <Text style={s.quizSetsLabel}>Phân tích nhóm</Text>
            <Text style={s.quizSetsArrow}>›</Text>
          </Pressable>
        )}

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
  quizSetsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceContainer,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  quizSetsIcon: { fontSize: 22 },
  quizSetsLabel: { flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  quizSetsArrow: { fontSize: 22, color: colors.textMuted },
})
