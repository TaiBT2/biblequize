import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExplanationPanel from '../ExplanationPanel'

vi.mock('../../../api/client', () => ({
  api: { post: vi.fn().mockResolvedValue({ data: {} }) },
}))

describe('ExplanationPanel', () => {
  it('renders explanation text + scripture ref + both buttons', () => {
    render(
      <ExplanationPanel
        questionId="q-1"
        scriptureRef="Sáng Thế Ký 1:14-19"
        explanation="Vào ngày thứ tư, Đức Chúa Trời tạo dựng các vì sáng."
        onContinue={() => {}}
      />
    )
    expect(screen.getByTestId('explanation-panel')).toBeInTheDocument()
    expect(screen.getByText(/Sáng Thế Ký 1:14-19/)).toBeInTheDocument()
    expect(screen.getByText(/ngày thứ tư/)).toBeInTheDocument()
    expect(screen.getByTestId('explanation-bookmark')).toHaveTextContent('Đánh dấu ôn lại')
    expect(screen.getByTestId('explanation-continue')).toHaveTextContent('Tiếp tục')
  })

  it('bookmark button flips to "Đã đánh dấu" after click', () => {
    render(
      <ExplanationPanel
        questionId="q-1"
        explanation="lorem ipsum"
        onContinue={() => {}}
      />
    )
    const btn = screen.getByTestId('explanation-bookmark')
    expect(btn).toHaveTextContent('Đánh dấu ôn lại')
    fireEvent.click(btn)
    expect(btn).toHaveTextContent('Đã đánh dấu')
    expect(btn).toBeDisabled()
  })

  it('continue button calls onContinue', () => {
    const onContinue = vi.fn()
    render(
      <ExplanationPanel
        questionId="q-1"
        explanation="lorem"
        onContinue={onContinue}
      />
    )
    fireEvent.click(screen.getByTestId('explanation-continue'))
    expect(onContinue).toHaveBeenCalledOnce()
  })
})
