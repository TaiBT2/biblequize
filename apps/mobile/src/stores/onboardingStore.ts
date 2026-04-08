import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface OnboardingState {
  hasSeenOnboarding: boolean
  preferredLanguage: string
  setHasSeenOnboarding: (v: boolean) => void
  setPreferredLanguage: (lang: string) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      preferredLanguage: 'vi',
      setHasSeenOnboarding: (v) => set({ hasSeenOnboarding: v }),
      setPreferredLanguage: (lang) => set({ preferredLanguage: lang }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
