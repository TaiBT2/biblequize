import { describe, it, expect } from 'vitest'
import { evaluateQuestionQuality, type Question } from '../questionTypes'

// Identity translator: returns the key so we can assert on the eval key fired.
const t = (k: string) => k.replace('admin.questions.eval.', '')

const base: Partial<Question> = {
  type: 'multiple_choice_single',
  language: 'vi',
  options: ['Đáp án đúng vừa phải', 'Sai một', 'Sai hai', 'Sai ba'],
  correctAnswer: [1], // not position A
  explanation: 'Giải thích đủ dài để vượt ngưỡng bốn mươi ký tự cho kiểm tra.',
}
const labels = (q: Partial<Question>) => evaluateQuestionQuality(q, t).map(c => c.label)
const find = (q: Partial<Question>, key: string) =>
  evaluateQuestionQuality(q, t).find(c => c.label === key)

describe('evaluateQuestionQuality — cue words (Haladyna Rule E)', () => {
  it('warns when an absolute word sits only in a distractor', () => {
    const q = { ...base, options: ['Đáp án đúng', 'Điều này luôn luôn xảy ra', 'Sai hai', 'Sai ba'] }
    expect(find(q, 'cueAsymmetric')?.status).toBe('warn')
  })

  it('warns when an absolute word sits only in the correct answer', () => {
    const q = { ...base, correctAnswer: [0], options: ['Tất cả đều đúng', 'Sai một', 'Sai hai', 'Sai ba'] }
    expect(find(q, 'cueAsymmetric')?.status).toBe('warn')
  })

  it('passes when no cue words appear', () => {
    expect(find(base, 'cueOk')?.status).toBe('pass')
    expect(labels(base)).not.toContain('cueAsymmetric')
  })

  it('passes when cues are balanced on both sides', () => {
    const q = { ...base, correctAnswer: [0], options: ['Mọi vật đều hoàn toàn tốt', 'Sai nhưng luôn luôn vậy', 'Sai hai', 'Sai ba'] }
    expect(find(q, 'cueOk')?.status).toBe('pass')
  })

  it('uses English cue list when language is en (word-boundary, no false positive on "small")', () => {
    const q: Partial<Question> = { ...base, language: 'en', options: ['A small correct one', 'It always happens', 'Wrong two', 'Wrong three'] }
    expect(find(q, 'cueAsymmetric')?.status).toBe('warn') // "always" in distractor, none in correct ("small" must NOT match "all")
  })

  it('skips the cue check for true/false questions', () => {
    const q: Partial<Question> = { type: 'true_false', options: ['Đúng', 'Sai'], correctAnswer: [0] }
    expect(evaluateQuestionQuality(q, t).map(c => c.label)).toEqual(['notMcq'])
  })
})
