import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResultsChat from '../ResultsChat'
import { useRoomChatStore } from '../../../store/roomChatStore'

const reset = () => useRoomChatStore.setState({ messagesByRoom: {} })

describe('<ResultsChat>', () => {
  beforeEach(reset)

  it('shows a chat FAB and opens the drawer on click', () => {
    render(<ResultsChat roomId="R1" onSend={vi.fn()} />)
    const fab = screen.getByTestId('results-chat-fab')
    expect(fab).toBeInTheDocument()
    fireEvent.click(fab)
    expect(screen.getByTestId('lobby-chat-drawer')).toBeInTheDocument()
  })

  it('replays the prior conversation from the shared store', () => {
    useRoomChatStore.getState().appendMessage('R1', { sender: 'Alice', text: 'gg everyone' })
    render(<ResultsChat roomId="R1" onSend={vi.fn()} />)
    fireEvent.click(screen.getByTestId('results-chat-fab'))
    expect(screen.getByText('gg everyone')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('sends a trimmed message via onSend and clears the input', () => {
    const onSend = vi.fn()
    render(<ResultsChat roomId="R1" onSend={onSend} />)
    fireEvent.click(screen.getByTestId('results-chat-fab'))
    const input = screen.getByPlaceholderText(/Nhắn tin/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '  hello  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSend).toHaveBeenCalledWith('hello')
    expect(input.value).toBe('')
  })

  it('does not send empty/whitespace messages', () => {
    const onSend = vi.fn()
    render(<ResultsChat roomId="R1" onSend={onSend} />)
    fireEvent.click(screen.getByTestId('results-chat-fab'))
    const input = screen.getByPlaceholderText(/Nhắn tin/i)
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSend).not.toHaveBeenCalled()
  })
})
