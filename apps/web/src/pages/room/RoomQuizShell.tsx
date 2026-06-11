import React from 'react';
import { useTranslation } from 'react-i18next';
import ExplanationPanel from '../../components/multiplayer/ExplanationPanel';
import ComboBanner from '../../components/multiplayer/ComboBanner';
import RevealStatsCard from '../../components/multiplayer/RevealStatsCard';
import ReactionBar from '../../components/ReactionBar';
import { AnswerButton, type AnswerState } from '../../components/quiz/AnswerButton';
import { RoundScoreboard } from './RoomOverlays';
import { ANSWER_LETTERS, FILL_STYLE, type CoreGameState } from './roomQuizCore';
import type { ReactionData } from '../../types/room';
import type { BattleRoyaleState } from './hooks/useBattleRoyale';
import type { TeamVsTeamState } from './hooks/useTeamVsTeam';
import type { SuddenDeathState } from './hooks/useSuddenDeath';
import type { SequentialModeState } from './hooks/useSequentialMode';
import BattleRoyaleView, { BattleRoyaleHeaderBadge, SpectatorBadge } from './views/BattleRoyaleView';
import TeamVsTeamView, { PerfectRoundBanner, TeamHeaderBadge } from './views/TeamVsTeamView';
import SuddenDeathView, { SdMatchResultOverlay, SdSpectatingBadge } from './views/SuddenDeathView';
import SequentialView, { SequentialRevealPanel, SequentialWaitingStrip } from './views/SequentialView';

// Sprint 2 Q1 — persistent live-feed sidebar entry. Each entry is one row
// rendered in the RIGHT column; the page keeps the last 30 events so the
// history scrolls without unbounded growth.
export type FeedEntry = {
  id: number;
  kind: 'answer' | 'round_end';
  text: string;
  tone: 'ok' | 'fail' | 'neutral';
};

export interface RoomQuizShellProps {
  gameMode: string;
  isBattleRoyale: boolean;
  isTeamVsTeam: boolean;
  isSuddenDeath: boolean;
  isSequential: boolean;
  isHost: boolean;
  myUserId: string;
  myUsername: string;
  groupQuizSetName?: string | null;
  /** Quan Tro mode → show "đang theo dõi" hint (Sprint 4 S4-9). */
  showHostHint: boolean;
  hostNameFromState?: string;
  // connection
  connected: boolean;
  reconnecting: boolean;
  // core game state (FMR-4 reducer) + server-anchored timer
  core: CoreGameState;
  timeLeft: number;
  // Sprint 4 (S4-9) host control echoes
  isPaused: boolean;
  skipToast: boolean;
  hostBroadcast: { hostName: string; message: string } | null;
  // social
  reactions: ReactionData[];
  feedHistory: FeedEntry[];
  /** C3 — playerIds that submitted this round (cleared on QUESTION_START). */
  roundAnswered: Set<string>;
  comboBanner: { count: number; multiplier: number } | null;
  onDismissCombo: () => void;
  revealStats: { reactionMs: number; pointsEarned: number; newRank: number; rankDelta: number } | null;
  // per-mode state (FMR-3 hooks)
  br: BattleRoyaleState;
  team: TeamVsTeamState;
  sd: SuddenDeathState;
  seq: SequentialModeState;
  onDismissSdResult: () => void;
  // actions
  onSubmitAnswer: (idx: number) => void;
  onAdvance: () => void;
  onSendReaction: (emoji: string) => void;
}

/**
 * FMR-4 — shared chrome of the multiplayer quiz page: header bar + timer
 * ring, answer grid, scoreboards, live feed and the host-echo overlays.
 * Mode-specific fragments come from src/pages/room/views/ and render at the
 * exact positions (and under the exact conditions) of the pre-split
 * RoomQuiz.tsx — DOM output and CSS classes are unchanged.
 */
