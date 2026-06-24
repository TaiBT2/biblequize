import { describe, it, expect, beforeEach } from 'vitest'
import { useRoomChatStore, selectRoomMessages } from '../roomChatStore'

const reset = () => useRoomChatStore.setState({ messagesByRoom: {} })

describe('roomChatStore', () => {
  beforeEach(reset)

  it('appends messages per room (isolated by roomId)', () => {
    const { appendMessage } = useRoomChatStore.getState()
    appendMessage('A', { sender: 'u1', text: 'hi A' })
    appendMessage('B', { sender: 'u2', text: 'hi B' })
    appendMessage('A', { sender: 'u3', text: 'again A' })

    const state = useRoomChatStore.getState()
    expect(selectRoomMessages('A')(state).map(m => m.text)).toEqual(['hi A', 'again A'])
    expect(selectRoomMessages('B')(state).map(m => m.text)).toEqual(['hi B'])
  })

  it('selector returns a stable empty array for unknown/missing room', () => {
    const state = useRoomChatStore.getState()
    expect(selectRoomMessages('nope')(state)).toEqual([])
    expect(selectRoomMessages(null)(state)).toEqual([])
    expect(selectRoomMessages(undefined)(state)).toBe(selectRoomMessages('x')(state))
  })

  it('ignores empty roomId', () => {
    useRoomChatStore.getState().appendMessage('', { sender: 'u', text: 'x' })
    expect(useRoomChatStore.getState().messagesByRoom).toEqual({})
  })

  it('caps history at 200 messages (keeps the most recent)', () => {
    const { appendMessage } = useRoomChatStore.getState()
    for (let i = 0; i < 250; i++) appendMessage('A', { sender: 'u', text: `m${i}` })
    const msgs = selectRoomMessages('A')(useRoomChatStore.getState())
    expect(msgs).toHaveLength(200)
    expect(msgs[0].text).toBe('m50')
    expect(msgs[199].text).toBe('m249')
  })

  it('setMessages replaces a room history wholesale (capped)', () => {
    const { appendMessage, setMessages } = useRoomChatStore.getState()
    appendMessage('A', { sender: 'u', text: 'old' })
    setMessages('A', [
      { sender: 'h', text: 'history1' },
      { sender: 'h', text: 'history2' },
    ])
    const msgs = selectRoomMessages('A')(useRoomChatStore.getState())
    expect(msgs.map(m => m.text)).toEqual(['history1', 'history2'])

    setMessages('A', Array.from({ length: 250 }, (_, i) => ({ sender: 'u', text: `m${i}` })))
    expect(selectRoomMessages('A')(useRoomChatStore.getState())).toHaveLength(200)
  })

  it('resetRoom clears one room only', () => {
    const { appendMessage, resetRoom } = useRoomChatStore.getState()
    appendMessage('A', { sender: 'u', text: 'a' })
    appendMessage('B', { sender: 'u', text: 'b' })
    resetRoom('A')
    const state = useRoomChatStore.getState()
    expect(selectRoomMessages('A')(state)).toEqual([])
    expect(selectRoomMessages('B')(state).map(m => m.text)).toEqual(['b'])
  })
})
