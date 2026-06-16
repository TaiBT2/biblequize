export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionType = 'multiple_choice_single' | 'multiple_choice_multi' | 'true_false' | 'fill_in_blank'
export type DraftStatus = 'pending' | 'approved' | 'rejected'

// AEQ: distractor error-type metadata declared by the AI (one per wrong option).
export type ErrorType = 'nearby_passage' | 'wrong_detail' | 'wrong_scope' | 'common_misconception' | 'true_but_off'
export interface DistractorMeta {
  index: number
  errorType: ErrorType | string
  almostRight: boolean
}
// AEQ: server-computed quality flags (distinct error types + almost-right minimum).
export interface QualityFlags {
  valid: boolean
  duplicateErrorType: boolean
  almostRightCount: number
  requiredAlmostRight: number
  reasons: string[]
}

export interface DraftQuestion {
  id: string
  status: DraftStatus
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  difficulty: Difficulty
  type: QuestionType
  language: string
  content: string
  options: string[]
  correctAnswer: number | number[]
  explanation: string
  tags: string[]
  source: string
  approvedId?: string
  saveError?: string
  generatedBy?: string
  distractors?: DistractorMeta[]
  quality?: QualityFlags
}

export const VALID_TYPES: QuestionType[] = ['multiple_choice_single', 'multiple_choice_multi', 'true_false', 'fill_in_blank']
export const normalizeType = (t: string): QuestionType =>
  VALID_TYPES.includes(t as QuestionType) ? (t as QuestionType) : 'multiple_choice_single'

export const CLAUDE_MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', noteKey: 'admin.aiGenerator.models.haiku45Note' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', noteKey: 'admin.aiGenerator.models.sonnet46Note' },
  { id: 'claude-opus-4-6', label: 'Opus 4.6', noteKey: 'admin.aiGenerator.models.opus46Note' },
]

export const DRAFTS_STORAGE_KEY = 'ai_question_drafts'

export function loadDraftsFromStorage(): DraftQuestion[] {
  try {
    const raw = sessionStorage.getItem(DRAFTS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveDraftsToStorage(drafts: DraftQuestion[]) {
  try { sessionStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts)) } catch { /* ignore */ }
}
