import { useEffect, useRef, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getApiBaseUrl } from '../api/config';

export interface StompOptions {
  url?: string; // default /ws
  roomId?: string;
  onMessage?: (msg: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useStomp({ url = '/ws', roomId, onMessage, onConnect, onDisconnect }: StompOptions) {
  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // SockJS expects http(s) URL, not ws(s)
    const apiBase = getApiBaseUrl();
    let sockUrl: string;
    if (apiBase.startsWith('http')) {
      // Absolute API base
      try {
        const u = new URL(apiBase);
        u.pathname = url;
        u.search = '';
        u.hash = '';
        sockUrl = u.toString();
      } catch {
        sockUrl = url;
      }
    } else {
      // Relative API base, use same-origin
      const httpProto = window.location.protocol === 'https:' ? 'https' : 'http';
      sockUrl = `${httpProto}//${window.location.host}${url}`;
    }
    const socketFactory = () => new SockJS(sockUrl);
    const client = new Client({
      webSocketFactory: socketFactory as any,
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        onConnect && onConnect();
        if (roomId) {
          subsRef.current = client.subscribe(`/topic/room/${roomId}`, (frame: IMessage) => {
            try {
              const body = JSON.parse(frame.body);
              onMessage && onMessage(body);
            } catch {
              // noop
            }
          });
        }
      },
      onStompError: () => {},
      onWebSocketClose: () => {
        setConnected(false);
        onDisconnect && onDisconnect();
      },
    });
    clientRef.current = client;
    client.activate();
    return () => {
      try { subsRef.current?.unsubscribe(); } catch {}
      client.deactivate();
      clientRef.current = null;
    };
  }, [url, roomId]);

  const send = (destination: string, payload: any) => {
    if (!clientRef.current || !connected) return;
    clientRef.current.publish({ destination, body: JSON.stringify(payload) });
  };

  return { connected, send };
}


