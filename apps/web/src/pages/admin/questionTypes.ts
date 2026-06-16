// Shared types + helpers for the question editor, used by both the Questions
// management page and the Review Queue (QED-1). Keeping these in one module lets
// QuestionEditModal be reused without a page↔component import cycle.

export type QuestionType = 'multiple_choice_single' | 'multiple_choice_multi' | 'true_false' | 'fill_in_blank'
export type Difficulty   = 'easy' | 'medium' | 'hard'
export type ReviewStatus = 'ACTIVE' | 'PENDING' | 'REJECTED'

export interface Question {
  id: string
  book?: string
  chapter?: number
  verseStart?: number
  verseEnd?: number
  difficulty?: Difficulty
  type?: QuestionType
  content: string
  options?: string[]
  correctAnswer?: number[]
  correctAnswerText?: string
  explanation?: string
  language?: string
  isActive?: boolean
  reviewStatus?: ReviewStatus
  approvalsCount?: number
  createdAt?: string
  /** Optional tag — currently only "bible_basics" for the Ranked-unlock catechism. */
  category?: string | null
}

export interface SimilarQuestion {
  questionId: string
  content: string
  book?: string
  chapter?: number
  verseStart?: number
  similarityPercent: number
}

export interface DuplicateWarning {
  error: 'POSSIBLE_DUPLICATE'
  message: string
  similarQuestions?: SimilarQuestion[]
}

export const EMPTY_QUESTION: Partial<Question> = {
  book: '', chapter: undefined, verseStart: undefined, verseEnd: undefined,
  difficulty: 'easy', type: 'multiple_choice_single', language: 'vi',
  content: '', options: ['', '', '', ''], correctAnswer: [0], explanation: '',
  reviewStatus: 'ACTIVE',
}

export function optionDefaults(type: QuestionType, lang = 'vi'): string[] {
  if (type === 'true_false') return lang === 'vi' ? ['Đúng', 'Sai'] : ['True', 'False']
  if (type === 'fill_in_blank') return []
  return ['', '', '', '']
}

// ── Answer-quality evaluator (QEV) ──────────────────────────────────────────────
// Instant client-side heuristic check of answer-design principles. Covers
// length-parity, position, structure and explanation; distractor plausibility is
// left to a human/AI pass (flagged as info). No network, no AI quota.

export type QCheck = { status: 'pass' | 'warn' | 'info'; label: string }

/** Translator shape (i18next TFunction) — kept loose to avoid an import cycle. */
type TFn = (key: string, opts?: Record<string, unknown>) => string

export function evaluateQuestionQuality(q: Partial<Question>, t: TFn): QCheck[] {
  const E = (k: string, o?: Record<string, unknown>) => t(`admin.questions.eval.${k}`, o)
  const type = q.type
  const isMc = type === 'multiple_choice_single' || type === 'multiple_choice_multi'
  if (!isMc) return [{ status: 'info', label: E('notMcq') }]

  const opts = (q.options ?? []).map(o => (o ?? '').trim())
  const correct = q.correctAnswer ?? []
  const checks: QCheck[] = []

  // 1. Filled + distinct
  const empties = opts.filter(o => !o).length
  const distinct = new Set(opts.map(o => o.toLowerCase())).size
  if (empties > 0) checks.push({ status: 'warn', label: E('emptyOptions', { count: empties }) })
  else if (distinct < opts.length) checks.push({ status: 'warn', label: E('duplicateOptions') })
  else checks.push({ status: 'pass', label: E('optionsOk') })

  // 2. Length parity (the main "guessable" tell)
  if (correct.length && opts.length >= 2) {
    const ci = correct[0]
    const correctLen = opts[ci]?.length ?? 0
    const others = opts.filter((_, i) => !correct.includes(i)).map(o => o.length)
    const avg = others.length ? others.reduce((a, b) => a + b, 0) / others.length : 0
    const maxLen = Math.max(...opts.map(o => o.length))
    const ratio = avg ? +(correctLen / avg).toFixed(2) : 0
    const isLongest = correctLen >= maxLen && correctLen > 0
    if (isLongest && ratio >= 1.5) checks.push({ status: 'warn', label: E('lengthBiasWarn', { ratio }) })
    else if (isLongest) checks.push({ status: 'info', label: E('lengthBiasInfo', { ratio }) })
    else checks.push({ status: 'pass', label: E('lengthOk', { ratio }) })
  }

  // 3. Position (single-answer only) — seed data leans toward A
  if (type === 'multiple_choice_single' && correct.length === 1) {
    if (correct[0] === 0) checks.push({ status: 'info', label: E('positionA') })
    else checks.push({ status: 'pass', label: E('positionOk', { letter: String.fromCharCode(65 + correct[0]) }) })
  }

  // 4. Explanation
  const exp = (q.explanation ?? '').trim()
  if (!exp) checks.push({ status: 'warn', label: E('explanationMissing') })
  else if (exp.length < 40) checks.push({ status: 'warn', label: E('explanationShort') })
  else checks.push({ status: 'pass', label: E('explanationOk') })

  // 5. Plausibility — needs human/AI judgement
  checks.push({ status: 'info', label: E('plausibility') })

  return checks
}
