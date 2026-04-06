import { deductEnergy, hasEnergy, energyPercentage, formatEnergy } from './energySystem'

describe('deductEnergy', () => {
  test('deduct 1 wrong answer = -5', () => {
    expect(deductEnergy(100)).toBe(95)
  })

  test('deduct 3 wrong answers = -15', () => {
    expect(deductEnergy(100, 3)).toBe(85)
  })

  test('cannot go below 0', () => {
    expect(deductEnergy(3)).toBe(0)
  })

  test('0 energy stays 0', () => {
    expect(deductEnergy(0)).toBe(0)
  })
})

describe('hasEnergy', () => {
  test('positive energy = true', () => {
    expect(hasEnergy(50)).toBe(true)
  })

  test('0 energy = false', () => {
    expect(hasEnergy(0)).toBe(false)
  })

  test('negative energy = false', () => {
    expect(hasEnergy(-5)).toBe(false)
  })
})

describe('energyPercentage', () => {
  test('full energy = 1', () => {
    expect(energyPercentage(100, 100)).toBe(1)
  })

  test('half energy = 0.5', () => {
    expect(energyPercentage(50, 100)).toBe(0.5)
  })

  test('0 energy = 0', () => {
    expect(energyPercentage(0, 100)).toBe(0)
  })

  test('over max = capped at 1', () => {
    expect(energyPercentage(150, 100)).toBe(1)
  })

  test('0 max = 0', () => {
    expect(energyPercentage(50, 0)).toBe(0)
  })
})

describe('formatEnergy', () => {
  test('formats correctly', () => {
    expect(formatEnergy(75, 100)).toBe('75 / 100')
  })

  test('default max', () => {
    expect(formatEnergy(50)).toBe('50 / 100')
  })
})
