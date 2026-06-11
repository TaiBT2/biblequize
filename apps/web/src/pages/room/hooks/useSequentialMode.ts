import { useState } from 'react';
import type { PerPlayerAnswer, RoomEvent } from '../../../types/room';

export interface SequentialModeState {
  seqAnswered: number;
  seqTotal: number;
  revealedData: { correctIndex: number; explanation?: string; answers: PerPlayerAnswer[] } | null;
}

/**
 * FMR-3 — Group Live Sequential (Feature A) mode state + event handling.
 * Owns the answered/total progress strip and the per-question reveal panel.
 * Anti-spoiler stays intact: `revealedData` only exists after the BE decides
 * the round is over (QUESTION_REVEALED) — the shared `correctIndex` is set by
 * the shell from the same event.
 */
export function useSequentialMode() {
  const [seqAnswered, setSeqAnswered] = useState(0);
  const [seqTotal, setSeqTotal] = useState(0);
  const [revealedData, setRevealedData] = useState<SequentialModeState['revealedData']>(null);

  const handleEvent = (msg: RoomEvent) => {
    switch (msg.type) {
      case 'QUESTION_START': {
        // Sequential reset
        setRevealedData(null);
        setSeqAnswered(0);
        break;
      }
      case 'SEQUENTIAL_PROGRESS': {
        setSeqAnswered(msg.data.answered);
        setSeqTotal(msg.data.total);
        break;
      }
      case 'QUESTION_REVEALED': {
        const d = msg.data;
        setRevealedData({ correctIndex: d.correctIndex, explanation: d.explanation, answers: d.answers });
        break;
      }
    }
  };

  const state: SequentialModeState = { seqAnswered, seqTotal, revealedData };
  return { state, handleEvent };
}
