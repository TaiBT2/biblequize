import React from 'react';
import { useTranslation } from 'react-i18next';
import { MatchResultOverlay, SdArenaHeader } from '../RoomOverlays';
import type { SuddenDeathState } from '../hooks/useSuddenDeath';

/**
 * FMR-4 — Sudden Death (Đấu vương) mode fragments.
 * Default export renders the champion-vs-challenger arena header; named
 * exports cover the spectating badge and the match-result overlay. Mode
 * gating stays with the shell so render conditions match the pre-split
 * page 1:1.
 */
const SuddenDeathView: React.FC<{ sd: SuddenDeathState; myUsername: string }> = ({ sd, myUsername }) => (
  <SdArenaHeader
    championName={sd.sdChampionName}
    championStreak={sd.sdChampionStreak}
    challengerName={sd.sdChallengerName}
    myUsername={myUsername}
    queueRemaining={sd.sdQueueRemaining}
  />
);

/** Header pill shown while the viewer waits outside the hot seat. */
export const SdSpectatingBadge: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="hidden sm:flex items-center gap-1 bg-[#ff8c42]/10 px-2.5 py-1 rounded-full border border-[#ff8c42]/20">
      <span className="material-symbols-outlined text-[#ff8c42] text-sm">visibility</span>
      <span className="text-[#ff8c42] text-[10px] font-bold">{t('room.quiz.sdSpectating')}</span>
    </div>
  );
};

/** Full-screen match-result overlay (winner/loser of the last duel). */
export const SdMatchResultOverlay: React.FC<{
  result: NonNullable<SuddenDeathState['sdMatchResult']>;
  myUserId: string;
  onDismiss: () => void;
}> = ({ result, myUserId, onDismiss }) => (
  <MatchResultOverlay
    winnerId={result.winnerId}
    winnerName={result.winnerName}
    loserId={result.loserId}
    loserName={result.loserName}
    myUserId={myUserId}
    onDismiss={onDismiss}
  />
);

export default SuddenDeathView;
