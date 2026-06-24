import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRoomChatHistory } from '../useRoomChatHistory'
import { useRoomChatStore, selectRoomMessages } from '../../store/roomChatStore'

const mockGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: unknown[]) => mockGet(...args) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  useRoomChatStore.setState({ messagesByRoom: {} })
})

describe('useRoomChatHistory', () => {
  it('fetches history and seeds the store (mapping isSystem + isHost)', async () => {
    mockGet.mockResolvedValue({
      data: { success: true, messages: [
        { sender: 'SYSTEM', text: 'đã tham gia', isSystem: true, ts: 1700000000000 },
        { sender: 'Host', text: 'hello', isSystem: false, ts: 1700000001000 },
        { sender: 'Bob', text: 'hi', isSystem: false },
      ] },
    })
    renderHook(() => useRoomChatHistory('R1', 'Host'))

    await waitFor(() => {
      expect(selectRoomMessages('R1')(useRoomChatStore.getState())).toHaveLength(3)
    })
    expect(mockGet).toHaveBeenCalledWith('/api/rooms/R1/chat')
    const msgs = selectRoomMessages('R1')(useRoomChatStore.getState())
    expect(msgs[0]).toMatchObject({ sender: 'SYSTEM', isSystem: true })
    expect(msgs[1]).toMatchObject({ sender: 'Host', isHost: true })
    expect(msgs[2]).toMatchObject({ sender: 'Bob', isHost: false })
  })

  it('does not fetch when roomId is missing', () => {
    renderHook(() => useRoomChatHistory(null))
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('swallows fetch errors (chat history is non-critical)', async () => {
    mockGet.mockRejectedValue(new Error('boom'))
    renderHook(() => useRoomChatHistory('R2'))
    await waitFor(() => expect(mockGet).toHaveBeenCalled())
    expect(selectRoomMessages('R2')(useRoomChatStore.getState())).toEqual([])
  })
})
