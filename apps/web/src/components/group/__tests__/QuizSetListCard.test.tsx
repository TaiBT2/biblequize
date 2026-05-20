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

const playQuizSetCoPlayMock = vi.fn()
vi.mock('../../../api/quizSets', async (orig) => {
  const actual = await (orig() as Promise<typeof import('../../../api/quizSets')>)
  return {
    ...actual,
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

describe('QuizSetListCard', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    playQuizSetCoPlayMock.mockReset()
  })

  it('leader view: PUBLISHED card shows co-play + schedule buttons (no solo since solo mode was removed)', () => {
    const qs = buildQuizSet()
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={qs} myRole="LEADER" isMember /></MemoryRouter>)
    expect(screen.getByText('Sáng Thế Ký · Chương 1')).toBeInTheDocument()
    expect(screen.getByText('Đã xuất bản')).toBeInTheDocument()
    expect(screen.getByTestId('btn-coplay')).toBeInTheDocument()
    expect(screen.getByTestId('btn-schedule')).toBeInTheDocument()
    expect(screen.queryByTestId('btn-solo')).toBeNull()
  })

  it('member view default: shows "Đợi trưởng nhóm" hint when no live room/schedule', () => {
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="MEMBER" isMember /></MemoryRouter>)
    expect(screen.getByTestId('btn-wait-leader')).toBeInTheDocument()
    expect(screen.queryByTestId('btn-solo')).toBeNull()
    expect(screen.queryByTestId('btn-coplay')).toBeNull()
    expect(screen.queryByTestId('btn-join-live')).toBeNull()
    expect(screen.queryByTestId('btn-join-schedule')).toBeNull()
  })

  it('member view with live co-play room: shows "Tham gia" CTA → navigate to lobby', () => {
    render(
      <MemoryRouter>
        <QuizSetListCard
          groupId="g-1"
          qs={buildQuizSet()}
          myRole="MEMBER"
          isMember
          activeCoPlayRoom={{ id: 'room-77', roomCode: 'XYZ789', currentPlayers: 2, maxPlayers: 8 }}
        />
      </MemoryRouter>
    )
    const btn = screen.getByTestId('btn-join-live')
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveTextContent(/Tham gia/)
    expect(btn).toHaveTextContent(/2\/8/)
    expect(screen.queryByTestId('btn-coplay')).toBeNull()
    fireEvent.click(btn)
    expect(navigateMock).toHaveBeenCalledWith('/room/room-77/lobby', { state: { fromGroupId: 'g-1' } })
  })

  it('member view with active schedule (no live room): shows "Tham gia lịch" CTA', () => {
    render(
      <MemoryRouter>
        <QuizSetListCard
          groupId="g-1"
          qs={buildQuizSet()}
          myRole="MEMBER"
          isMember
          activeSchedule={{ id: 'sch-1', deadline: '2026-05-15T19:00:00Z' }}
        />
      </MemoryRouter>
    )
    const btn = screen.getByTestId('btn-join-schedule')
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveTextContent(/Tham gia lịch/)
    fireEvent.click(btn)
    expect(navigateMock).toHaveBeenCalledWith('/groups/g-1/scheduled-quizzes/sch-1')
  })

  it('member view: live room overrides scheduled when both present', () => {
    render(
      <MemoryRouter>
        <QuizSetListCard
          groupId="g-1"
          qs={buildQuizSet()}
          myRole="MEMBER"
          isMember
          activeCoPlayRoom={{ id: 'room-99', roomCode: 'AAA' }}
          activeSchedule={{ id: 'sch-1' }}
        />
      </MemoryRouter>
    )
    expect(screen.getByTestId('btn-join-live')).toBeInTheDocument()
    expect(screen.queryByTestId('btn-join-schedule')).toBeNull()
  })

  it('leader: clicking co-play calls /play endpoint and navigates to /room/{id}/lobby', async () => {
    playQuizSetCoPlayMock.mockResolvedValue({ id: 'room-99', roomCode: 'ABC123', roomName: 'Genesis' })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="LEADER" isMember /></MemoryRouter>)
    await act(async () => { fireEvent.click(screen.getByTestId('btn-coplay')) })
    await waitFor(() => expect(playQuizSetCoPlayMock).toHaveBeenCalledWith('g-1', 'qs-1'))
    expect(navigateMock).toHaveBeenCalledWith('/room/room-99/lobby', { state: { fromGroupId: 'g-1' } })
  })

  it('leader: shows error toast when /play returns 403 forbidden', async () => {
    playQuizSetCoPlayMock.mockRejectedValue({ response: { data: { message: 'Bạn không phải thành viên của nhóm' } } })
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="LEADER" isMember /></MemoryRouter>)
    await act(async () => { fireEvent.click(screen.getByTestId('btn-coplay')) })
    await waitFor(() => expect(screen.getByTestId('coplay-error')).toBeInTheDocument())
    expect(screen.getByTestId('coplay-error')).toHaveTextContent('Bạn không phải thành viên của nhóm')
  })

  it('leader: schedule icon button navigates to /groups/:id/scheduled-quizzes/new?quizSetId=…', () => {
    render(<MemoryRouter><QuizSetListCard groupId="g-1" qs={buildQuizSet()} myRole="LEADER" isMember /></MemoryRouter>)
    const btn = screen.getByTestId('btn-schedule')
    expect(btn).not.toBeDisabled()
    expect(btn).toHaveAttribute('title', 'Đặt lịch quiz')
    fireEvent.click(btn)
    expect(navigateMock).toHaveBeenCalledWith('/groups/g-1/scheduled-quizzes/new?quizSetId=qs-1')
  })

  it('DRAFT card shows "Tiếp tục soạn" for leader, no co-play button', () => {
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
})
