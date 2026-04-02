export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionType = 'multiple_choice_single' | 'multiple_choice_multi' | 'true_false' | 'fill_in_blank'
export type DraftStatus = 'pending' | 'approved' | 'rejected'

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
}

export const VALID_TYPES: QuestionType[] = ['multiple_choice_single', 'multiple_choice_multi', 'true_false', 'fill_in_blank']
export const normalizeType = (t: string): QuestionType =>
  VALID_TYPES.includes(t as QuestionType) ? (t as QuestionType) : 'multiple_choice_single'

export const CLAUDE_MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', note: 'Nhanh · Rẻ' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', note: 'Cân bằng · Mới nhất' },
  { id: 'claude-opus-4-6', label: 'Opus 4.6', note: 'Chất lượng cao' },
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
