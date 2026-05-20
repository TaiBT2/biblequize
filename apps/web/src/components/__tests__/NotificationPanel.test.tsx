import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useRef } from 'react'
import i18n from '../../i18n'
import NotificationPanel, { type PanelNotification } from '../NotificationPanel'

function makeNotif(overrides: Partial<PanelNotification> = {}): PanelNotification {
  return {
    id: 'n-1',
    title: 'Streak sắp gãy!',
    body: 'Streak 2 ngày của bạn sắp gãy — hãy chơi hôm nay để giữ chuỗi',
    type: 'streak_warning',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    ...overrides,
  }
}

interface RenderProps {
  isOpen?: boolean
  notifications?: PanelNotification[]
  unreadCount?: number
  onClose?: () => void
  onItemClick?: (n: PanelNotification) => void
  onMarkAllRead?: () => void
}

function Harness(props: RenderProps) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={anchorRef} data-testid="harness-anchor">bell</button>
      <NotificationPanel
        isOpen={props.isOpen ?? true}
        notifications={props.notifications ?? []}
        unreadCount={props.unreadCount ?? 0}
        onClose={props.onClose ?? (() => {})}
        onItemClick={props.onItemClick ?? (() => {})}
        onMarkAllRead={props.onMarkAllRead ?? (() => {})}
        anchorRef={anchorRef}
      />
    </>
  )
}

