import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import QuizSetListCard from '../QuizSetListCard'
import type { QuizSet } from '../../../api/quizSets'

const navigateMock = vi.fn()
vi.mock('react-router-dom', async (orig) => {
  const actual = await (orig() as Promise<typeof import('react-router-dom')>)
  return { ...actual, useNavigate: () => navigateMock }
})

const getMyAttemptsMock = vi.fn()
const startSoloPracticeMock = vi.fn()
const playQuizSetCoPlayMock = vi.fn()
vi.mock('../../../api/quizSets', async (orig) => {
  const actual = await (orig() as Promise<typeof import('../../../api/quizSets')>)
  return {
    ...actual,
    getMyAttempts: (...args: any[]) => getMyAttemptsMock(...args),
    startSoloPractice: (...args: any[]) => startSoloPracticeMock(...args),
    playQuizSetCoPlay: (...args: any[]) => playQuizSetCoPlayMock(...args),
  }
})

function buildQuizSet(overrides: Partial<QuizSet> = {}): QuizSet {
  return {
    id: 'qs-1',
    groupId: 'g-1',
    name: 'Sáng Thế Ký · Chương 1',
    questionIds: ['q1', 'q2', 'q3'],
    totalQuestions: 10,
    createdBy: 'u-1',
    createdAt: '2026-05-01T00:00:00Z',
    language: 'vi',
    description: 'Sự sáng tạo, Adam và Eva',
    publishStatus: 'PUBLISHED',
    playCount: 12,
    totalRatings: 0,
    difficulty: 'MIXED',
    ...overrides,
  } as QuizSet
}

const emptyMastery = {
  attempts: [],
  masterySummary: { totalAttempts: 0, bestScore: 0, bestAccuracy: null, learnedQuestionsCount: 0 },
}

