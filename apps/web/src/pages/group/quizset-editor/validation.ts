import type { TFunction } from 'i18next'
import type { EditorQuestion, QuizSetFull } from '../../../api/quizSets'

export type QuestionIssue =
  | { kind: 'short_content' }
  | { kind: 'option_empty'; index: number }
  | { kind: 'no_correct' }
  | { kind: 'short_explanation' }
  | { kind: 'bad_scripture' }

export function validateQuestion(q: EditorQuestion): QuestionIssue[] {
  const issues: QuestionIssue[] = []
  if (!q.content || q.content.trim().length < 10) issues.push({ kind: 'short_content' })
  for (let i = 0; i < 4; i++) {
    const opt = q.options?.[i] ?? ''
    if (!opt || opt.trim().length < 1) issues.push({ kind: 'option_empty', index: i })
  }
  if (!q.correctAnswer || q.correctAnswer.length === 0) issues.push({ kind: 'no_correct' })
  if (!q.explanation || q.explanation.trim().length < 20) issues.push({ kind: 'short_explanation' })
  return issues
}

export function isQuestionValid(q: EditorQuestion): boolean {
  return validateQuestion(q).length === 0
}

export const MIN_QUESTIONS_TO_PUBLISH = 5

export type QuizSetIssue =
  | { kind: 'name_short' }
  | { kind: 'too_few_questions'; have: number; need: number }
  | { kind: 'invalid_questions'; ids: string[] }

export function validateQuizSet(qs: QuizSetFull): QuizSetIssue[] {
  const issues: QuizSetIssue[] = []
  if (!qs.name || qs.name.trim().length < 3) issues.push({ kind: 'name_short' })
  const count = qs.questions?.length ?? 0
  if (count < MIN_QUESTIONS_TO_PUBLISH) {
    issues.push({ kind: 'too_few_questions', have: count, need: MIN_QUESTIONS_TO_PUBLISH })
  }
  const invalid = (qs.questions || []).filter(q => !isQuestionValid(q)).map(q => q.id)
  if (invalid.length > 0) issues.push({ kind: 'invalid_questions', ids: invalid })
  return issues
}

export function issueLabel(t: TFunction, i: QuestionIssue): string {
  switch (i.kind) {
    case 'short_content':     return t('quizSet.editor.validation.shortContent')
    case 'option_empty':      return t('quizSet.editor.validation.optionEmpty', { letter: 'ABCD'[i.index] })
    case 'no_correct':        return t('quizSet.editor.validation.noCorrect')
    case 'short_explanation': return t('quizSet.editor.validation.shortExplanation')
    case 'bad_scripture':     return t('quizSet.editor.validation.badScripture')
  }
}
