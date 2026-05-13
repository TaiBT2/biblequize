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

export type QuizSetIssue =
  | { kind: 'name_short' }
  | { kind: 'no_questions' }
  | { kind: 'invalid_questions'; ids: string[] }

export function validateQuizSet(qs: QuizSetFull): QuizSetIssue[] {
  const issues: QuizSetIssue[] = []
  if (!qs.name || qs.name.trim().length < 3) issues.push({ kind: 'name_short' })
  if (!qs.questions || qs.questions.length === 0) issues.push({ kind: 'no_questions' })
  const invalid = (qs.questions || []).filter(q => !isQuestionValid(q)).map(q => q.id)
  if (invalid.length > 0) issues.push({ kind: 'invalid_questions', ids: invalid })
  return issues
}

export function issueLabel(i: QuestionIssue): string {
  switch (i.kind) {
    case 'short_content':     return 'Câu hỏi quá ngắn (cần ≥10 ký tự)'
    case 'option_empty':      return `Đáp án ${'ABCD'[i.index]} trống`
    case 'no_correct':        return 'Chưa chọn đáp án đúng'
    case 'short_explanation': return 'Giải thích quá ngắn (cần ≥20 ký tự)'
    case 'bad_scripture':     return 'Câu Kinh Thánh sai định dạng'
  }
}