describe('QuizSetListCard', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    getMyAttemptsMock.mockReset()
    startSoloPracticeMock.mockReset()
    playQuizSetCoPlayMock.mockReset()
    getMyAttemptsMock.mockResolvedValue(emptyMastery)
  })

  it('renders PUBLISHED card with title, status badge, stats, and 3 action buttons', async () => {
    const qs = buildQuizSet()
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={qs} myRole="MEMBER" isMember /></MemoryRouter>)
    expect(screen.getByText('Sáng Thế Ký · Chương 1')).toBeInTheDocument()
    expect(screen.getByText('Đã xuất bản')).toBeInTheDocument()
    expect(screen.getByTestId('btn-coplay')).toBeInTheDocument()
    expect(screen.getByTestId('btn-schedule')).toBeInTheDocument()
    expect(screen.getByTestId('btn-solo')).toBeInTheDocument()
    expect(screen.getByText(/12 lượt chơi/)).toBeInTheDocument()
  })

  it('co-play button is enabled for member on PUBLISHED set', () => {
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    const btn = screen.getByTestId('btn-coplay')
    expect(btn).not.toBeDisabled()
  })

  it('co-play button is disabled for non-members (defense in depth)', () => {
    render(
      <MemoryRouter>
        <QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole={null} isMember={false} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('btn-coplay')).toBeDisabled()
  })

  it('clicking co-play calls /play endpoint and navigates to /room/{id}/lobby', async () => {
    playQuizSetCoPlayMock.mockResolvedValue({ id: 'room-99', roomCode: 'ABC123', roomName: 'Genesis' })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    await act(async () => { fireEvent.click(screen.getByTestId('btn-coplay')) })
    await waitFor(() => expect(playQuizSetCoPlayMock).toHaveBeenCalledWith('g-1', 'qs-1'))
    expect(navigateMock).toHaveBeenCalledWith('/room/room-99/lobby')
  })

  it('shows error toast when /play returns 403 forbidden', async () => {
    playQuizSetCoPlayMock.mockRejectedValue({ response: { data: { message: 'Bạn không phải thành viên của nhóm' } } })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    await act(async () => { fireEvent.click(screen.getByTestId('btn-coplay')) })
    await waitFor(() => expect(screen.getByTestId('coplay-error')).toBeInTheDocument())
    expect(screen.getByTestId('coplay-error')).toHaveTextContent('Bạn không phải thành viên của nhóm')
  })

  it('schedule icon button is disabled with the schedule-coming-soon tooltip', () => {
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    const btn = screen.getByTestId('btn-schedule')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('title', 'Tính năng đặt lịch sắp ra mắt')
  })

  it('solo button enabled for member, click opens modal showing mastery stats', async () => {
    getMyAttemptsMock.mockResolvedValue({
      attempts: [{ sessionId: 's1', score: 8, correctAnswers: 8, totalQuestions: 10, accuracy: 80, completedAt: '2026-05-09T00:00:00Z' }],
      masterySummary: { totalAttempts: 2, bestScore: 8, bestAccuracy: 80, learnedQuestionsCount: 6 },
    })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    await waitFor(() => expect(getMyAttemptsMock).toHaveBeenCalled())
    fireEvent.click(screen.getByTestId('btn-solo'))
    await waitFor(() => expect(screen.getByTestId('solo-modal')).toBeInTheDocument())
    const modal = screen.getByTestId('solo-modal')
    expect(modal).toHaveTextContent(/Đã chơi:/)
    expect(modal).toHaveTextContent(/2 lượt/)
  })

  it('clicking solo modal confirm calls startSoloPractice and navigates to /quiz/{sessionId}', async () => {
    startSoloPracticeMock.mockResolvedValue({ sessionId: 'sess-99', questions: [] })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    await waitFor(() => expect(getMyAttemptsMock).toHaveBeenCalled())
    fireEvent.click(screen.getByTestId('btn-solo'))
    await waitFor(() => expect(screen.getByTestId('solo-modal-confirm')).toBeInTheDocument())
    await act(async () => {
      fireEvent.click(screen.getByTestId('solo-modal-confirm'))
    })
    await waitFor(() => expect(startSoloPracticeMock).toHaveBeenCalledWith('g-1', 'qs-1'))
    expect(navigateMock).toHaveBeenCalledWith('/quiz/sess-99?mode=solo&quizSetId=qs-1')
  })

  it('NO 3-attempt cap — solo button stays enabled with totalAttempts=5 (mastery semantics)', async () => {
    getMyAttemptsMock.mockResolvedValue({
      attempts: [],
      masterySummary: { totalAttempts: 5, bestScore: 9, bestAccuracy: 90, learnedQuestionsCount: 9 },
    })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    await waitFor(() => expect(getMyAttemptsMock).toHaveBeenCalled())
    expect(screen.getByTestId('btn-solo')).not.toBeDisabled()
  })

  it('renders personal-best banner only when user has played', async () => {
    getMyAttemptsMock.mockResolvedValue({
      attempts: [],
      masterySummary: { totalAttempts: 1, bestScore: 7, bestAccuracy: 70, learnedQuestionsCount: 5 },
    })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    await waitFor(() => expect(screen.getByTestId('personal-best-banner')).toBeInTheDocument())
  })

  it('hides personal-best banner when totalAttempts=0', async () => {
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    await waitFor(() => expect(getMyAttemptsMock).toHaveBeenCalled())
    expect(screen.queryByTestId('personal-best-banner')).toBeNull()
  })

  it('DRAFT card shows "Tiếp tục soạn" for leader, no co-play/solo buttons', () => {
    const qs = buildQuizSet({ publishStatus: 'DRAFT' })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={qs} myRole="LEADER" isMember /></MemoryRouter>)
    expect(screen.getByTestId('btn-edit-draft')).toBeInTheDocument()
    expect(screen.queryByTestId('btn-coplay')).toBeNull()
    expect(screen.queryByTestId('btn-solo')).toBeNull()
  })

  it('ARCHIVED card shows "Xem chi tiết" primary button', () => {
    const qs = buildQuizSet({ publishStatus: 'ARCHIVED' })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={qs} myRole="MEMBER" isMember /></MemoryRouter>)
    expect(screen.getByTestId('btn-view-archived')).toBeInTheDocument()
    expect(screen.queryByTestId('btn-coplay')).toBeNull()
  })

  it('leader sees the ⋯ menu button, plain member does not', () => {
    const qs = buildQuizSet()
    const { rerender } = render(
      <MemoryRouter><QuizSetListCard groupId="g-1" qs={qs} myRole="LEADER" isMember /></MemoryRouter>
    )
    expect(screen.getByLabelText('Tùy chọn')).toBeInTheDocument()
    rerender(
      <MemoryRouter><QuizSetListCard groupId="g-1" qs={qs} myRole="MEMBER" isMember /></MemoryRouter>
    )
    expect(screen.queryByLabelText('Tùy chọn')).toBeNull()
  })

  it('my-attempts panel toggles open/closed when chevron clicked', async () => {
    getMyAttemptsMock.mockResolvedValue({
      attempts: [
        { sessionId: 's2', score: 9, correctAnswers: 9, totalQuestions: 10, accuracy: 90, completedAt: '2026-05-10T00:00:00Z' },
        { sessionId: 's1', score: 7, correctAnswers: 7, totalQuestions: 10, accuracy: 70, completedAt: '2026-05-09T00:00:00Z' },
      ],
      masterySummary: { totalAttempts: 2, bestScore: 9, bestAccuracy: 90, learnedQuestionsCount: 8 },
    })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    const toggle = await screen.findByTestId('my-attempts-toggle')
    expect(screen.queryByTestId('my-attempts-list')).toBeNull()
    fireEvent.click(toggle)
    expect(screen.getByTestId('my-attempts-list')).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(screen.queryByTestId('my-attempts-list')).toBeNull()
  })
})
