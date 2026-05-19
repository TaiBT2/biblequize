import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Switch, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import SafeScreen from '../../components/layout/SafeScreen'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { createScheduledQuiz } from '../../api/scheduledQuiz'
import { listGroupQuizSets, GroupQuizSet } from '../../api/groupQuizSets'
import { colors, typography, spacing, borderRadius } from '../../theme'

/** Return ISO local datetime "YYYY-MM-DDTHH:MM" — 7 days from now mặc định. */
function defaultDeadline(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(23, 59, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ScheduledQuizCreateScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const queryClient = useQueryClient()
  const groupId: string = route.params?.groupId ?? ''

  const [quizSetId, setQuizSetId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState(defaultDeadline())
  const [maxAttempts, setMaxAttempts] = useState('3')
  const [isLeaderboardPublic, setIsLeaderboardPublic] = useState(true)
  const [sendNotifications, setSendNotifications] = useState(true)

  const { data: quizSets = [] } = useQuery<GroupQuizSet[]>({
    queryKey: ['group-quiz-sets', groupId, 'PUBLISHED'],
    queryFn: () => listGroupQuizSets({ groupId, status: 'PUBLISHED' }),
    enabled: !!groupId,
  })

  const mut = useMutation({
    mutationFn: () => createScheduledQuiz(groupId, {
      quizSetId: quizSetId!,
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      deadline,
      maxAttempts: Number(maxAttempts) || 3,
      isLeaderboardPublic,
      sendNotifications,
    }),
    onSuccess: (newQuiz) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-quizzes', groupId] })
      navigation.replace('ScheduledQuizDetail', { groupId, quizId: newQuiz.id })
    },
    onError: (e: any) => Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không tạo được lịch'),
  })

  const handleSubmit = () => {
    if (!quizSetId) { Alert.alert('Thiếu bộ câu hỏi', 'Chọn một bộ đã xuất bản.'); return }
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(deadline)) {
      Alert.alert('Sai định dạng', 'Deadline phải dạng YYYY-MM-DDTHH:MM (vd: 2026-05-26T23:59)')
      return
    }
    mut.mutate()
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Tạo lịch thi đấu</Text>

        <Text style={s.label}>Chọn bộ câu hỏi (Đã xuất bản)</Text>
        {quizSets.length === 0 ? (
          <Card><Text style={s.muted}>Nhóm chưa có bộ câu hỏi nào đã xuất bản.</Text></Card>
        ) : (
          quizSets.map(qs => (
            <Pressable
              key={qs.id}
              onPress={() => { setQuizSetId(qs.id); if (!name) setName(qs.name) }}
            >
              <Card style={[s.qsCard, quizSetId === qs.id && s.qsCardActive]}>
                <Text style={s.qsName}>{qs.name}</Text>
                <Text style={s.qsMeta}>{qs.totalQuestions ?? qs.questionCount ?? 0} câu</Text>
              </Card>
            </Pressable>
          ))
        )}

        <Text style={s.label}>Tên lịch (tuỳ chọn, mặc định = tên bộ)</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="vd: Thi tuần này" placeholderTextColor={colors.textMuted} />

        <Text style={s.label}>Mô tả (tuỳ chọn)</Text>
        <TextInput style={[s.input, s.multiline]} value={description} onChangeText={setDescription} placeholder="..." placeholderTextColor={colors.textMuted} multiline numberOfLines={2} />

        <Text style={s.label}>Hạn chót (YYYY-MM-DDTHH:MM)</Text>
        <TextInput style={s.input} value={deadline} onChangeText={setDeadline} placeholder="2026-05-26T23:59" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
        <Text style={s.hint}>Mặc định 7 ngày từ bây giờ. Format ISO local.</Text>

        <Text style={s.label}>Số lần thử tối đa</Text>
        <TextInput style={s.input} value={maxAttempts} onChangeText={setMaxAttempts} keyboardType="number-pad" />

        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Công khai bảng xếp hạng</Text>
          <Switch value={isLeaderboardPublic} onValueChange={setIsLeaderboardPublic} trackColor={{ true: colors.gold }} />
        </View>

        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Gửi thông báo</Text>
          <Switch value={sendNotifications} onValueChange={setSendNotifications} trackColor={{ true: colors.gold }} />
        </View>

        <View style={s.actions}>
          <Button title={mut.isPending ? 'Đang tạo...' : 'Tạo lịch'} onPress={handleSubmit} disabled={mut.isPending} fullWidth />
          <Button title="Huỷ" onPress={() => navigation.goBack()} variant="outline" fullWidth />
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing['2xl'] },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary, marginTop: spacing.sm },
  muted: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
  input: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textPrimary, fontSize: typography.size.base },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  hint: { fontSize: typography.size.xs, color: colors.textMuted, fontStyle: 'italic' },
  qsCard: { borderWidth: 2, borderColor: 'transparent' },
  qsCardActive: { borderColor: colors.gold },
  qsName: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  qsMeta: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  toggleLabel: { fontSize: typography.size.base, color: colors.textPrimary },
  actions: { gap: spacing.md, marginTop: spacing.xl },
})
