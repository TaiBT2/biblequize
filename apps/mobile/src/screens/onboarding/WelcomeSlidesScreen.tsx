import { useTranslation } from 'react-i18next'
import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import SafeScreen from '../../components/layout/SafeScreen'
import Button from '../../components/ui/Button'
import { colors, typography, spacing, borderRadius } from '../../theme'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    id: '1',
    icon: '✨',
    step: '01 / 03',
    title: 'Chào mừng đến BibleQuiz',
    description: 'Học Kinh Thánh qua quiz tương tác mỗi ngày. Hệ thống thông minh giúp bạn tiến bộ từng bước.',
    features: ['Quiz tương tác', 'Tiến bộ hàng ngày', 'AI chọn câu thông minh'],
  },
  {
    id: '2',
    icon: '👥',
    step: '02 / 03',
    title: 'Thi đấu cùng nhau',
    description: '4 chế độ chơi nhóm: Speed Race, Battle Royale, Team vs Team, Sudden Death.',
    features: ['Real-time PvP', 'Nhóm Hội Thánh', 'Giải đấu Tournament'],
  },
  {
    id: '3',
    icon: '📖',
    step: '03 / 03',
    title: 'Hành trình 66 sách',
    description: 'Chinh phục từng sách Kinh Thánh. Theo dõi tiến trình mastery của bạn.',
    features: ['66 sách Kinh Thánh', 'Hệ thống mastery', 'Chuỗi ngày streak'],
  },
]

export default function WelcomeSlidesScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
      setCurrentIndex(currentIndex + 1)
    } else {
      navigation.navigate('TryQuiz')
    }
  }

  const handleSkip = () => {
    navigation.navigate('TryQuiz')
  }

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Skip button */}
        <View style={styles.topBar}>
          <View />
          <Pressable onPress={handleSkip}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </Pressable>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>

              {/* Step */}
              <Text style={styles.step}>{item.step}</Text>

              {/* Title */}
              <Text style={styles.title}>{item.title}</Text>

              {/* Description */}
              <Text style={styles.description}>{item.description}</Text>

              {/* Features */}
              <View style={styles.features}>
                {item.features.map((feat: string, i: number) => (
                  <View key={i} style={styles.featureRow}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        />

        {/* Dots + Button */}
        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
            ))}
          </View>

          <Button
            title={currentIndex === SLIDES.length - 1 ? 'Thử ngay' : 'Tiếp tục'}
            onPress={handleNext}
            fullWidth
          />
        </View>
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  skipText: { fontSize: typography.size.sm, color: colors.textMuted, fontWeight: typography.weight.medium },
  slide: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  iconContainer: {
    width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(248, 189, 69, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
  },
  icon: { fontSize: 40 },
  step: { fontSize: typography.size.xs, color: colors.gold, fontWeight: typography.weight.bold, letterSpacing: 2, marginBottom: spacing.lg },
  title: { fontSize: typography.size['3xl'], fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.lg },
  description: { fontSize: typography.size.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: spacing['2xl'] },
  features: { gap: spacing.md, width: '100%', paddingHorizontal: spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureCheck: { fontSize: typography.size.sm, color: colors.success, fontWeight: typography.weight.bold },
  featureText: { fontSize: typography.size.sm, color: colors.textSecondary },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing['2xl'], gap: spacing.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surfaceContainerHighest },
  dotActive: { width: 24, backgroundColor: colors.gold },
})
