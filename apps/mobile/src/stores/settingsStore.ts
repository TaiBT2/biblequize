import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface SettingsState {
  soundEnabled: boolean
  hapticsEnabled: boolean
  volume: number
  setSoundEnabled: (v: boolean) => void
  setHapticsEnabled: (v: boolean) => void
  setVolume: (v: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      hapticsEnabled: true,
      volume: 0.7,
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
