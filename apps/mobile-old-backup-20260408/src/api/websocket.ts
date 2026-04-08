import { Client, type IMessage } from '@stomp/stompjs'
import { getWsBaseUrl } from './config'
import { getAccessToken } from './tokenStore'

export interface RoomEvent {
  type: string
  payload: any
  timestamp?: string
}

export type RoomEventHandler = (event: RoomEvent) => void

export function createStompClient(
  roomId: string,
  onEvent: RoomEventHandler,
  onError?: (error: string) => void,
): Client {
  const token = getAccessToken()
  const wsUrl = `${getWsBaseUrl()}/ws`

  const client = new Client({
    brokerURL: wsUrl,
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      client.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body)
          onEvent(data)
        } catch {
          onEvent({ type: 'RAW', payload: message.body })
        }
      })
    },

    onStompError: (frame) => {
      onError?.(frame.headers?.message ?? 'WebSocket error')
    },

    onWebSocketClose: () => {
      onError?.('Connection closed')
    },
  })

  client.activate()
  return client
}

export function sendRoomMessage(
  client: Client,
  roomId: string,
  type: string,
  payload: any = {},
): void {
  if (client.connected) {
    client.publish({
      destination: `/app/room/${roomId}`,
      body: JSON.stringify({ type, ...payload }),
    })
  }
}