const RoomQuizShell: React.FC<RoomQuizShellProps> = ({
  gameMode, isBattleRoyale, isTeamVsTeam, isSuddenDeath, isSequential, isHost,
  myUserId, myUsername, groupQuizSetName, showHostHint, hostNameFromState,
  connected, reconnecting, core, timeLeft,
  isPaused, skipToast, hostBroadcast,
  reactions, feedHistory, roundAnswered, comboBanner, onDismissCombo, revealStats,
  br, team, sd, seq, onDismissSdResult,
  onSubmitAnswer, onAdvance, onSendReaction,
}) => {
  const { t } = useTranslation();
  const { questionIndex, totalQuestions, timeLimit, question, scores, selected, correctIndex } = core;

  const timerPercent = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0;

  // Map core state → AnswerButton state (per-position color via component).
  // Preserves the prior visual semantics (correct=green, wrong=red, selected
  // pre-reveal, faded for cannot-interact) but adds the 4-position colour
  // mapping (Coral/Sky/Gold/Sage) shared with single-player Quiz.
  const buildAnswerState = (i: number): AnswerState => {
    if (correctIndex !== null) {
      if (i === correctIndex) return 'correct';
      if (i === selected) return 'wrong';
      return 'disabled';
    }
    if (selected === i) return 'selected';
    if ((br.isEliminated && !br.isSpectator) || (isSuddenDeath && sd.sdSpectating)) return 'disabled';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface overflow-hidden relative">
      {/* Sprint 4 (S4-9): Quan Tro pause overlay */}
      {isPaused && (
        <div
          data-testid="player-pause-overlay"
          className="fixed inset-0 z-50 grid place-items-center backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div className="text-center px-6">
            <div className="text-5xl mb-3">⏸️</div>
            <div className="font-bold text-2xl text-white mb-1">Trận đấu đã tạm dừng</div>
            <div className="text-sm text-gray-400">Quản trò sẽ tiếp tục trong giây lát</div>
          </div>
        </div>
      )}
      {/* Sprint 4 (S4-9): host broadcast banner */}
      {hostBroadcast && (
        <div
          data-testid="player-host-broadcast"
          className="fixed top-16 left-4 right-4 z-40"
        >
          <div
            className="rounded-xl p-3 flex items-start gap-2 max-w-md mx-auto"
            style={{ background: 'rgba(232,168,50,0.15)', border: '1px solid rgba(232,168,50,0.4)', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-base flex-shrink-0">👑</span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase" style={{ color: '#e8a832' }}>
                {hostBroadcast.hostName}
              </div>
              <div className="text-sm text-white">{hostBroadcast.message}</div>
            </div>
          </div>
        </div>
      )}
      {/* Sprint 4 (S4-9): question-skipped toast */}
      {skipToast && (
        <div
          data-testid="player-skip-toast"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg text-sm"
          style={{ background: 'rgba(232,168,50,0.95)', color: '#11131e' }}
        >
          ⏭️ Câu này đã được Quản trò bỏ qua
        </div>
      )}
      {/* Sprint 4 (S4-9): "Quản trò đang theo dõi" pinned hint */}
      {showHostHint && hostNameFromState && (
        <div
          data-testid="player-host-hint"
          className="fixed bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div
            className="rounded-full px-3 py-1 flex items-center gap-1.5 text-[10px]"
            style={{ background: 'rgba(50,52,64,0.6)', backdropFilter: 'blur(8px)', color: '#9ca3af' }}
          >
            <span>👑</span>
            <span>Quản trò {hostNameFromState} đang theo dõi</span>
          </div>
        </div>
      )}
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#9b59b6]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[120px] rounded-full" />
      </div>

      {/* Social Fun: Reactions only — the floating LiveFeed toaster is
          retired now that the RIGHT-column "LIVE FEED" sidebar (Q1) shows
          the same events persistently with no 3s auto-dismiss. */}
      <ReactionBar
        onSend={onSendReaction}
        incoming={reactions.length > 0 ? reactions : null}
      />

      {/* C3: Mobile waiting overlay — fixed-bottom card when the player
          has submitted but the round hasn't resolved yet. Lists who's
          still choosing. Hidden on lg+ (desktop has the live-feed
          sidebar). */}
      {!isSequential && selected !== null && correctIndex === null && scores.length > 1 && (() => {
        const pending = scores
          .filter(s => s.playerId !== myUserId && !roundAnswered.has(s.playerId))
          .slice(0, 5);
        if (pending.length === 0) return null;
        return (
          <div
            data-testid="quiz-mobile-waiting"
            className="lg:hidden fixed left-0 right-0 bottom-0 px-4 pb-4 z-40"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{
                background: 'rgba(50,52,64,0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.4)',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex-shrink-0"
                style={{
                  border: '2px solid #e8a832',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.9s linear infinite',
                }}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  Đang chờ {pending.length} người nữa...
                </div>
                <div className="text-xs truncate" style={{ color: '#9ca3af' }}>
                  {pending.map(p => p.username).join(', ')} đang chọn
                </div>
              </div>
              <div className="flex items-center flex-shrink-0">
                {pending.map((p, i) => (
                  <div
                    key={p.playerId}
                    className="grid place-items-center rounded-full text-[10px] font-bold flex-shrink-0"
                    style={{
                      width: 24, height: 24,
                      marginLeft: i === 0 ? 0 : -4,
                      background: i % 2 === 0
                        ? 'linear-gradient(135deg, #4ade80 0%, #047857 100%)'
                        : 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
                      color: '#fff',
                      border: '2px solid #11131e',
                      zIndex: pending.length - i,
                    }}
                  >
                    {(p.username?.[0] ?? '?').toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reconnecting banner */}
      {reconnecting && (
        <div className="fixed top-0 inset-x-0 z-50 px-4 py-2.5 bg-secondary-container/90 border-b border-secondary/30 text-on-surface text-sm text-center animate-pulse flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-secondary text-sm animate-spin">sync</span>
          {t('room.reconnecting')}
        </div>
      )}

      {/* Sprint 2 S2-7: combo streak banner */}
      {comboBanner && (
        <ComboBanner
          count={comboBanner.count}
          multiplier={comboBanner.multiplier}
          onDismiss={onDismissCombo}
        />
      )}

      {/* Elimination toasts (Battle Royale) */}
      {isBattleRoyale && <BattleRoyaleView toasts={br.toasts} />}

      {/* Match result overlay (Sudden Death) */}
      {isSuddenDeath && sd.sdMatchResult && (
        <SdMatchResultOverlay
          result={sd.sdMatchResult}
          myUserId={sd.sdMyUserId}
          onDismiss={onDismissSdResult}
        />
      )}

      {/* ═══════════ HEADER BAR (Q2: mockup state ③/④) ═══════════ */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-low/90 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          {/* Left: mode chip + "Câu N/M" + progress bar */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]' : 'bg-error shadow-[0_0_6px_rgba(255,180,171,0.4)]'}`} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.1em] flex-shrink-0"
              style={{ color: '#9b59b6' }}
            >
              {gameMode.replace(/_/g, ' ')}
            </span>
            {groupQuizSetName && (
              <span
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 max-w-[160px] truncate"
                style={{
                  color: '#e8a832',
                  background: 'rgba(232, 168, 50, 0.1)',
                  border: '1px solid rgba(232, 168, 50, 0.3)',
                }}
                data-testid="quiz-header-quizset"
                title={groupQuizSetName}
              >
                <span className="material-symbols-outlined text-[12px]">menu_book</span>
                <span className="truncate">{groupQuizSetName}</span>
              </span>
            )}
            <div className="hidden sm:block h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-sm font-bold text-on-surface flex-shrink-0">
              {t('room.quiz.questionProgress', { current: questionIndex + 1, total: totalQuestions || '?' })}
            </span>
            {totalQuestions > 0 && (
              <div
                className="hidden sm:block w-32 lg:w-48 h-1.5 rounded-full overflow-hidden flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                aria-label="Tiến độ câu hỏi"
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
                    background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Right: status pill (after reveal) + per-mode badges + timer ring */}
          <div className="flex items-center gap-3">
            {/* Reveal pill — green ✓ ĐÚNG! / red ✗ SAI */}
            {correctIndex !== null && selected !== null && (
              <div
                data-testid="quiz-reveal-pill"
                className="px-3 lg:px-4 py-1.5 rounded-full font-extrabold text-white text-xs lg:text-sm"
                style={{
                  background: selected === correctIndex
                    ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  boxShadow: selected === correctIndex
                    ? '0 0 24px rgba(74,222,128,0.4)'
                    : '0 0 24px rgba(239,68,68,0.4)',
                }}
              >
                {selected === correctIndex ? '✓ ĐÚNG!' : '✗ SAI'}
              </div>
            )}

            {isBattleRoyale && br.activeCount > 0 && (
              <BattleRoyaleHeaderBadge activeCount={br.activeCount} totalCount={br.totalCount} />
            )}
            {br.isSpectator && <SpectatorBadge />}
            {isSuddenDeath && sd.sdSpectating && <SdSpectatingBadge />}
            {isTeamVsTeam && team.myTeam && <TeamHeaderBadge myTeam={team.myTeam} />}

            {/* Timer ring — bigger to match mockup w-12 h-12 */}
            <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
              <svg className="timer-svg w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24" cy="24" r="20"
                  fill="none" strokeWidth="4"
                  stroke="rgba(255,255,255,0.08)"
                />
                <circle
                  cx="24" cy="24" r="20"
                  fill="none" strokeWidth="4"
                  strokeLinecap="round"
                  stroke={timeLeft <= 5 ? '#ef4444' : '#e8a832'}
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (timerPercent / 100) * 125.6}
                  style={{ transition: 'stroke-dashoffset 250ms linear' }}
                />
              </svg>
              <span
                className={`absolute font-bold text-base ${timeLeft <= 5 ? 'animate-pulse' : ''}`}
                style={{ color: timeLeft <= 5 ? '#ef4444' : '#fff' }}
              >
                {Math.ceil(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Timer progress bar (mobile only) */}
        <div className="h-1 bg-surface-container-highest md:hidden">
          <div
            className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-error' : 'bg-gradient-to-r from-secondary to-tertiary'}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      </header>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      {/* Q1: 3-col gameplay layout per MOCKUP_DESKTOP_MULTIPLAYER state ③/④:
           LEFT 280px scoreboard · CENTER 1fr question+stats · RIGHT 320px live feed.
           Drops max-w-6xl so all three columns can fit on lg+ viewports;
           mobile (< lg) collapses to a single column with the side panels
           hidden (player list still rendered above question via mode bars). */}
      <main className="relative min-h-screen pt-20 pb-8 px-4 lg:px-6">
        {/* Mode-specific headers */}
        {isTeamVsTeam && <TeamVsTeamView team={team} />}
        {isSuddenDeath && sd.sdChampionName && (
          <SuddenDeathView sd={sd} myUsername={myUsername} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-5">
          {/* ── LEFT: Scoreboard (lg only — same content as the trailing
                mobile block; on lg+ it's a sticky sidebar) ── */}
          <aside
            className="hidden lg:block self-start lg:sticky lg:top-20 bg-surface-container rounded-2xl border border-outline-variant/10 p-4"
            data-testid="quiz-scoreboard-left"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#9b59b6] text-sm" style={FILL_STYLE}>
                {isBattleRoyale ? 'swords' :
                 isTeamVsTeam ? 'groups' :
                 isSuddenDeath ? 'local_fire_department' :
                 'leaderboard'}
              </span>
              {isBattleRoyale ? t('room.quiz.leaderboardBattleRoyale') :
               isTeamVsTeam ? t('room.quiz.leaderboardTeam') :
               isSuddenDeath ? t('room.quiz.leaderboardSuddenDeath') :
               t('room.quiz.leaderboardDefault')}
            </div>
            <div className="space-y-1.5 max-h-[60vh] overflow-auto pr-1">
              {scores.length === 0 ? (
                <p className="text-on-surface-variant/50 text-xs text-center py-6">{t('room.quiz.noScoresYet')}</p>
              ) : (
                scores.map((s, idx) => {
                  const isMe = s.playerId === myUserId;
                  const eliminated = s.playerStatus === 'ELIMINATED';
                  return (
                    <div
                      key={s.playerId}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                        isMe ? 'border-secondary/30 bg-secondary/5' :
                        eliminated ? 'border-transparent bg-surface-container-low opacity-40' :
                        idx === 0 ? 'border-secondary/15 bg-surface-container-low' :
                        'border-outline-variant/5 bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                          eliminated ? 'bg-surface-container-highest text-on-surface-variant' :
                          idx === 0 ? 'bg-secondary/15 text-secondary border border-secondary/20' :
                          'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          {eliminated ? (
                            <span className="material-symbols-outlined text-xs" style={FILL_STYLE}>skull</span>
                          ) : isSuddenDeath ? (
                            <span className="material-symbols-outlined text-xs text-[#ff8c42]" style={FILL_STYLE}>local_fire_department</span>
                          ) : idx + 1}
                        </div>
                        <div className={`text-sm font-medium truncate ${
                          isMe ? 'text-secondary' : eliminated ? 'text-on-surface-variant' : 'text-on-surface'
                        }`}>
                          {s.username}{isMe ? t('room.quiz.youSuffix') : ''}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-sm font-black ${eliminated ? 'text-on-surface-variant' : 'text-on-surface'}`}>{s.score}</div>
                        <div className="text-on-surface-variant/50 text-[10px] font-bold">{s.correctAnswers}/{s.totalAnswered}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── Question + Answers area ── */}
          <div className="space-y-6">
            {/* C3: Mobile-only scoreboard chip strip — horizontal scroll
                bar of player score pills with ✓ (answered) or pulse
                (still choosing) indicator. Hidden on lg+ where the
                LEFT scoreboard sidebar covers the same info. */}
            {!isSequential && scores.length > 0 && (
              <div className="lg:hidden -mx-4 px-4 pb-1 overflow-x-auto" data-testid="quiz-mobile-chip-strip">
                <div className="flex items-center gap-2 w-max">
                  {scores.map((s, idx) => {
                    const isMe = s.playerId === myUserId;
                    const answered = roundAnswered.has(s.playerId);
                    const initial = (s.username?.[0] ?? '?').toUpperCase();
                    return (
                      <div
                        key={s.playerId}
                        className="rounded-full px-2.5 py-1.5 flex items-center gap-1.5 flex-shrink-0"
                        style={{
                          background: 'rgba(50,52,64,0.55)',
                          backdropFilter: 'blur(12px)',
                          border: isMe ? '1.5px solid rgba(232,168,50,0.5)' : '1px solid rgba(255,255,255,0.06)',
                          opacity: !answered && !isMe ? 0.7 : 1,
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold"
                          style={{
                            background: isMe
                              ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                              : idx === 0
                              ? 'linear-gradient(135deg, #4ade80 0%, #047857 100%)'
                              : 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
                            color: isMe ? '#11131e' : '#fff',
                          }}
                        >
                          {initial}
                        </div>
                        <span className="text-xs font-semibold text-white tabular-nums">{s.score}</span>
                        {answered ? (
                          <span className="text-[10px]" style={{ color: '#4ade80' }}>✓</span>
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ background: '#fbbf24' }}
                            aria-label="Đang chọn"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sequential mode top-bar (mockup feature_A tab 2) */}
            {isSequential ? (
              <SequentialView
                questionIndex={questionIndex}
                totalQuestions={totalQuestions}
                playingCount={scores.length}
                timerPercent={timerPercent}
                timeLeft={timeLeft}
                question={question}
              />
            ) : (
              <>
                {/* Mobile round counter (non-sequential modes) */}
                <div className="flex items-center justify-between md:hidden">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm" style={FILL_STYLE}>quiz</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
                      {t('room.quiz.questionProgress', { current: questionIndex + 1, total: totalQuestions || '?' })}
                    </span>
                  </div>
                  {scores.length > 0 && (
                    <div className="text-[10px] font-bold text-on-surface-variant">
                      {t('room.quiz.points', { count: scores.find(s => s.playerId === myUserId)?.score ?? 0 })}
                    </div>
                  )}
                </div>

                {/* Question Card (Stitch design — non-sequential modes) */}
                <div className="relative w-full flex flex-col items-center justify-center text-center p-8 md:p-10 bg-surface-container-low rounded-[2rem] border border-outline-variant/10 shadow-2xl overflow-hidden min-h-[140px]">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-24 bg-secondary rounded-r-full" />
                  <h2 className="font-headline text-xl md:text-3xl font-extrabold tracking-tight leading-snug max-w-3xl text-on-surface">
                    {question?.content || t('room.quiz.waitingQuestion')}
                  </h2>
                </div>
              </>
            )}

            {/* Answer Grid — 2x2. AnswerButton handles per-position colour
                (A=Coral, B=Sky, C=Gold, D=Sage) + state visuals + icons. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(question?.options ?? []).map((opt, i) => (
                <AnswerButton
                  key={i}
                  index={i as 0 | 1 | 2 | 3}
                  letter={ANSWER_LETTERS[i] as 'A' | 'B' | 'C' | 'D'}
                  text={opt}
                  state={buildAnswerState(i)}
                  onClick={() => onSubmitAnswer(i)}
                  testId={`room-quiz-answer-${i}`}
                  pickedByUser={selected === i}
                />
              ))}
            </div>

            {/* Feedback */}
            {selected !== null && correctIndex === null && !br.isSpectator && !(isSuddenDeath && sd.sdSpectating) && !isSequential && (
              <div className="text-center text-on-surface-variant text-sm animate-pulse flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">hourglass_empty</span>
                {t('room.quiz.waitingResult')}
              </div>
            )}

            {/* Q3: reveal stats card — shown after the round resolves
                if the player submitted (no card for skipped rounds or
                spectators). Sequential mode has its own reveal flow,
                so we suppress there. */}
            {revealStats && correctIndex !== null && !isSequential && (
              <RevealStatsCard
                reactionMs={revealStats.reactionMs}
                pointsEarned={revealStats.pointsEarned}
                newRank={revealStats.newRank}
                rankDelta={revealStats.rankDelta}
                timeLimitSec={timeLimit}
              />
            )}

            {/* Sprint 2 S2-6: explanation panel after a wrong answer. Only
                renders when (a) the round is revealed (correctIndex set),
                (b) the player picked an answer different from the correct
                one, and (c) the question carries an explanation. The panel
                doesn't gate the next question — server timing does. */}
            {correctIndex !== null && selected !== null && selected !== correctIndex
              && question?.explanation && question?.id && !isSequential && (
              <ExplanationPanel
                questionId={question.id}
                explanation={question.explanation}
                onContinue={() => { /* next QUESTION_START will replace */ }}
              />
            )}

            {/* ─── Sequential Mode: Waiting Strip (after submit, before reveal) ─── */}
            {isSequential && selected !== null && !seq.revealedData && (
              <SequentialWaitingStrip seq={seq} />
            )}

            {/* ─── Sequential Mode: Reveal Panel + Leader Advance ─── */}
            {isSequential && seq.revealedData && (
              <SequentialRevealPanel
                revealedData={seq.revealedData}
                isHost={isHost}
                onAdvance={onAdvance}
              />
            )}

            {/* Inline reveal does this work now (mockup state ②/③/④):
                - AnswerButton renders the correct/wrong state with the
                  badge text ("✓ ĐÚNG · BẠN CHỌN" / "✗ BẠN CHỌN" /
                  "✓ ĐÁP ÁN") right on the option.
                - RevealStatsCard (Q3) covers reaction time, speed,
                  points, rank delta.
                - ExplanationPanel (S2-6) covers the wrong-answer
                  explanation.
                The earlier full-screen popup overlay was redundant with
                the inline reveal and was the "old design" the user
                wanted retired. */}
            {/* Spectator feedback */}
            {correctIndex !== null && (br.isSpectator || (isSuddenDeath && sd.sdSpectating)) && (
              <div className="text-center text-sm">
                <span className="text-[#4a9eff] flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  {t('room.quiz.spectatorNote')}
                </span>
              </div>
            )}

            {/* Perfect round banner */}
            {isTeamVsTeam && (team.perfectA || team.perfectB) && (
              <PerfectRoundBanner perfectA={team.perfectA} perfectB={team.perfectB} myTeam={team.myTeam} />
            )}

            {/* Scoreboard overlay after round */}
            {correctIndex !== null && (
              <RoundScoreboard scores={scores} myUsername={myUsername} />
            )}
          </div>

          {/* ── RIGHT (lg+): Live feed sidebar matching mockup state ③/④ ── */}
          <aside
            className="hidden lg:flex flex-col self-start lg:sticky lg:top-20 bg-surface-container rounded-2xl border border-outline-variant/10 overflow-hidden"
            data-testid="quiz-live-feed"
            style={{ maxHeight: 'calc(100vh - 6rem)' }}
          >
            <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center gap-2">
              <span className="text-sm" aria-hidden="true">📢</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Live feed
              </span>
            </div>
            <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">
              {feedHistory.length === 0 ? (
                <p className="text-on-surface-variant/50 text-xs italic text-center py-4">
                  Đang chờ hoạt động đầu tiên...
                </p>
              ) : (
                feedHistory.map(e => (
                  <div
                    key={e.id}
                    className="text-xs"
                    style={{
                      color:
                        e.tone === 'ok' ? 'rgba(74,222,128,0.85)' :
                        e.tone === 'fail' ? 'rgba(248,113,113,0.85)' :
                        'rgba(156,163,175,0.7)',
                      fontStyle: e.kind === 'round_end' ? 'italic' : 'normal',
                    }}
                  >
                    {e.text}
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* ── Leaderboard / Side Panel (mobile only — desktop uses LEFT) ── */}
          <div className="lg:hidden bg-surface-container rounded-2xl border border-outline-variant/10 p-4 self-start">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#9b59b6] text-sm" style={FILL_STYLE}>
                {isBattleRoyale ? 'swords' :
                 isTeamVsTeam ? 'groups' :
                 isSuddenDeath ? 'local_fire_department' :
                 'leaderboard'}
              </span>
              {isBattleRoyale ? t('room.quiz.leaderboardBattleRoyale') :
               isTeamVsTeam ? t('room.quiz.leaderboardTeam') :
               isSuddenDeath ? t('room.quiz.leaderboardSuddenDeath') :
               t('room.quiz.leaderboardDefault')}
            </div>
            <div className="space-y-1.5 max-h-[55vh] overflow-auto pr-1">
              {scores.length === 0 ? (
                <p className="text-on-surface-variant/50 text-xs text-center py-6">{t('room.quiz.noScoresYet')}</p>
              ) : (
                scores.map((s, idx) => {
                  const isMe = s.playerId === myUserId;
                  const eliminated = s.playerStatus === 'ELIMINATED';
                  return (
                    <div
                      key={s.playerId}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                        isMe ? 'border-secondary/30 bg-secondary/5' :
                        eliminated ? 'border-transparent bg-surface-container-low opacity-40' :
                        idx === 0 ? 'border-secondary/15 bg-surface-container-low' :
                        'border-outline-variant/5 bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                          eliminated ? 'bg-surface-container-highest text-on-surface-variant' :
                          idx === 0 ? 'bg-secondary/15 text-secondary border border-secondary/20' :
                          'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          {eliminated ? (
                            <span className="material-symbols-outlined text-xs" style={FILL_STYLE}>skull</span>
                          ) : isSuddenDeath ? (
                            <span className="material-symbols-outlined text-xs text-[#ff8c42]" style={FILL_STYLE}>local_fire_department</span>
                          ) : idx + 1}
                        </div>
                        <div className={`text-sm font-medium truncate max-w-[80px] ${
                          isMe ? 'text-secondary' : eliminated ? 'text-on-surface-variant' : 'text-on-surface'
                        }`}>
                          {s.username}{isMe ? t('room.quiz.youSuffix') : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-black ${eliminated ? 'text-on-surface-variant' : 'text-on-surface'}`}>{s.score}</div>
                        <div className="text-on-surface-variant/50 text-[10px] font-bold">{s.correctAnswers}/{s.totalAnswered}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoomQuizShell;
