import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getScheduledQuizDetail, getScheduledQuizLeaderboard,
  ScheduledQuizDetail as Detail, LeaderboardRow,
} from '../api/scheduledQuiz'

const fmtCountdown = (deadlineIso: string): string => {
  const ms = new Date(deadlineIso).getTime() - Date.now()
  if (ms <= 0) return '0'
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes} phút`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  const days = Math.floor(hours / 24)
  return `${days} ngày ${hours % 24}h`
}

const fmtTime = (s: number): string => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const ScheduledQuizDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const { id: groupId, quizId } = useParams()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<Detail | null>(null)
  const [lb, setLb] = useState<LeaderboardRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0) // re-render countdown each second

  const fetchAll = useCallback(async () => {
    if (!groupId || !quizId) return
    try {
      const [d, l] = await Promise.all([
        getScheduledQuizDetail(groupId, quizId),
        getScheduledQuizLeaderboard(groupId, quizId),
      ])
      setDetail(d)
      setLb(l)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Lỗi tải dữ liệu')
    }
  }, [groupId, quizId])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(i)
  }, [])
  // poll leaderboard every 30s
  useEffect(() => {
    const i = setInterval(fetchAll, 30000)
    return () => clearInterval(i)
  }, [fetchAll])

  if (error) return <div className="p-4 text-error">{error}</div>
  if (!detail) return <div className="p-4 text-on-surface/60">Đang tải...</div>

  const isEnded = detail.status === 'ENDED' || detail.status === 'CANCELLED'
  const winner = isEnded ? lb.find(r => r.userId === detail.winnerUserId) ?? lb[0] : null
  const canPlay = detail.status === 'ACTIVE' && detail.myStatus.attemptsRemaining > 0
  void tick

  return (
    <div className="min-h-screen bg-[#0a0b13] text-on-surface px-4 py-5 max-w-3xl mx-auto" data-testid="scheduled-quiz-detail">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="text-on-surface/60 hover:text-on-surface" aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="text-xs text-on-surface/60">{t('scheduledQuiz.backToGroup')}</span>
      </div>

      {/* Status banner */}
      {!isEnded ? (
        <div data-testid="active-banner" className="rounded-2xl p-4 mb-4 grid grid-cols-[1fr_auto] gap-3 items-center"
          style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.1) 0%, rgba(50,52,64,0.4) 60%)', border: '1px solid rgba(96,165,250,0.25)' }}>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/25 text-green-400 text-[10px] font-bold uppercase tracking-wide mb-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {t('scheduledQuiz.statusActive')}
            </div>
            <div className="text-base font-bold mb-0.5">{detail.name}</div>
            <div className="text-on-surface/60 text-xs">{detail.questionCount} câu · {lb.length} người tham gia</div>
          </div>
          <div className="text-center bg-[rgba(17,19,30,0.5)] border border-[rgba(232,168,50,0.25)] rounded-lg px-3.5 py-2.5">
            <div className="text-[9px] uppercase tracking-wider text-on-surface/60 font-bold">{t('scheduledQuiz.remaining')}</div>
            <div className="text-base font-bold text-secondary tabular-nums mt-0.5">{fmtCountdown(detail.deadline)}</div>
          </div>
        </div>
      ) : (
        <div data-testid="ended-banner" className="rounded-2xl p-5 mb-4 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(232,168,50,0.15) 0%, rgba(50,52,64,0.4) 60%)', border: '1px solid rgba(232,168,50,0.3)' }}>
          <div className="text-4xl mb-1">🎊</div>
          <h3 className="text-lg font-bold">{t('scheduledQuiz.endedBanner')}</h3>
          <p className="text-on-surface/60 text-xs mt-1">"{detail.name}" · {lb.length} người tham gia</p>
        </div>
      )}

      {/* Winner card (ended) */}
      {isEnded && winner && (
        <div data-testid="winner-card" className="rounded-2xl p-4 mb-4 grid grid-cols-[auto_1fr_auto] gap-4 items-center"
          style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(50,52,64,0.4) 60%)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <div className="relative w-14 h-14 rounded-full grid place-items-center font-bold text-xl border-[3px]"
            style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#11131e', borderColor: '#fbbf24' }}>
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xl">👑</span>
            {winner.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-secondary mb-0.5">🏆 {t('scheduledQuiz.winner')}</div>
            <div className="text-base font-bold">{winner.name}</div>
            <div className="text-on-surface/60 text-[11px]">{winner.correctCount}/{winner.totalQuestions} · {fmtTime(winner.timeSeconds)} · {winner.attemptsUsed} lần</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums" style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {winner.score}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-on-surface/60 mt-1">điểm</div>
          </div>
        </div>
      )}

      {/* My status (active) */}
      {!isEnded && (
        <div className="rounded-2xl p-4 mb-4 bg-[rgba(50,52,64,0.4)] border border-[rgba(232,168,50,0.15)]" data-testid="my-status">
          <div className="text-[10px] uppercase tracking-wider text-on-surface/60 font-bold mb-3">{t('scheduledQuiz.myStatus')}</div>
          <div className="flex items-center gap-2.5 mb-3">
            {Array.from({ length: detail.maxAttempts }).map((_, i) => {
              const used = i < detail.myStatus.attemptsUsed
              const next = i === detail.myStatus.attemptsUsed && canPlay
              return (
                <div key={i}
                  className={`w-9 h-9 rounded-lg grid place-items-center font-bold text-sm border-[1.5px] ${
                    used
                      ? 'bg-gradient-to-br from-green-400 to-green-600 text-white border-green-400'
                      : next
                        ? 'bg-secondary/15 text-secondary border-secondary border-dashed'
                        : 'bg-[rgba(50,52,64,0.4)] text-on-surface/40 border-white/5'
                  }`}>
                  {used ? '✓' : i + 1}
                </div>
              )
            })}
            <div className="flex-1 ml-2">
              <div className="text-xs font-bold">{detail.myStatus.attemptsUsed}/{detail.maxAttempts} lần</div>
              <div className="text-on-surface/60 text-[11px]">{t('scheduledQuiz.attemptsHelp')}</div>
            </div>
          </div>
          {detail.myStatus.bestScore !== null && (
            <div className="bg-[rgba(17,19,30,0.4)] rounded-lg px-3 py-2.5 flex items-center justify-between text-xs mb-3">
              <span className="text-on-surface/60">{t('scheduledQuiz.bestScore')}</span>
              <span className="font-bold text-secondary tabular-nums">
                {detail.myStatus.bestScore} điểm · {detail.myStatus.bestCorrectCount}/{detail.questionCount} · {fmtTime(detail.myStatus.bestTimeSeconds ?? 0)}
              </span>
            </div>
          )}
          <button
            onClick={() => navigate(`/groups/${groupId}/scheduled-quizzes/${quizId}/play`)}
            disabled={!canPlay}
            data-testid="play-btn"
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)', color: '#11131e', boxShadow: '0 6px 20px rgba(232,168,50,0.3)' }}
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
            {detail.myStatus.attemptsUsed === 0 ? t('scheduledQuiz.playFirst')
              : detail.myStatus.attemptsRemaining === 1 ? t('scheduledQuiz.playLast')
              : t('scheduledQuiz.playAgain')}
          </button>
        </div>
      )}

      {/* Leaderboard */}
      <div className="rounded-2xl p-4 bg-[rgba(50,52,64,0.3)] border border-[rgba(232,168,50,0.08)]" data-testid="leaderboard">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-green-400">leaderboard</span>
            {isEnded ? t('scheduledQuiz.finalResults') : t('scheduledQuiz.liveLeaderboard')}
          </div>
          <span className="text-on-surface/60 text-xs">{lb.length} người</span>
        </div>
        {lb.length === 0 ? (
          <p className="text-center text-on-surface/50 py-6 text-xs">{t('scheduledQuiz.noPlayers')}</p>
        ) : (
          <div className="space-y-1">
            {lb.map(row => (
              <div key={row.userId}
                className={`grid grid-cols-[24px_32px_1fr_auto] gap-2.5 items-center px-2 py-1.5 rounded-lg ${
                  row.isMe ? 'bg-[rgba(232,168,50,0.1)] border border-[rgba(232,168,50,0.25)]' : ''
                }`}>
                <span className={`text-center text-xs font-bold ${row.rank === 1 ? 'text-secondary text-sm' : row.rank === 2 ? 'text-on-surface/80 text-sm' : row.rank === 3 ? 'text-orange-500 text-sm' : 'text-on-surface/50'}`}>
                  {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                </span>
                <div className={`w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold ${
                  row.isMe ? 'bg-gradient-to-br from-secondary to-tertiary text-on-secondary'
                    : row.rank === 1 ? 'bg-gradient-to-br from-[#fbbf24] to-[#d97706] text-[#11131e]'
                    : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
                }`}>
                  {row.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate flex items-center gap-1.5">
                    {row.name}
                    {row.isMe && <span className="bg-secondary/20 text-secondary text-[8px] px-1 py-0.5 rounded font-bold">BẠN</span>}
                  </div>
                  <div className="text-[10px] text-on-surface/60 mt-0.5">
                    {row.correctCount}/{row.totalQuestions} · {fmtTime(row.timeSeconds)} · {row.attemptsUsed} lần
                  </div>
                </div>
                <div className="text-sm font-bold text-secondary tabular-nums">{row.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ScheduledQuizDetailPage
