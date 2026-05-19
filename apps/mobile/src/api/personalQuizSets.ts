import { apiClient } from './client'

const SET_BASE = '/api/question-sets'

export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SOFT_DELETED'
export type QuizSetDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'

export interface QuizSet {
  id: string
  name: string
  description?: string
  publishStatus: PublishStatus
  difficulty?: QuizSetDifficulty
  estimatedDurationMin?: number
  language?: string
  tags?: string[]
  coverScripture?: string
  totalQuestions?: number
  questionCount?: number
  updatedAt?: string
  createdAt?: string
  publishedAt?: string
}

export interface EditorQuestion {
  id: string
  content: string
  options: string[]
  /** BE serializes as number[] (multi-answer support); single-answer uses [n]. */
  correctAnswer: number[]
  difficulty: 'easy' | 'medium' | 'hard'
  book: string
  chapter?: number | null
  verseStart?: number | null
  verseEnd?: number | null
  explanation?: string
  language?: string
  source?: string
}

export interface QuizSetFull extends QuizSet {
  questions: EditorQuestion[]
  totalQuestions: number
}

export interface CreateQuizSetBody {
  name: string
  description?: string
  tags?: string[]
  coverScripture?: string
  difficulty?: QuizSetDifficulty
  estimatedDurationMin?: number
  language?: string
}

export interface AddQuestionBody {
  content?: string
  options?: string[]
  correctAnswer?: number | number[]
  difficulty?: 'easy' | 'medium' | 'hard'
  explanation?: string
  book?: string
  chapter?: number | null
  language?: string
}

export async function listMySets(): Promise<QuizSet[]> {
  const res = await apiClient.get(SET_BASE)
  // BE may return { sets: [...] } or array directly — coalesce.
  return res.data.sets ?? res.data ?? []
}

export async function createSet(body: CreateQuizSetBody): Promise<QuizSet> {
  const res = await apiClient.post(SET_BASE, body)
  return res.data.set
}

export async function getSetFull(setId: string): Promise<QuizSetFull> {
  const res = await apiClient.get(`${SET_BASE}/${setId}/full`)
  return res.data.quizSet
}

export async function updateSet(setId: string, body: Partial<CreateQuizSetBody>): Promise<QuizSet> {
  const res = await apiClient.patch(`${SET_BASE}/${setId}`, body)
  return res.data.set
}

export async function publishSet(setId: string): Promise<QuizSet> {
  const res = await apiClient.patch(`${SET_BASE}/${setId}/publish`)
  return res.data.quizSet
}

export async function deleteSet(setId: string): Promise<void> {
  await apiClient.delete(`${SET_BASE}/${setId}`)
}

/** Create raw user-question + attach to set in 2 calls (mirror web pattern). */
export async function addQuestion(setId: string, body: AddQuestionBody): Promise<{ questionId: string; totalQuestions: number }> {
  const correctAnswer = normalizeCorrect(body.correctAnswer)
  const qRes = await apiClient.post('/api/user-questions', {
    content: body.content ?? '',
    options: body.options ?? ['', '', '', ''],
    correctAnswer,
    difficulty: (body.difficulty ?? 'medium').toUpperCase(),
    explanation: body.explanation ?? '',
    book: body.book ?? '',
    chapter: body.chapter ?? null,
    language: body.language ?? 'vi',
  })
  const qid: string = qRes.data.question.id
  await apiClient.post(`${SET_BASE}/${setId}/items`, { questionId: qid })
  const full = await getSetFull(setId)
  return { questionId: qid, totalQuestions: full.totalQuestions }
}

export async function updateQuestion(_setId: string, qid: string, body: AddQuestionBody): Promise<void> {
  await apiClient.put(`/api/user-questions/${qid}`, {
    content: body.content ?? '',
    options: body.options ?? ['', '', '', ''],
    correctAnswer: normalizeCorrect(body.correctAnswer),
    difficulty: (body.difficulty ?? 'medium').toUpperCase(),
    explanation: body.explanation ?? '',
    book: body.book ?? '',
    chapter: body.chapter ?? null,
    language: body.language ?? 'vi',
  })
}

export async function deleteQuestion(setId: string, qid: string): Promise<void> {
  await apiClient.delete(`${SET_BASE}/${setId}/items/${qid}`)
}

function normalizeCorrect(c: AddQuestionBody['correctAnswer'] | undefined): number {
  if (Array.isArray(c)) return c[0] ?? 0
  if (typeof c === 'number') return c
  return 0
}
