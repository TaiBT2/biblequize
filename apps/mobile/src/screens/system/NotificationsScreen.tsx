import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import { apiClient } from '../../api/client'
import { colors, typography, spacing } from '../../theme'

export default function NotificationsScreen() {
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/api/notifications').then(r => r.data).catch(() => []),
  })
  const items: any[] = Array.isArray(data) ? data : []

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Thông báo</Text>
        {items.map((n: any, i: number) => (
          <Card key={n.id ?? i} style={s.row}>
            <Text style={s.icon}>{n.type === 'achievement' ? '🏆' : n.type === 'group' ? '👥' : '📢'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.message}>{n.message ?? ''}</Text>
              <Text style={s.time}>{n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') : ''}</Text>
            </View>
          </Card>
        ))}
        {items.length === 0 && (
          <View style={s.empty}><Text style={{ fontSize: 48 }}>🔔</Text><Text style={s.emptyText}>Chưa có thông báo</Text></View>
        )}
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  icon: { fontSize: 24 },
  message: { fontSize: typography.size.sm, color: colors.textPrimary },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: spacing['4xl'], gap: spacing.md },
  emptyText: { fontSize: typography.size.base, color: colors.textMuted },
})
