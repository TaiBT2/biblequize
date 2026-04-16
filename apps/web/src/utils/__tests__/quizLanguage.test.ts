import { describe, it, expect, beforeEach } from 'vitest'
import { getQuizLanguage, setQuizLanguage } from '../quizLanguage'

/**
 * Tests for quizLanguage utility.
 * Covers: default value, get/set, localStorage persistence.
 */

describe('quizLanguage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns vi as default when nothing is stored', () => {
    expect(getQuizLanguage()).toBe('vi')
  })

  it('returns vi when stored value is not en', () => {
    localStorage.setItem('quizLanguage', 'fr')
    expect(getQuizLanguage()).toBe('vi')
  })

  it('returns en when en is stored', () => {
    localStorage.setItem('quizLanguage', 'en')
    expect(getQuizLanguage()).toBe('en')
  })

  it('setQuizLanguage stores value in localStorage', () => {
    setQuizLanguage('en')
    expect(localStorage.getItem('quizLanguage')).toBe('en')
  })

  it('setQuizLanguage to vi and getQuizLanguage returns vi', () => {
    setQuizLanguage('en')
    setQuizLanguage('vi')
    expect(getQuizLanguage()).toBe('vi')
  })

  it('roundtrip: set then get returns same value', () => {
    setQuizLanguage('en')
    expect(getQuizLanguage()).toBe('en')
    setQuizLanguage('vi')
    expect(getQuizLanguage()).toBe('vi')
  })
})
