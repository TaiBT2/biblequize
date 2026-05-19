import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import { getCosmetics, updateCosmetics, CosmeticsData, CosmeticItem } from '../../api/cosmetics'
import { colors, typography, spacing, borderRadius } from '../../theme'

const TIER_ICONS = ['🌱', '🌿', '📜', '🪔', '🔥', '👑']
const FRAME_COLORS = ['#9ca3af', '#60a5fa', '#3b82f6', '#a855f7', '#eab308', '#ef4444']

type CosmeticType = 'frame' | 'theme'

export default function CosmeticsScreen() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<CosmeticsData>({
    queryKey: ['cosmetics'],
    queryFn: getCosmetics,
  })

  const mut = useMutation({
    mutationFn: (body: { activeFrame?: string; activeTheme?: string }) => updateCosmetics(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cosmetics'] }),
    onError: (e: any) => Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không cập nhật được'),
  })

  const handleActivate = (type: CosmeticType, item: CosmeticItem) => {
    if (!item.unlocked) {
      Alert.alert('Chưa mở khoá', 'Lên hạng cao hơn để mở khoá item này.')
      return
    }
    mut.mutate(type === 'frame' ? { activeFrame: item.id } : { activeTheme: item.id })
  }

  if (isLoading || !data) {
    return <SafeScreen><View style={s.center}><Text style={s.muted}>Đang tải...</Text></View></SafeScreen>
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>🎨 Trang trí</Text>
        <Text style={s.subtitle}>Tùy chỉnh khung avatar + theme</Text>

        <CosmeticSection
          label="Khung Avatar"
          icon="🖼"
          items={data.frames}
          activeId={data.activeFrame}
          onActivate={(item) => handleActivate('frame', item)}
        />

        <CosmeticSection
          label="Theme"
          icon="🎭"
          items={data.themes}
          activeId={data.activeTheme}
          onActivate={(item) => handleActivate('theme', item)}
        />
      </ScrollView>
    </SafeScreen>
  )
}

function CosmeticSection({
  label, icon, items, activeId, onActivate,
}: {
  label: string
  icon: string
  items: CosmeticItem[]
  activeId: string
  onActivate: (item: CosmeticItem) => void
}) {
  return (
    <View>
      <Text style={s.sectionLabel}>{icon} {label}</Text>
      <View style={s.grid}>
        {items.map(item => {
          const isActive = item.id === activeId
          const tierIdx = Math.max(0, Math.min(5, item.tier - 1))
          return (
            <Pressable
              key={item.id}
              onPress={() => onActivate(item)}
              disabled={!item.unlocked}
              style={s.cell}
              accessibilityLabel={`${label} ${item.name}${isActive ? ' đang dùng' : ''}${!item.unlocked ? ' chưa mở khoá' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive, disabled: !item.unlocked }}
            >
              <Card style={[s.itemCard, isActive && { borderColor: colors.gold, borderWidth: 2 }, !item.unlocked && s.locked]}>
                <Text style={[s.itemIcon, { color: FRAME_COLORS[tierIdx] }]}>{TIER_ICONS[tierIdx]}</Text>
                <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                {isActive && <Text style={s.activeBadge}>✓ Đang dùng</Text>}
                {!item.unlocked && <Text style={s.lockIcon}>🔒</Text>}
              </Card>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing['2xl'] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { fontSize: typography.size.sm, color: colors.textMuted },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted },
  sectionLabel: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.gold, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { flexBasis: '31%', flexGrow: 1 },
  itemCard: { alignItems: 'center', gap: spacing.xs, minHeight: 100, position: 'relative' },
  itemIcon: { fontSize: 36 },
  itemName: { fontSize: typography.size.xs, color: colors.textPrimary, textAlign: 'center', fontWeight: typography.weight.medium },
  activeBadge: { fontSize: 10, color: colors.gold, fontWeight: typography.weight.bold, marginTop: 2 },
  locked: { opacity: 0.4 },
  lockIcon: { position: 'absolute', top: spacing.xs, right: spacing.xs, fontSize: 16 },
})
