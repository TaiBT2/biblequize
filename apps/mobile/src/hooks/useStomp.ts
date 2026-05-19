import { useEffect, useRef, useState } from 'react'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getBaseURL } from '../api/client'

export interface StompOptions {
  url?: string
  roomId?: string
  onMessage?: (msg: any) => void
  onConnect?: () => void
  onReconnect?: () => void
  onDisconnect?: () => void
}

/**
 * Mobile port of apps/web/src/hooks/useStomp.ts.
 *
 * Differences từ web:
 *   - Access token đọc async từ AsyncStorage (web dùng in-memory tokenStore).
 *   - WS URL build từ apiClient base URL (web dùng window.location fallback).
 *
 * Subscribes `/topic/room/{roomId}` khi connect (and on reconnect).
 * Returns `{ connected, reconnecting, send }`. `send` returns false khi WS
 * chưa kết nối — caller dùng để rollback optimistic UI hoặc show toast.
 */
export function useStomp({ url = '/ws', roomId, onMessage, onConnect, onReconnect, onDisconnect }: StompOptions) {
  const clientRef = useRef<Client | null>(null)
  const subsRef = useRef<StompSubscription | null>(null)
  const tokenRef = useRef<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const connectedOnceRef = useRef(false)

  const onMessageRef = useRef(onMessage)
  const onConnectRef = useRef(onConnect)
  const onReconnectRef = useRef(onReconnect)
  const onDisconnectRef = useRef(onDisconnect)
  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])
  useEffect(() => { onConnectRef.current = onConnect }, [onConnect])
  useEffect(() => { onReconnectRef.current = onReconnect }, [onReconnect])
  useEffect(() => { onDisconnectRef.current = onDisconnect }, [onDisconnect])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const token = await AsyncStorage.getItem('accessToken')
      if (cancelled) return
      tokenRef.current = token

      const apiBase = getBaseURL()
      let wsUrl: string
      try {
        const u = new URL(apiBase)
        u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'
        u.pathname = url
        u.search = ''
        u.hash = ''
        wsUrl = u.toString()
      } catch {
        wsUrl = url
      }

      const client = new Client({
        brokerURL: wsUrl,
        reconnectDelay: 2000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        connectHeaders: {
          Authorization: `Bearer ${token ?? ''}`,
        },
        onConnect: () => {
          setConnected(true)
          setReconnecting(false)

          const isReconnect = connectedOnceRef.current
          connectedOnceRef.current = true

          if (roomId) {
            try { subsRef.current?.unsubscribe() } catch {}
            subsRef.current = client.subscribe(`/topic/room/${roomId}`, (frame: IMessage) => {
              try {
                const body = JSON.parse(frame.body)
                onMessageRef.current?.(body)
              } catch {}
            })
          }

          if (isReconnect) {
            onReconnectRef.current?.()
          } else {
            onConnectRef.current?.()
          }
        },
        onStompError: () => {},
        onWebSocketClose: () => {
          setConnected(false)
          subsRef.current = null
          if (connectedOnceRef.current) setReconnecting(true)
          onDisconnectRef.current?.()
        },
      })

      clientRef.current = client
      client.activate()
    }

    init()

    return () => {
      cancelled = true
      try { subsRef.current?.unsubscribe() } catch {}
      clientRef.current?.deactivate()
      clientRef.current = null
      connectedOnceRef.current = false
    }
  }, [url, roomId])

  const send = (destination: string, payload: any): boolean => {
    if (!clientRef.current || !connected) return false
    clientRef.current.publish({
      destination,
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${tokenRef.current ?? ''}` },
    })
    return true
  }

  return { connected, reconnecting, send }
}
