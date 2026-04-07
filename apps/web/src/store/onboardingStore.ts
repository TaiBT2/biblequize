import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface OnboardingState {
  hasSeenOnboarding: boolean
  hasDoneTutorial: boolean
  preferredLanguage: 'vi' | 'en' | null

  setHasSeenOnboarding: (value: boolean) => void
  setHasDoneTutorial: (value: boolean) => void
  setLanguage: (lang: 'vi' | 'en') => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      hasDoneTutorial: false,
      preferredLanguage: null,

      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      setHasDoneTutorial: (value) => set({ hasDoneTutorial: value }),
      setLanguage: (lang) => set({ preferredLanguage: lang }),
      reset: () => set({ hasSeenOnboarding: false, hasDoneTutorial: false, preferredLanguage: null }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
