// PQS-4 — Personal Quiz Set API adapter (Phase 1 MVP).
// Mirrors the function shape of api/quizSets.ts but drops the leading `groupId`
// argument: personal sets are owned by the authenticated user directly.
//
// Internally calls /api/question-sets/* (set CRUD + items + publish + /full) and
// /api/user-questions/* (per-question content CRUD).
//
// Phase 2 deferred: aiGenerateForSet, aiRewriteQuestion, getAIQuota → stubbed
// so the shared QuizSetEditor TypeScript surface stays the same.

import { api } from './client'
import type {
  CreateQuizSetBody, EditorQuestion, QuizSet, QuizSetFull, AddQuestionBody,
  AIGenerateForSetBody, AIGenerateForSetResponse, AIRewriteResponse,
} from './quizSets'

const SET_BASE = '/api/question-sets'

export async function createQuizSet(body: CreateQuizSetBody): Promise<QuizSet> {
  const res = await api.post(SET_BASE, body)
  return res.data.set
}

export async function updateQuizSet(setId: string, body: Partial<CreateQuizSetBody>): Promise<QuizSet> {
  const res = await api.patch(`${SET_BASE}/${setId}`, body)
  return res.data.set
}

export async function publishQuizSet(setId: string): Promise<QuizSet> {
  const res = await api.patch(`${SET_BASE}/${setId}/publish`)
  return res.data.quizSet
}

export async function getQuizSetFull(setId: string): Promise<QuizSetFull> {
  const res = await api.get(`${SET_BASE}/${setId}/full`)
  return res.data.quizSet
}

/** Add a question: create UserQuestion (bank entry) then attach to set. */
export async function addQuestion(setId: string, body: AddQuestionBody = {}): Promise<{
  question: EditorQuestion
  totalQuestions: number
}> {
  const correctAnswer = normalizeCorrect(body.correctAnswer)
  const qRes = await api.post('/api/user-questions', {
    content:       body.content ?? '',
    options:       body.options ?? ['', '', '', ''],
    correctAnswer,
    difficulty:    (body.difficulty ?? 'medium').toUpperCase(),
    explanation:   body.explanation ?? '',
    book:          body.book ?? '',
    chapter:       body.chapter ?? null,
    language:      body.language ?? 'vi',
  })
  const newQid: string = qRes.data.question.id
  await api.post(`${SET_BASE}/${setId}/items`, { questionId: newQid })
  const full = await getQuizSetFull(setId)
  const created = full.questions.find(q => q.id === newQid)
    ?? toEditorQuestionFallback(qRes.data.question, body)
  return { question: created, totalQuestions: full.totalQuestions }
}

export async function updateQuestion(
  _setId: string, qid: string, body: Partial<AddQuestionBody>,
): Promise<EditorQuestion> {
  // PUT /api/user-questions/{id} requires full body shape; coalesce with safe defaults.
  const payload: Record<string, unknown> = {
    content:       body.content ?? '',
    options:       body.options ?? ['', '', '', ''],
    correctAnswer: normalizeCorrect(body.correctAnswer),
    difficulty:    (body.difficulty ?? 'medium').toUpperCase(),
    explanation:   body.explanation ?? '',
    book:          body.book ?? '',
    chapter:       body.chapter ?? null,
    language:      body.language ?? 'vi',
  }
  const res = await api.put(`/api/user-questions/${qid}`, payload)
  return toEditorQuestionFallback(res.data.question, body)
}

export async function deleteQuestion(setId: string, qid: string): Promise<number> {
  await api.delete(`${SET_BASE}/${setId}/items/${qid}`)
  const full = await getQuizSetFull(setId)
  return full.totalQuestions
}

export async function reorderQuestions(setId: string, questionIds: string[]): Promise<string[]> {
  const res = await api.put(`${SET_BASE}/${setId}/items`, { questionIds })
  return (res.data.items ?? []).map((i: { questionId: string }) => i.questionId)
}

// ── Phase 2 stubs (folder + AI) ──────────────────────────────────────────────

export async function aiGenerateForSet(_setId: string, _body: AIGenerateForSetBody): Promise<AIGenerateForSetResponse> {
  throw new Error('AI generate on personal sets — Phase 2 (not yet implemented)')
}

export async function aiRewriteQuestion(_setId: string, _qid: string, _hint?: string): Promise<AIRewriteResponse> {
  throw new Error('AI rewrite on personal sets — Phase 2 (not yet implemented)')
}

export async function getAIQuota(): Promise<{ used: number; limit: number; remaining: number }> {
  // Personal sets share group quota in Phase 2 — until then, report empty quota.
  return { used: 0, limit: 0, remaining: 0 }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeCorrect(c: AddQuestionBody['correctAnswer'] | undefined): number {
  if (Array.isArray(c)) return c[0] ?? 0
  if (typeof c === 'number') return c
  return 0
}

/** Fallback EditorQuestion from /api/user-questions response (less rich than /full mapper). */
function toEditorQuestionFallback(q: Record<string, unknown>, body: Partial<AddQuestionBody>): EditorQuestion {
  return {
    id:            String(q.id ?? ''),
    book:          String(q.book ?? body.book ?? ''),
    chapter:       (q.chapter as number | null) ?? body.chapter ?? null,
    verseStart:    null,
    verseEnd:      null,
    difficulty:    ((body.difficulty ?? 'medium') as EditorQuestion['difficulty']),
    type:          'single',
    content:       String(q.content ?? body.content ?? ''),
    options:       (q.options as string[]) ?? body.options ?? ['', '', '', ''],
    correctAnswer: [normalizeCorrect(body.correctAnswer ?? (q.correctAnswer as number | undefined))],
    explanation:   String(q.explanation ?? body.explanation ?? ''),
    source:        'manual',
    language:      String(q.language ?? body.language ?? 'vi'),
  }
}
