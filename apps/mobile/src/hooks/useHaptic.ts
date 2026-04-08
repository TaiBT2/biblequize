import * as Haptics from 'expo-haptics'
import { useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

export function useHaptic() {
  const enabled = useSettingsStore(s => s.hapticsEnabled)

  const trigger = useCallback(async (type: HapticType) => {
    if (!enabled) return
    try {
      switch (type) {
        case 'light': return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        case 'medium': return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        case 'heavy': return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        case 'success': return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        case 'warning': return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        case 'error': return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        case 'selection': return Haptics.selectionAsync()
      }
    } catch { /* not available */ }
  }, [enabled])

  return { trigger }
}
