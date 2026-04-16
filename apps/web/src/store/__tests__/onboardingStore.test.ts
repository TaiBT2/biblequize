import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from '../onboardingStore'

/**
 * Tests for onboardingStore (Zustand + persist).
 * Covers: default state, setters, reset, persistence key.
 */

describe('onboardingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useOnboardingStore.getState().reset()
    localStorage.clear()
  })

  it('has correct default values', () => {
    const state = useOnboardingStore.getState()
    expect(state.hasSeenOnboarding).toBe(false)
    expect(state.hasDoneTutorial).toBe(false)
    expect(state.preferredLanguage).toBeNull()
  })

  it('setHasSeenOnboarding updates state', () => {
    useOnboardingStore.getState().setHasSeenOnboarding(true)
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true)
  })

  it('setHasDoneTutorial updates state', () => {
    useOnboardingStore.getState().setHasDoneTutorial(true)
    expect(useOnboardingStore.getState().hasDoneTutorial).toBe(true)
  })

  it('setLanguage sets preferred language to vi', () => {
    useOnboardingStore.getState().setLanguage('vi')
    expect(useOnboardingStore.getState().preferredLanguage).toBe('vi')
  })

  it('setLanguage sets preferred language to en', () => {
    useOnboardingStore.getState().setLanguage('en')
    expect(useOnboardingStore.getState().preferredLanguage).toBe('en')
  })

  it('reset restores all defaults', () => {
    const store = useOnboardingStore.getState()
    store.setHasSeenOnboarding(true)
    store.setHasDoneTutorial(true)
    store.setLanguage('en')

    store.reset()

    const after = useOnboardingStore.getState()
    expect(after.hasSeenOnboarding).toBe(false)
    expect(after.hasDoneTutorial).toBe(false)
    expect(after.preferredLanguage).toBeNull()
  })

  it('persists to localStorage under correct key', () => {
    useOnboardingStore.getState().setHasSeenOnboarding(true)
    const stored = localStorage.getItem('onboarding-storage')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.hasSeenOnboarding).toBe(true)
  })
})
