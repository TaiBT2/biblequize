import { describe, it, expect, vi, beforeEach } from 'vitest'
import { soundManager } from '../soundManager'

describe('SoundManager', () => {
  beforeEach(() => {
    soundManager.setEnabled(true)
    soundManager.setVolume(0.7)
  })

  it('enabled defaults to true', () => {
    expect(soundManager.enabled).toBe(true)
  })

  it('setEnabled persists state', () => {
    soundManager.setEnabled(false)
    expect(soundManager.enabled).toBe(false)
    soundManager.setEnabled(true)
    expect(soundManager.enabled).toBe(true)
  })

  it('setVolume clamps to 0-1', () => {
    soundManager.setVolume(1.5)
    expect(soundManager.volume).toBe(1)
    soundManager.setVolume(-0.5)
    expect(soundManager.volume).toBe(0)
    soundManager.setVolume(0.5)
    expect(soundManager.volume).toBe(0.5)
  })

  it('play does not throw when enabled', () => {
    expect(() => soundManager.play('correctAnswer')).not.toThrow()
    expect(() => soundManager.play('wrongAnswer')).not.toThrow()
    expect(() => soundManager.play('combo3')).not.toThrow()
    expect(() => soundManager.play('combo5')).not.toThrow()
    expect(() => soundManager.play('combo10')).not.toThrow()
    expect(() => soundManager.play('quizComplete')).not.toThrow()
    expect(() => soundManager.play('perfectScore')).not.toThrow()
    expect(() => soundManager.play('tierUp')).not.toThrow()
    expect(() => soundManager.play('buttonTap')).not.toThrow()
    expect(() => soundManager.play('timerTick')).not.toThrow()
    expect(() => soundManager.play('timerWarning')).not.toThrow()
    expect(() => soundManager.play('badgeUnlock')).not.toThrow()
    expect(() => soundManager.play('newRecord')).not.toThrow()
  })

  it('play does not throw when disabled', () => {
    soundManager.setEnabled(false)
    expect(() => soundManager.play('correctAnswer')).not.toThrow()
    expect(() => soundManager.play('wrongAnswer')).not.toThrow()
  })

  it('volume setter saves to localStorage', () => {
    soundManager.setVolume(0.3)
    const saved = JSON.parse(localStorage.getItem('bq_sound_settings') || '{}')
    expect(saved.volume).toBe(0.3)
  })

  it('enabled setter saves to localStorage', () => {
    soundManager.setEnabled(false)
    const saved = JSON.parse(localStorage.getItem('bq_sound_settings') || '{}')
    expect(saved.enabled).toBe(false)
  })
})
