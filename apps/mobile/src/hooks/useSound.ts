import { useEffect, useCallback } from 'react'
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'bq_sound_settings'

export type SoundName = 'correct' | 'wrong'

// Static requires — Metro bundles these at build time. Generated via
// tools/gen-quiz-sounds.js (sine/square WAV matching web tone specs).
const ASSETS = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
} as const

// Module-level singleton cache — players reused across all hook instances,
// không tạo lại mỗi screen mount. expo-audio handle native lifecycle, không
// như expo-av (bị wrong-thread ExoPlayer error trên Android SDK 54+).
const playerCache: Partial<Record<SoundName, AudioPlayer>> = {}

let _enabled = true
let _volume = 0.7
let _settingsLoaded = false
let _audioModeSet = false

async function loadSettings() {
  if (_settingsLoaded) return
  _settingsLoaded = true
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (raw) {
      const { enabled, volume } = JSON.parse(raw)
      if (typeof enabled === 'boolean') _enabled = enabled
      if (typeof volume === 'number') _volume = Math.max(0, Math.min(1, volume))
    }
  } catch { /* defaults */ }
}

function getPlayer(name: SoundName): AudioPlayer {
  let p = playerCache[name]
  if (!p) {
    p = createAudioPlayer(ASSETS[name])
    p.volume = _volume
    playerCache[name] = p
  }
  return p
}

/**
 * Quiz sound effects — replacement cho expo-av Audio.Sound. expo-audio
 * sử dụng AudioPlayer API mới với threading bug fixed (expo-av 16.x +
 * Android SDK 54 throw wrong-thread error trên ExoPlayer release).
 *
 * <p>Players cached ở module-level singleton, không unmount-aware (expo-av
 * cleanup gây race với native AVManager destroy). expo-audio tự handle
 * lifecycle tốt hơn.
 *
 * <p>setAudioModeAsync chỉ gọi 1 lần global (không lặp mỗi mount).
 */
export function useSound() {
  useEffect(() => {
    loadSettings()
    if (!_audioModeSet) {
      _audioModeSet = true
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
        _audioModeSet = false
      })
    }
  }, [])

  const play = useCallback((name: SoundName) => {
    if (!_enabled) return
    try {
      const player = getPlayer(name)
      // Seek về 0 + play. seekTo trả Promise nhưng không await — fire & forget.
      player.seekTo(0).catch(() => {})
      player.volume = _volume
      player.play()
    } catch {
      // Silent fail — sound non-critical, không block UX.
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
  Object.values(playerCache).forEach(p => {
    if (p) p.volume = _volume
  })
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
