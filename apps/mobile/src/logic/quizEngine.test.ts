import {
  calculateScore,
  getComboMultiplier,
  isAnswerCorrect,
  calculateGrade,
  shouldEndQuiz,
} from './quizEngine'

describe('calculateScore', () => {
  test('easy difficulty, full time (30s) = base 10 + timeBonus 15 + perfectBonus 5 = 30', () => {
    expect(calculateScore('easy', 30)).toBe(30)
  })

  test('medium difficulty, full time = (20 + 15 + 5) * 1.2 = 48', () => {
    expect(calculateScore('medium', 30)).toBe(48)
  })

  test('hard difficulty, full time = (30 + 15 + 5) * 1.5 = 75', () => {
    expect(calculateScore('hard', 30)).toBe(75)
  })

  test('zero time remaining = base only', () => {
    expect(calculateScore('easy', 0)).toBe(10) // base 10, no bonus
  })

  test('negative time returns 0', () => {
    expect(calculateScore('easy', -5)).toBe(0)
  })

  test('half time, no perfect bonus', () => {
    // easy: base 10 + timeBonus 7 + perfectBonus 0 = 17
    expect(calculateScore('easy', 15)).toBe(17)
  })

  test('at perfect bonus threshold (25s)', () => {
    // easy: base 10 + timeBonus 12 + perfectBonus 5 = 27
    expect(calculateScore('easy', 25)).toBe(27)
  })

  test('just below perfect bonus threshold (24s)', () => {
    // easy: base 10 + timeBonus 12 + perfectBonus 0 = 22
    expect(calculateScore('easy', 24)).toBe(22)
  })

  test('uppercase difficulty works the same', () => {
    expect(calculateScore('HARD', 30)).toBe(calculateScore('hard', 30))
  })

  test('unknown difficulty uses defaults (base=10, mult=1)', () => {
    expect(calculateScore('unknown', 30)).toBe(30) // 10 + 15 + 5 = 30
  })
})

describe('getComboMultiplier', () => {
  test('0 streak = 1.0x', () => {
    expect(getComboMultiplier(0)).toBe(1.0)
  })

  test('2 streak = 1.0x', () => {
    expect(getComboMultiplier(2)).toBe(1.0)
  })

  test('3 streak = 1.25x', () => {
    expect(getComboMultiplier(3)).toBe(1.25)
  })

  test('5 streak = 1.5x', () => {
    expect(getComboMultiplier(5)).toBe(1.5)
  })

  test('10 streak = 2.0x', () => {
    expect(getComboMultiplier(10)).toBe(2.0)
  })

  test('100 streak = 2.0x (capped)', () => {
    expect(getComboMultiplier(100)).toBe(2.0)
  })
})

describe('isAnswerCorrect', () => {
  test('correct answer', () => {
    expect(isAnswerCorrect(2, [2])).toBe(true)
  })

  test('wrong answer', () => {
    expect(isAnswerCorrect(1, [2])).toBe(false)
  })

  test('multiple correct answers', () => {
    expect(isAnswerCorrect(3, [1, 3])).toBe(true)
  })

  test('empty correct answers = always wrong', () => {
    expect(isAnswerCorrect(0, [])).toBe(false)
  })
})

describe('calculateGrade', () => {
  test('100% = A', () => {
    expect(calculateGrade(10, 10)).toEqual({ percentage: 100, grade: 'A' })
  })

  test('90% = A', () => {
    expect(calculateGrade(9, 10)).toEqual({ percentage: 90, grade: 'A' })
  })

  test('80% = B', () => {
    expect(calculateGrade(8, 10)).toEqual({ percentage: 80, grade: 'B' })
  })

  test('70% = C', () => {
    expect(calculateGrade(7, 10)).toEqual({ percentage: 70, grade: 'C' })
  })

  test('60% = D', () => {
    expect(calculateGrade(6, 10)).toEqual({ percentage: 60, grade: 'D' })
  })

  test('50% = F', () => {
    expect(calculateGrade(5, 10)).toEqual({ percentage: 50, grade: 'F' })
  })

  test('0 total questions = 0% F', () => {
    expect(calculateGrade(0, 0)).toEqual({ percentage: 0, grade: 'F' })
  })
})

describe('shouldEndQuiz', () => {
  test('0 lives = end', () => {
    expect(shouldEndQuiz(0)).toBe(true)
  })

  test('negative lives = end', () => {
    expect(shouldEndQuiz(-1)).toBe(true)
  })

  test('1 life = continue', () => {
    expect(shouldEndQuiz(1)).toBe(false)
  })
})
