import { useEffect, useRef, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { getApiBaseUrl } from '../api/config';
import { getAccessToken } from '../api/tokenStore';

export interface StompOptions {
  url?: string;
  roomId?: string;
  onMessage?: (msg: any) => void;
  onConnect?: () => void;
  onReconnect?: () => void;  // called on 2nd+ successful connect
  onDisconnect?: () => void;
}

export function useStomp({ url = '/ws', roomId, onMessage, onConnect, onReconnect, onDisconnect }: StompOptions) {
  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const connectedOnceRef = useRef(false);

  // Keep callbacks fresh without recreating the STOMP client
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onReconnectRef = useRef(onReconnect);
  const onDisconnectRef = useRef(onDisconnect);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
  useEffect(() => { onReconnectRef.current = onReconnect; }, [onReconnect]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);

  useEffect(() => {
    const apiBase = getApiBaseUrl();
    let wsUrl: string;
    if (apiBase.startsWith('http')) {
      try {
        const u = new URL(apiBase);
        u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
        u.pathname = url;
        u.search = '';
        u.hash = '';
        wsUrl = u.toString();
      } catch {
        wsUrl = url;
      }
    } else {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProto}//${window.location.host}${url}`;
    }

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {
        Authorization: `Bearer ${getAccessToken() ?? ''}`,
      },
      onConnect: () => {
        setConnected(true);
        setReconnecting(false);

        const isReconnect = connectedOnceRef.current;
        connectedOnceRef.current = true;

        if (roomId) {
          try { subsRef.current?.unsubscribe(); } catch {}
          subsRef.current = client.subscribe(`/topic/room/${roomId}`, (frame: IMessage) => {
            try {
              const body = JSON.parse(frame.body);
              onMessageRef.current?.(body);
            } catch {}
          });
        }

        if (isReconnect) {
          onReconnectRef.current?.();
        } else {
          onConnectRef.current?.();
        }
      },
      onStompError: () => {},
      onWebSocketClose: () => {
        setConnected(false);
        if (connectedOnceRef.current) setReconnecting(true);
        onDisconnectRef.current?.();
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      try { subsRef.current?.unsubscribe(); } catch {}
      client.deactivate();
      clientRef.current = null;
      connectedOnceRef.current = false;
    };
  }, [url, roomId]);

  const send = (destination: string, payload: any) => {
    if (!clientRef.current || !connected) return;
    clientRef.current.publish({
      destination,
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
    });
  };

  return { connected, reconnecting, send };
}
