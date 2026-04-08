import { useTranslation } from 'react-i18next'
import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useRoute } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import { colors, typography, spacing } from '../../theme'

const CONTENT: Record<string, { title: string; body: string }> = {
  privacy: {
    title: 'Chính sách bảo mật',
    body: 'BibleQuiz cam kết bảo vệ quyền riêng tư của bạn. Chúng tôi chỉ thu thập dữ liệu cần thiết để cung cấp dịch vụ: tên, email, tiến trình học tập. Dữ liệu không bao giờ được bán cho bên thứ ba. Bạn có quyền yêu cầu xóa tài khoản bất cứ lúc nào.',
  },
  terms: {
    title: 'Điều khoản sử dụng',
    body: 'Bằng việc sử dụng BibleQuiz, bạn đồng ý tuân thủ các điều khoản sau: sử dụng app cho mục đích học tập, không chia sẻ nội dung có bản quyền, tôn trọng cộng đồng. BibleQuiz có quyền chấm dứt tài khoản vi phạm.',
  },
  about: {
    title: 'Về BibleQuiz',
    body: 'BibleQuiz là ứng dụng học Kinh Thánh qua quiz tương tác. Được phát triển với mục tiêu giúp cộng đồng Cơ Đốc nhân học hỏi Lời Chúa mỗi ngày. Miễn phí, không quảng cáo.',
  },
}

export default function LegalScreen() {
  const { t } = useTranslation()
  const route = useRoute<any>()
  const type = route.params?.type ?? 'about'
  const { title, body } = CONTENT[type] ?? CONTENT.about

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.body}>{body}</Text>
        <Text style={s.footer}>© 2025 BibleQuiz. All rights reserved.</Text>
      </ScrollView>
    </SafeScreen>
  )
}

const s = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.xl },
  title: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.textPrimary },
  body: { fontSize: typography.size.base, color: colors.textSecondary, lineHeight: 26 },
  footer: { fontSize: typography.size.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing['3xl'] },
})
