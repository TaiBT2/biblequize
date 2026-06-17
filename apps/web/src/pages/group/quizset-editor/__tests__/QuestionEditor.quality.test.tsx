import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import QuestionEditor from '../QuestionEditor'
import type { EditorQuestion } from '../../../../api/quizSets'

// AEU-5: QuestionEditor surfaces AI distractor error-types + a quality warning banner.

const baseQuestion: EditorQuestion = {
  id: 'q1',
  book: 'John',
  chapter: 3,
  verseStart: 16,
  verseEnd: 16,
  difficulty: 'medium',
  type: 'single',
  content: 'Câu hỏi mẫu để kiểm tra chất lượng distractor?',
  options: ['Đáp án A', 'Đáp án B', 'Đáp án C đúng', 'Đáp án D'],
  correctAnswer: [2],
  explanation: 'Giải thích mẫu đủ dài cho bài kiểm tra hiển thị.',
  source: 'ai-group',
  language: 'vi',
}

function renderEditor(q: EditorQuestion) {
  return render(
    <QuestionEditor index={0} question={q} onChange={vi.fn()} onDelete={vi.fn()} />
  )
}

describe('QuestionEditor — AEU distractor quality', () => {
  it('renders per-distractor error-type labels for AI-generated questions', () => {
    renderEditor({
      ...baseQuestion,
      distractors: [
        { index: 0, errorType: 'nearby_passage', almostRight: false },
        { index: 1, errorType: 'wrong_detail', almostRight: true },
        { index: 3, errorType: 'true_but_off', almostRight: false },
      ],
      quality: { valid: true, duplicateErrorType: false, almostRightCount: 1, requiredAlmostRight: 1, reasons: [] },
    })
    // Vietnamese labels from admin.aiGenerator.draftCard.errorType.*
    expect(screen.getByText('sai chi tiết')).toBeInTheDocument()
    expect(screen.getByText(/đúng nhưng lạc câu hỏi/)).toBeInTheDocument()
    // valid quality → no warning banner
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a quality warning banner with reasons when invalid', () => {
    renderEditor({
      ...baseQuestion,
      distractors: [
        { index: 0, errorType: 'wrong_detail', almostRight: false },
        { index: 1, errorType: 'wrong_detail', almostRight: false },
        { index: 3, errorType: 'true_but_off', almostRight: false },
      ],
      quality: {
        valid: false, duplicateErrorType: true, almostRightCount: 0, requiredAlmostRight: 1,
        reasons: ['duplicate_error_type', 'insufficient_almost_right'],
      },
    })
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/Cảnh báo chất lượng distractor/)
    expect(alert).toHaveTextContent(/trùng loại lỗi/)
    expect(alert).toHaveTextContent(/gần đúng/)
  })

  it('renders no quality UI for a plain (non-AI) question', () => {
    renderEditor(baseQuestion)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('sai chi tiết')).not.toBeInTheDocument()
  })
})
