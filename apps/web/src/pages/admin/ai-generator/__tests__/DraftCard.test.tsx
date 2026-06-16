import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// react-i18next stub — returns the key so we can assert on key text.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import DraftCard from '../DraftCard'
import type { DraftQuestion } from '../types'

const baseDraft: DraftQuestion = {
  id: 'd1',
  status: 'pending',
  book: 'Genesis',
  chapter: 1,
  verseStart: 1,
  verseEnd: 5,
  difficulty: 'medium',
  type: 'multiple_choice_single',
  language: 'vi',
  content: 'Câu hỏi?',
  options: ['A', 'B', 'C', 'D'],
  correctAnswer: 2,
  explanation: 'vì sao',
  tags: [],
  source: 'Kinh Thánh',
}

const noop = () => {}
function renderCard(draft: DraftQuestion) {
  return render(
    <DraftCard
      draft={draft} isEditing={false} isSaving={false} editData={{}}
      onEdit={noop} onChange={noop} onSaveEdit={noop} onCancelEdit={noop}
      onApprove={noop} onReject={noop} onRestore={noop} onRemove={noop}
    />,
  )
}

describe('DraftCard — AEQ error_type gate', () => {
  it('disables approve when quality is invalid', () => {
    renderCard({ ...baseDraft, quality: {
      valid: false, duplicateErrorType: true, almostRightCount: 1, requiredAlmostRight: 1,
      reasons: ['duplicate_error_type'],
    } })
    expect(screen.getByTestId('ai-draft-approve-btn').hasAttribute('disabled')).toBe(true)
    expect(screen.getByText('admin.aiGenerator.draftCard.reason.duplicate_error_type')).toBeTruthy()
  })

  it('enables approve when no quality flag', () => {
    renderCard(baseDraft)
    expect(screen.getByTestId('ai-draft-approve-btn').hasAttribute('disabled')).toBe(false)
  })

  it('renders distractor error-type tags', () => {
    renderCard({ ...baseDraft, distractors: [
      { index: 0, errorType: 'nearby_passage', almostRight: false },
      { index: 1, errorType: 'wrong_detail', almostRight: true },
    ] })
    expect(screen.getByText('admin.aiGenerator.draftCard.errorType.nearby_passage')).toBeTruthy()
    expect(screen.getByText('admin.aiGenerator.draftCard.errorType.wrong_detail')).toBeTruthy()
    // almost-right tag shown for the index-1 distractor
    expect(screen.getByText(/almostRightTag/)).toBeTruthy()
  })
})
