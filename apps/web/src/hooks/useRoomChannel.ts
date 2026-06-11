import { useEffect, useRef } from 'react';
import { useStomp } from './useStomp';
import { api } from '../api/client';
import type { QuestionStartData, RoomEvent } from '../types/room';

/**
 * FMR-2 — typed room channel on top of useStomp.
 *
 * One subscription to /topic/room/{roomId} delivering parsed frames as the
 * RoomEvent discriminated union (FMR-1), plus the reconnect-rehydrate that
 * fixes F-web-4: on every RE-connect (2nd+ successful connect) the hook
 * re-fetches the room's cached current question over REST and hands a 200
 * payload to `onRehydrateQuestion`. 204 / errors stay silent — the page just
 * keeps waiting for the next QUESTION_START broadcast.
 */
export interface RoomChannelOptions {
  /** Typed STOMP frame from /topic/room/{roomId}. */
  onEvent?: (event: RoomEvent) => void;
  /** First successful connect only. */
  onConnect?: () => void;
  /** 2nd+ successful connect — page-specific resync (e.g. lobby fetchRoom,
   *  quiz re-join). Runs before the built-in current-question rehydrate. */
  onReconnect?: () => void;
  /** When provided, every reconnect re-fetches
   *  GET /api/rooms/{roomId}/current-question and delivers a 200 payload
   *  here (silent on 204 / error). Fixes F-web-4. */
  onRehydrateQuestion?: (data: QuestionStartData) => void;
}

/**
 * Fetch the room's cached current question (REST fallback for missed
 * QUESTION_START frames). Resolves null on 204 / missing payload / error —
 * callers treat null as "keep waiting for the next broadcast".
 */
export async function fetchCurrentQuestion(roomId: string): Promise<QuestionStartData | null> {
  try {
    const res = await api.get(`/api/rooms/${roomId}/current-question`);
    if (res.status !== 200 || !res.data?.question) return null;
    return res.data.question as QuestionStartData;
  } catch {
    return null; // 204/error: keep waiting for QUESTION_START
  }
}

export function useRoomChannel(roomId: string | undefined, opts: RoomChannelOptions = {}) {
  // Keep handlers fresh without recreating the underlying STOMP client
  // (same ref pattern as useStomp itself).
  const optsRef = useRef(opts);
  useEffect(() => { optsRef.current = opts; }, [opts]);

  return useStomp({
    roomId,
    onMessage: (msg) => {
      if (msg && typeof msg.type === 'string') {
        optsRef.current.onEvent?.(msg as RoomEvent);
      }
    },
    onConnect: () => optsRef.current.onConnect?.(),
    onReconnect: () => {
      optsRef.current.onReconnect?.();
      // F-web-4 fix: rehydrate the in-flight question after a WS gap so the
      // player view doesn't sit on stale state until the next broadcast.
      if (optsRef.current.onRehydrateQuestion && roomId) {
        fetchCurrentQuestion(roomId).then(data => {
          if (data) optsRef.current.onRehydrateQuestion?.(data);
        });
      }
    },
  });
}