describe('NotificationPanel', () => {
  beforeEach(() => {
    i18n.changeLanguage('vi')
  })

  it('renders nothing when isOpen is false', () => {
    render(<Harness isOpen={false} />)
    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument()
  })

  it('renders empty state when notifications array is empty', () => {
    render(<Harness notifications={[]} unreadCount={0} />)
    expect(screen.getByTestId('notification-empty')).toBeInTheDocument()
    expect(screen.getByText('Chưa có thông báo')).toBeInTheDocument()
  })

  it('renders subtitle "X chưa đọc" when there are unread items', () => {
    render(
      <Harness
        notifications={[makeNotif({ isRead: false })]}
        unreadCount={3}
      />
    )
    expect(screen.getByText('3 chưa đọc')).toBeInTheDocument()
  })

  it('renders "Đã đọc hết" when items exist but unreadCount is 0', () => {
    render(
      <Harness
        notifications={[makeNotif({ isRead: true })]}
        unreadCount={0}
      />
    )
    expect(screen.getByText('Đã đọc hết')).toBeInTheDocument()
  })

  it('disables Đọc tất cả button when no unread', () => {
    render(<Harness notifications={[makeNotif({ isRead: true })]} unreadCount={0} />)
    const btn = screen.getByTestId('notification-mark-all') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('calls onMarkAllRead when button clicked', () => {
    const onMarkAllRead = vi.fn()
    render(
      <Harness
        notifications={[makeNotif()]}
        unreadCount={1}
        onMarkAllRead={onMarkAllRead}
      />
    )
    fireEvent.click(screen.getByTestId('notification-mark-all'))
    expect(onMarkAllRead).toHaveBeenCalledTimes(1)
  })

  it('calls onItemClick with notification when item clicked', () => {
    const onItemClick = vi.fn()
    const notif = makeNotif({ id: 'abc-123' })
    render(
      <Harness
        notifications={[notif]}
        unreadCount={1}
        onItemClick={onItemClick}
      />
    )
    fireEvent.click(screen.getByTestId('notification-item-abc-123'))
    expect(onItemClick).toHaveBeenCalledWith(notif)
  })

  it('renders correct emoji for each known type', () => {
    const notifs: PanelNotification[] = [
      makeNotif({ id: 'a', type: 'streak_warning' }),
      makeNotif({ id: 'b', type: 'tier_up' }),
      makeNotif({ id: 'c', type: 'daily_reminder' }),
      makeNotif({ id: 'd', type: 'group_invite' }),
    ]
    render(<Harness notifications={notifs} unreadCount={4} />)
    expect(screen.getByText('🔥')).toBeInTheDocument()
    expect(screen.getByText('🏆')).toBeInTheDocument()
    expect(screen.getByText('📖')).toBeInTheDocument()
    expect(screen.getByText('👥')).toBeInTheDocument()
  })

  it('falls back to bell emoji for unknown type', () => {
    render(
      <Harness
        notifications={[makeNotif({ id: 'x', type: 'totally_new_type' })]}
        unreadCount={1}
      />
    )
    expect(screen.getByText('🔔')).toBeInTheDocument()
  })

  it('does not render "NaN" when createdAt is invalid', () => {
    render(
      <Harness
        notifications={[makeNotif({ createdAt: 'invalid-date' })]}
        unreadCount={1}
      />
    )
    const panel = screen.getByTestId('notification-panel')
    expect(panel.textContent).not.toContain('NaN')
  })

  it('calls onClose when ESC key pressed', () => {
    const onClose = vi.fn()
    render(<Harness notifications={[makeNotif()]} unreadCount={1} onClose={onClose} />)
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on outside mousedown', () => {
    const onClose = vi.fn()
    render(
      <div>
        <Harness notifications={[makeNotif()]} unreadCount={1} onClose={onClose} />
        <div data-testid="outside-area">outside</div>
      </div>
    )
    fireEvent.mouseDown(screen.getByTestId('outside-area'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when clicking the anchor (bell) itself', () => {
    const onClose = vi.fn()
    render(<Harness notifications={[makeNotif()]} unreadCount={1} onClose={onClose} />)
    fireEvent.mouseDown(screen.getByTestId('harness-anchor'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('groups consecutive identical (same type + same title) notifications into one row with ×N badge', () => {
    const notifs: PanelNotification[] = [
      makeNotif({ id: 'd1', type: 'daily_reminder', title: 'Câu hỏi mới mỗi ngày', body: 'b', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() }),
      makeNotif({ id: 'd2', type: 'daily_reminder', title: 'Câu hỏi mới mỗi ngày', body: 'b', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }),
      makeNotif({ id: 'd3', type: 'daily_reminder', title: 'Câu hỏi mới mỗi ngày', body: 'b', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() }),
    ]
    render(<Harness notifications={notifs} unreadCount={3} />)
    // Only the latest (d1) representative row renders.
    expect(screen.getByTestId('notification-item-d1')).toBeInTheDocument()
    expect(screen.queryByTestId('notification-item-d2')).toBeNull()
    expect(screen.queryByTestId('notification-item-d3')).toBeNull()
    // Group badge shows count.
    expect(screen.getByTestId('notification-group-badge-d1')).toHaveTextContent('×3')
  })

  it('different types are NOT grouped — each renders its own row', () => {
    const notifs: PanelNotification[] = [
      makeNotif({ id: 'a', type: 'streak_warning', title: 'Streak sắp gãy!' }),
      makeNotif({ id: 'b', type: 'tier_up', title: 'Streak sắp gãy!' }), // same title, diff type → separate
    ]
    render(<Harness notifications={notifs} unreadCount={2} />)
    expect(screen.getByTestId('notification-item-a')).toBeInTheDocument()
    expect(screen.getByTestId('notification-item-b')).toBeInTheDocument()
    expect(screen.queryByTestId('notification-group-badge-a')).toBeNull()
  })

  it('grouped row keeps unread style if ANY item in the group is unread', () => {
    const notifs: PanelNotification[] = [
      makeNotif({ id: 'r1', type: 'daily_reminder', title: 'X', isRead: true, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() }),
      makeNotif({ id: 'r2', type: 'daily_reminder', title: 'X', isRead: false, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }),
    ]
    const { container } = render(<Harness notifications={notifs} unreadCount={1} />)
    // Gold unread dot still shown.
    const dots = container.querySelectorAll('[aria-hidden="true"].rounded-full')
    expect(dots.length).toBe(1)
  })

  it('shows gold dot only on unread items', () => {
    const notifs: PanelNotification[] = [
      makeNotif({ id: 'unread', isRead: false }),
      makeNotif({ id: 'read', isRead: true }),
    ]
    const { container } = render(<Harness notifications={notifs} unreadCount={1} />)
    const dots = container.querySelectorAll('[aria-hidden="true"].rounded-full')
    expect(dots.length).toBe(1)
  })
})
