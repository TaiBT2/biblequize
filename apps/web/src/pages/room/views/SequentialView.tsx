import React from 'react';
import { useTranslation } from 'react-i18next';
import { ANSWER_LETTERS, FILL_STYLE } from '../roomQuizCore';
import type { RoomQuestion } from '../../../types/room';
import type { SequentialModeState } from '../hooks/useSequentialMode';

/**
 * FMR-4 — Group Live Sequential (Feature A) mode fragments.
 * Default export renders the sequential top-bar + centered question box
 * (replaces the default question card); named exports cover the waiting
 * strip and the reveal panel. Mode gating stays with the shell so render
 * conditions match the pre-split page 1:1.
 */
const SequentialView: React.FC<{
  questionIndex: number;
  totalQuestions: number;
  playingCount: number;
  timerPercent: number;
  timeLeft: number;
  question: RoomQuestion | null;
}> = ({ questionIndex, totalQuestions, playingCount, timerPercent, timeLeft, question }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[1px]" style={{ color: '#a78bfa' }}>
            CÂU {questionIndex + 1} / {totalQuestions || '?'}
          </div>
          <div className="text-[12px] text-on-surface/85 font-semibold mt-0.5">
            {playingCount > 0
              ? `${playingCount}/${playingCount} đang chơi`
              : t('room.quiz.waitingQuestion')}
          </div>
        </div>
        <div className="relative w-[38px] h-[38px] flex-shrink-0">
          <svg viewBox="0 0 38 38" className="w-full h-full -rotate-90">
            <circle cx="19" cy="19" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <circle cx="19" cy="19" r="16" fill="none" stroke="#e8a832" strokeWidth="4" strokeLinecap="round"
              strokeDasharray="113" strokeDashoffset={113 * (1 - timerPercent / 100)} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-[12px] font-extrabold tabular-nums" style={{ color: '#e8a832' }}>
            {timeLeft}
          </div>
        </div>
      </div>
      {/* Purple progress bar */}
      <div className="h-1 rounded-full overflow-hidden mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{
          width: `${totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0}%`,
          background: 'linear-gradient(90deg, #a78bfa 0%, #c084fc 100%)',
        }} />
      </div>
      {/* Question box centered (mockup style) */}
      <div className="rounded-xl px-4 py-5 mb-4 text-center"
        style={{ background: 'rgba(17,19,30,0.5)', border: '1px solid rgba(232,168,50,0.1)' }}>
        <div className="text-[16px] md:text-[18px] font-semibold leading-snug">
          {question?.content || t('room.quiz.waitingQuestion')}
        </div>
      </div>
    </>
  );
};

/** Waiting strip — shown after the player submits, before the reveal. */
export const SequentialWaitingStrip: React.FC<{ seq: SequentialModeState }> = ({ seq }) => {
  const { t } = useTranslation();
  return (
    <div
      data-testid="sequential-waiting-strip"
      className="rounded-xl px-4 py-3.5 flex items-center gap-3"
      style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.1) 0%, rgba(50,52,64,0.4) 60%)',
        border: '1px solid rgba(167,139,250,0.25)',
      }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
      >
        <span className="material-symbols-outlined text-[18px] animate-pulse" style={{ color: '#a78bfa' }}>
          hourglass_empty
        </span>
      </div>
      <div className="flex-1 text-on-surface text-[12px] font-medium leading-snug">
        <strong style={{ color: '#c4b5fd' }}>
          {t('room.quiz.sequentialWaiting', { remaining: Math.max(0, seq.seqTotal - seq.seqAnswered) })}
        </strong>
        {' '}{t('room.quiz.sequentialWaitingDesc')}
        <div className="flex gap-1 mt-1.5">
          {Array.from({ length: seq.seqTotal }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i < seq.seqAnswered
                  ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                  : 'rgba(167,139,250,0.3)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/** Reveal panel — correct answer, explanation, per-player answers and the
 *  leader advance button (or member waiting hint). */
export const SequentialRevealPanel: React.FC<{
  revealedData: NonNullable<SequentialModeState['revealedData']>;
  isHost: boolean;
  onAdvance: () => void;
}> = ({ revealedData, isHost, onAdvance }) => {
  const { t } = useTranslation();
  return (
    <div
      data-testid="sequential-reveal-panel"
      className="rounded-xl p-4 space-y-3"
      style={{
        background: 'rgba(50,52,64,0.6)',
        border: '1px solid rgba(232,168,50,0.25)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-secondary" style={FILL_STYLE}>
          check_circle
        </span>
        <span className="text-on-surface font-bold text-[14px]">
          {t('room.quiz.sequentialAnswerIs', { letter: ANSWER_LETTERS[revealedData.correctIndex] })}
        </span>
      </div>
      {revealedData.explanation && (
        <p className="text-on-surface-variant text-[12px] leading-relaxed">
          {revealedData.explanation}
        </p>
      )}
      {/* Per-player answers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5">
        {revealedData.answers.map(a => (
          <div
            key={a.userId}
            className={`px-2 py-1.5 rounded-md text-[11px] flex items-center justify-between gap-1 ${
              a.isCorrect
                ? 'bg-green-500/10 border border-green-500/20'
                : a.answerIndex === null
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-error/10 border border-error/20'
            }`}
          >
            <span className="truncate text-on-surface/90 font-medium">{a.username}</span>
            <span className={`flex-shrink-0 font-bold ${a.isCorrect ? 'text-green-400' : a.answerIndex === null ? 'text-on-surface/40' : 'text-error'}`}>
              {a.answerIndex === null ? '—' : ANSWER_LETTERS[a.answerIndex]}
            </span>
          </div>
        ))}
      </div>
      {/* Leader advance button or member waiting hint.
          The reveal panel only renders after BE has decided the round
          is over (all-answered OR question timeout), so the host can
          always advance from here — no need to gate on seqAnswered. */}
      <div className="pt-2 border-t border-white/5">
        {isHost ? (
          <button
            data-testid="sequential-advance-btn"
            onClick={onAdvance}
            className="w-full py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)',
              color: '#11131e',
              boxShadow: '0 6px 20px rgba(232,168,50,0.3)',
            }}
          >
            {t('room.quiz.sequentialAdvance')}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        ) : (
          <div className="text-center text-on-surface-variant text-[12px] py-2 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[14px] animate-pulse">hourglass_empty</span>
            {t('room.quiz.sequentialWaitingForLeader')}
          </div>
        )}
      </div>
    </div>
  );
};

export default SequentialView;
