import { useEffect, useRef, useCallback } from 'react'
import { Audio } from 'expo-av'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'bq_sound_settings'

export type SoundName = 'correct' | 'wrong'

// Static requires — Metro bundles these at build time. Match web
// soundManager.ts cases 'correctAnswer' / 'wrongAnswer' tone sequences
// (apps/web/src/services/soundManager.ts:90-104). Generated via
// tools/gen-quiz-sounds.js.
const ASSETS = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
} as const

let _enabled = true
let _volume = 0.7
let _loaded = false

async function loadSettings() {
  if (_loaded) return
  _loaded = true
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (raw) {
      const { enabled, volume } = JSON.parse(raw)
      if (typeof enabled === 'boolean') _enabled = enabled
      if (typeof volume === 'number') _volume = Math.max(0, Math.min(1, volume))
    }
  } catch { /* defaults */ }
}

/**
 * Quiz sound effects — mirrors web `soundManager.play('correctAnswer' | 'wrongAnswer')`.
 * Persists enabled/volume preference qua AsyncStorage (parity với web localStorage).
 *
 * <p>Sound instances cached lifetime của hook để tránh reload mỗi câu. unloadAsync
 * khi unmount để free native audio resources.
 */
export function useSound() {
  const cacheRef = useRef<Partial<Record<SoundName, Audio.Sound>>>({})

  useEffect(() => {
    loadSettings()
    // Configure audio mode (allow playback even in silent mode iOS — quiz feedback
    // should be audible giống web; user vẫn có thể tắt qua settings).
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {})
    return () => {
      const cache = cacheRef.current
      Object.values(cache).forEach(s => { s?.unloadAsync().catch(() => {}) })
      cacheRef.current = {}
    }
  }, [])

  const play = useCallback(async (name: SoundName) => {
    if (!_enabled) return
    try {
      let sound = cacheRef.current[name]
      if (!sound) {
        const { sound: created } = await Audio.Sound.createAsync(
          ASSETS[name],
          { volume: _volume, shouldPlay: false },
        )
        cacheRef.current[name] = created
        sound = created
      }
      await sound.setPositionAsync(0)
      await sound.setVolumeAsync(_volume)
      await sound.playAsync()
    } catch {
      // Silent fail — sound is non-critical, không block UX.
    }
  }, [])

  return { play }
}

export async function setSoundEnabled(enabled: boolean) {
  _enabled = enabled
  await persist()
}

export async function setSoundVolume(volume: number) {
  _volume = Math.max(0, Math.min(1, volume))
  await persist()
}

export function getSoundSettings() {
  return { enabled: _enabled, volume: _volume }
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: _enabled, volume: _volume }))
  } catch { /* ignore */ }
}
