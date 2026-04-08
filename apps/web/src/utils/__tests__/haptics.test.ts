import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockVibrate = vi.fn()
vi.stubGlobal('navigator', { vibrate: mockVibrate })

const { haptic, setHapticsEnabled, isHapticsEnabled } = await import('../haptics')

describe('Haptics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setHapticsEnabled(true)
  })

  it('correct triggers vibrate(50)', () => {
    haptic.correct()
    expect(mockVibrate).toHaveBeenCalledWith(50)
  })

  it('wrong triggers vibrate pattern', () => {
    haptic.wrong()
    expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100])
  })

  it('combo triggers vibrate pattern', () => {
    haptic.combo()
    expect(mockVibrate).toHaveBeenCalledWith([50, 30, 50, 30, 50])
  })

  it('does not vibrate when disabled', () => {
    setHapticsEnabled(false)
    haptic.correct()
    expect(mockVibrate).not.toHaveBeenCalled()
  })

  it('tracks enabled state', () => {
    expect(isHapticsEnabled()).toBe(true)
    setHapticsEnabled(false)
    expect(isHapticsEnabled()).toBe(false)
  })
})
