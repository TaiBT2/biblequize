import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BookProgress from '../BookProgress'

describe('BookProgress', () => {
  it('renders with default props', () => {
    render(<BookProgress />)
    expect(screen.getByText('Genesis')).toBeInTheDocument()
    expect(screen.getByText('📚 Tiến Độ Kinh Thánh')).toBeInTheDocument()
  })

  it('displays current book name', () => {
    render(<BookProgress currentBook="Psalms" nextBook="Proverbs" />)
    expect(screen.getByText('Psalms')).toBeInTheDocument()
  })

  it('displays progress as fraction', () => {
    render(<BookProgress currentIndex={5} totalBooks={66} />)
    expect(screen.getByText('5/66')).toBeInTheDocument()
  })

  it('displays progress percentage', () => {
    render(<BookProgress progressPercentage={25.5} />)
    expect(screen.getByText('25.5% hoàn thành')).toBeInTheDocument()
  })

  it('shows completion badge when completed', () => {
    render(<BookProgress isCompleted={true} />)
    expect(screen.getByText('🏆 Hoàn Thành!')).toBeInTheDocument()
  })

  it('shows post-cycle mode when completed', () => {
    render(<BookProgress isCompleted={true} />)
    expect(screen.getByText('🎯 Chế độ Sau Chu Kỳ')).toBeInTheDocument()
  })

  it('hides stats grid when completed', () => {
    render(<BookProgress isCompleted={true} />)
    expect(screen.queryByText('Đã làm')).not.toBeInTheDocument()
  })

  it('shows question count and needed for next', () => {
    render(<BookProgress questionsInCurrentBook={30} nextBook="Exodus" />)
    expect(screen.getByText('30/50 câu')).toBeInTheDocument()
    expect(screen.getByText('Còn 20 câu → Exodus')).toBeInTheDocument()
  })

  it('shows accuracy rate', () => {
    render(<BookProgress questionsInCurrentBook={20} correctAnswersInCurrentBook={15} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('Đúng 15/20')).toBeInTheDocument()
  })

  it('shows 0% accuracy when no questions answered', () => {
    render(<BookProgress questionsInCurrentBook={0} correctAnswersInCurrentBook={0} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows next book preview when not completed', () => {
    render(<BookProgress nextBook="Leviticus" isCompleted={false} />)
    expect(screen.getByText('Leviticus')).toBeInTheDocument()
    expect(screen.getByText('📖 Sách tiếp theo')).toBeInTheDocument()
  })

  it('hides next book when completed', () => {
    render(<BookProgress isCompleted={true} nextBook="Exodus" />)
    expect(screen.queryByText('📖 Sách tiếp theo')).not.toBeInTheDocument()
  })
})
