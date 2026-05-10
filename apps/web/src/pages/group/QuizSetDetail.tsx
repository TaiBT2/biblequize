import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  archiveQuizSet, cloneQuizSet, createLiveRoomFromQuizSet, deleteQuizSet,
  getMyMastery, getQuizSet, getModeAvailability, MODE_LABELS,
  publishQuizSet, startSoloPractice, type QuizSet, type QuizSetMastery,
  type RoomMode, unarchiveQuizSet,
} from '../../api/quizSets'

const STATUS_BADGE: Record<string, { vi: string; cls: string }> = {
  DRAFT:        { vi: 'Bản nháp',     cls: 'qs-badge-draft' },
  PUBLISHED:    { vi: '✓ Đã xuất bản', cls: 'qs-badge-published' },
  ARCHIVED:     { vi: 'Đã lưu trữ',   cls: 'qs-badge-archived' },
  SOFT_DELETED: { vi: 'Đã xóa',       cls: 'qs-badge-deleted' },
}

const DIFFICULTY: Record<string, { vi: string; short: string; cls: string; emoji: string }> = {
  EASY:   { vi: 'Dễ',         short: 'Dễ',  cls: 'qs-difficulty-easy',   emoji: '🟢' },
  MEDIUM: { vi: 'Trung bình', short: 'TB',  cls: 'qs-difficulty-medium', emoji: '⚡' },
  HARD:   { vi: 'Khó',        short: 'Khó', cls: 'qs-difficulty-hard',   emoji: '🔥' },
  MIXED:  { vi: 'Tổng hợp',   short: 'Mix', cls: 'qs-difficulty-mixed',  emoji: '🎲' },
}

export default function QuizSetDetail() {
  const { t } = useTranslation()
  const { id: groupId, setId } = useParams<{ id: string; setId: string }>()
  const navigate = useNavigate()

  const [quizSet, setQuizSet] = useState<QuizSet | null>(null)
  const [mastery, setMastery] = useState<QuizSetMastery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModePicker, setShowModePicker] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!groupId || !setId) return
    setLoading(true)
    Promise.all([
      getQuizSet(groupId, setId),
      getMyMastery(groupId, setId).catch(() => null),
    ])
      .then(([qs, m]) => { setQuizSet(qs); setMastery(m) })
      .catch(err => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false))
  }, [groupId, setId])

  if (loading) return (
    <div className="qs-bg min-h-screen flex items-center justify-center text-gray-400">{t('quizSet.detail.loading')}</div>
  )
  if (error || !quizSet) return (
    <div className="qs-bg min-h-screen flex items-center justify-center text-red-300 p-6 text-center">
      {error || t('quizSet.detail.notFound')}
    </div>
  )

  const cover = quizSet.coverImageUrl?.startsWith('emoji:') ? quizSet.coverImageUrl.slice(6) : '📖'
  const badge = STATUS_BADGE[quizSet.publishStatus]
  const diff = quizSet.difficulty ? DIFFICULTY[quizSet.difficulty] : null
  const masteryPct = quizSet.totalQuestions > 0 && mastery
    ? Math.round((mastery.questionsLearned / quizSet.totalQuestions) * 100)
    : 0
  const hasMastery = mastery && mastery.id != null && mastery.totalAttempts > 0

  const action = async (fn: () => Promise<QuizSet>, navigateTo?: string) => {
    setBusy(true); setError(null)
    try {
      const updated = await fn()
      setQuizSet(updated)
      if (navigateTo) navigate(navigateTo)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message)
    } finally {
      setBusy(false)
    }
  }

  const startMode = async (mode: RoomMode) => {
    if (!groupId) return
    setBusy(true)
    try {
      const room = await createLiveRoomFromQuizSet(groupId, { quizSetId: quizSet.id, mode })
      navigate(`/room/${room.roomCode}`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message)
    } finally {
      setBusy(false); setShowModePicker(false)
    }
  }

  const startSolo = async () => {
    if (!groupId) return
    setBusy(true)
    try {
      const sess = await startSoloPractice(groupId, quizSet.id)
      navigate('/quiz', {
        state: {
          sessionId: sess.sessionId,
          questions: sess.questions,
          showExplanation: true,
          timePerQuestion: 30,
        },
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message)
    } finally {
      setBusy(false); setShowModePicker(false)
    }
  }

  return (
    <div className="qs-bg min-h-screen">
      <div className="max-w-md mx-auto pb-6 qs-fade-in">
        {/* Hero cover */}
        <div className="relative h-44">
          <div className="absolute inset-0 qs-cover-easter" />
          <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-30">{cover}</div>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent, transparent, #11131e)' }}
          />

          <button
            onClick={() => navigate(`/groups/${groupId}/quiz-sets`)}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
            aria-label={t('quizSet.detail.back')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex gap-1.5 mb-1.5">
              <span className={`qs-badge-status ${badge.cls}`}>{badge.vi}</span>
              {quizSet.averageRating != null && (
                <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-[9px] font-bold text-[#e8a832]">
                  {t('quizSet.detail.rating', { rating: Number(quizSet.averageRating).toFixed(1), count: quizSet.totalRatings })}
                </span>
              )}
            </div>
            <h1 className="qs-font-vn-display font-extrabold text-white text-xl leading-tight">{quizSet.name}</h1>
          </div>
        </div>

        {/* Tags */}
        {quizSet.tags && quizSet.tags.length > 0 && (
          <div className="px-4 pt-3 flex gap-1.5 overflow-x-auto qs-scroll-thin">
            {quizSet.tags.map(tag => (
              <span key={tag} className="shrink-0 px-2 py-0.5 rounded-full bg-[#e8a832]/15 text-[#e8a832] text-[10px] font-semibold">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {quizSet.description && (
          <div className="px-4 pt-3">
            <p className="text-xs text-gray-300 leading-relaxed">{quizSet.description}</p>
          </div>
        )}

        {/* Quick stats grid */}
        <div className="px-4 pt-3">
          <div className="grid grid-cols-4 gap-1.5">
            <Stat label={t('quizSet.detail.statQuestions')} value={String(quizSet.totalQuestions)} />
            <StatDifficulty label={t('quizSet.detail.statDifficulty')} diff={diff} />
            <Stat
              label={t('quizSet.detail.statTime')}
              value={quizSet.estimatedDurationMin ? String(quizSet.estimatedDurationMin) : '—'}
              suffix={quizSet.estimatedDurationMin ? 'm' : undefined}
            />
            <Stat label={t('quizSet.detail.statPlays')} value={String(quizSet.playCount)} valueClass="text-[#e8a832]" />
          </div>
        </div>

        {/* Personal Mastery */}
        {hasMastery && (
          <div className="px-4 pt-4">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>{t('quizSet.detail.masteryHeader')}</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="rounded-xl p-3 border border-emerald-400/30" style={{ background: 'rgba(74, 222, 128, 0.06)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white">{t('quizSet.detail.masteryLearned')}</span>
                <span className="text-xs font-bold text-emerald-400">
                  {t('quizSet.detail.masteryProgress', { learned: mastery!.questionsLearned, total: quizSet.totalQuestions, pct: masteryPct })}
                </span>
              </div>
              <div className="qs-progress-bar h-2 mb-3">
                <div className="qs-progress-fill h-2" style={{ width: `${masteryPct}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label={t('quizSet.detail.masteryAttempts')} value={t('quizSet.detail.masteryAttemptsValue', { count: mastery!.totalAttempts })} />
                <MiniStat
                  label={t('quizSet.detail.masteryBest')}
                  value={mastery!.bestAccuracy != null ? `${Number(mastery!.bestAccuracy).toFixed(0)}%` : `${mastery!.bestScore}đ`}
                  valueClass="text-[#e8a832]"
                />
                <MiniStat
                  label={t('quizSet.detail.masteryLast')}
                  value={mastery!.lastPracticedAt ? relativeShort(mastery!.lastPracticedAt) : '—'}
                />
              </div>
              {mastery!.completedMastery && (
                <div className="mt-2 text-center text-[10px] text-emerald-400 font-bold">{t('quizSet.detail.masteryCompleted')}</div>
              )}
            </div>
          </div>
        )}

        {/* Author note */}
        {quizSet.authorNote && (
          <div className="px-4 pt-4">
            <div className="rounded-xl p-3 qs-glass">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('quizSet.detail.authorNote')}</div>
              <div className="text-xs text-gray-200 whitespace-pre-wrap">{quizSet.authorNote}</div>
            </div>
          </div>
        )}

        {/* Suggested mode + actions */}
        <div className="px-4 pt-4">
          {quizSet.suggestedMode && (
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t('quizSet.detail.suggestedMode', { mode: MODE_LABELS[quizSet.suggestedMode].vi })}
            </div>
          )}

          {/* Primary CTA */}
          {quizSet.publishStatus === 'PUBLISHED' && (
            <button
              onClick={() => setShowModePicker(true)}
              disabled={busy}
              className="w-full py-3 rounded-xl qs-gold-grad qs-font-vn-display font-extrabold text-[#11131e] text-sm flex items-center justify-center gap-2 mb-2 disabled:opacity-50"
            >
              <span>▶</span><span>{t('quizSet.detail.ctaPlayNow')}</span>
            </button>
          )}
          {quizSet.publishStatus === 'DRAFT' && (
            <button
              onClick={() => action(() => publishQuizSet(groupId!, setId!))}
              disabled={busy || quizSet.totalQuestions < 5}
              className="w-full py-3 rounded-xl qs-gold-grad qs-font-vn-display font-extrabold text-[#11131e] text-sm flex items-center justify-center gap-2 mb-2 disabled:opacity-50"
            >
              <span>✓</span><span>{quizSet.totalQuestions < 5 ? t('quizSet.detail.ctaNeedQuestions', { count: quizSet.totalQuestions }) : t('quizSet.detail.ctaPublish')}</span>
            </button>
          )}
          {quizSet.publishStatus === 'ARCHIVED' && (
            <button
              onClick={() => action(() => unarchiveQuizSet(groupId!, setId!))}
              disabled={busy}
              className="w-full py-3 rounded-xl qs-glass border border-[#e8a832]/30 text-[#e8a832] font-bold text-sm mb-2"
            >{t('quizSet.detail.ctaUnarchive')}</button>
          )}

          {/* Secondary actions */}
          {quizSet.publishStatus === 'PUBLISHED' && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={startSolo}
                disabled={busy}
                className="py-2.5 rounded-xl qs-glass border border-[#e8a832]/30 text-[#e8a832] font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              ><span>📚</span><span>{t('quizSet.detail.soloPractice')}</span></button>
              <button
                onClick={() => navigate(`/groups/${groupId}/scheduled-quizzes/new?quizSetId=${quizSet.id}`)}
                className="py-2.5 rounded-xl qs-glass border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
              ><span>📅</span><span>{t('quizSet.detail.schedule')}</span></button>
            </div>
          )}

          {/* Leader actions row */}
          <div className="rounded-xl p-2 border border-white/5 flex items-center justify-between" style={{ background: 'rgba(50, 52, 64, 0.3)' }}>
            <span className="text-[10px] text-gray-400">{t('quizSet.detail.leaderActions')}</span>
            <div className="flex gap-1">
              <IconButton
                title={t('quizSet.detail.edit')}
                onClick={() => navigate(`/groups/${groupId}/quiz-sets/${quizSet.id}/edit`)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </IconButton>
              <IconButton
                title={t('quizSet.detail.clone')}
                onClick={() => action(() => cloneQuizSet(groupId!, setId!), `/groups/${groupId}/quiz-sets`)}
                disabled={busy}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </IconButton>
              {quizSet.publishStatus === 'PUBLISHED' && (
                <IconButton
                  title={t('quizSet.detail.archive')}
                  onClick={() => action(() => archiveQuizSet(groupId!, setId!))}
                  disabled={busy}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="4" rx="1" />
                    <path d="M5 7v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M10 12h4" />
                  </svg>
                </IconButton>
              )}
              <IconButton
                title={t('quizSet.detail.delete')}
                onClick={() => {
                  if (confirm(t('quizSet.detail.deleteConfirm')))
                    action(() => deleteQuizSet(groupId!, setId!), `/groups/${groupId}/quiz-sets`)
                }}
                disabled={busy}
                className="text-red-400"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-2 14H7L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </IconButton>
            </div>
          </div>
        </div>
      </div>

      {/* Mode picker modal (mockup state ④) */}
      {showModePicker && (
        <ModePickerModal
          quizSet={quizSet}
          busy={busy}
          onPick={startMode}
          onSolo={startSolo}
          onClose={() => setShowModePicker(false)}
        />
      )}
    </div>
  )
}

function ModePickerModal({
  quizSet, busy, onPick, onSolo, onClose,
}: {
  quizSet: QuizSet; busy: boolean;
  onPick: (mode: RoomMode) => void; onSolo: () => void; onClose: () => void;
}) {
  const { t } = useTranslation()
  const cover = quizSet.coverImageUrl?.startsWith('emoji:') ? quizSet.coverImageUrl.slice(6) : '📖'
  const diff = quizSet.difficulty ? DIFFICULTY[quizSet.difficulty] : null

  const multiplayerModes: RoomMode[] = [
    'GROUP_LIVE_SEQUENTIAL', 'SPEED_RACE', 'TEAM_VS_TEAM', 'BATTLE_ROYALE', 'SUDDEN_DEATH'
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 qs-fade-in" onClick={onClose}>
      <div
        className="w-full md:max-w-md max-h-[85vh] overflow-y-auto qs-scroll-thin qs-bg rounded-t-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between sticky top-0 backdrop-blur z-10" style={{ background: 'rgba(17,19,30,0.95)' }}>
          <button onClick={onClose} className="text-gray-400 text-sm">{t('quizSet.detail.modePickerCancel')}</button>
          <div className="text-sm font-bold text-white">{t('quizSet.detail.modePickerTitle')}</div>
          <div className="w-12" />
        </div>

        {/* Quiz set summary */}
        <div className="px-4 mb-3">
          <div className="qs-glass rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 qs-cover-easter">{cover}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{quizSet.name}</div>
              <div className="text-[10px] text-gray-400">
                {quizSet.totalQuestions} câu
                {diff && ` · ${diff.emoji} ${diff.vi}`}
                {quizSet.estimatedDurationMin && ` · ~${quizSet.estimatedDurationMin} phút`}
              </div>
            </div>
          </div>
        </div>

        {/* Solo */}
        <div className="px-4 mb-3">
          <SectionHeader emoji="📚" label={t('quizSet.detail.sectionSolo')} colorCls="text-emerald-400" />
          <button
            onClick={() => { if (!busy) onSolo() }}
            disabled={busy}
            className="w-full qs-glass rounded-xl p-3 flex items-center gap-3 border border-emerald-400/20 disabled:opacity-50"
          >
            <div className="qs-mode-icon qs-mode-seq shrink-0">📚</div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{t('quizSet.detail.soloPractice')}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">{t('quizSet.detail.soloMastery')}</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{t('quizSet.detail.soloDescription')}</div>
            </div>
            <Chevron />
          </button>
        </div>

        {/* Multiplayer */}
        <div className="px-4 mb-4">
          <SectionHeader emoji="👥" label={t('quizSet.detail.sectionMultiplayer')} colorCls="text-[#e8a832]" />
          <div className="space-y-2">
            {multiplayerModes.map(mode => {
              const cfg = MODE_LABELS[mode]
              const av = getModeAvailability(mode, quizSet.totalQuestions)
              const isSuggested = quizSet.suggestedMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => av.available && !busy && onPick(mode)}
                  disabled={!av.available || busy}
                  className={`w-full rounded-xl p-3 flex items-center gap-3 ${
                    av.available
                      ? (isSuggested ? `border-2 border-emerald-400/40 ${cfg.cssClass}` : `border border-[#e8a832]/20 ${cfg.cssClass}`)
                      : 'qs-glass border border-white/10 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`qs-mode-icon ${cfg.cssClass} shrink-0`}>{cfg.emoji}</div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{cfg.vi}</span>
                      {isSuggested && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-semibold">{t('quizSet.detail.modeSuggested')}</span>
                      )}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isSuggested ? 'text-emerald-300' : 'text-gray-400'}`}>
                      {av.available ? cfg.tagline : av.reason}
                    </div>
                  </div>
                  <Chevron />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, suffix, valueClass }: { label: string; value: string; suffix?: string; valueClass?: string }) {
  return (
    <div className="qs-glass rounded-xl p-2 text-center">
      <div className="text-[9px] text-gray-400 uppercase font-semibold">{label}</div>
      <div className={`qs-font-vn-display font-bold text-base ${valueClass || 'text-white'}`}>
        {value}{suffix && <span className="text-[10px] text-gray-500">{suffix}</span>}
      </div>
    </div>
  )
}

function StatDifficulty({ label, diff }: { label: string; diff: { vi: string; short: string; cls: string; emoji: string } | null }) {
  return (
    <div className="qs-glass rounded-xl p-2 text-center">
      <div className="text-[9px] text-gray-400 uppercase font-semibold">{label}</div>
      <div className={`text-xs font-bold mt-0.5 ${diff?.cls ?? 'text-gray-500'}`}>
        {diff ? `${diff.emoji} ${diff.short}` : '—'}
      </div>
    </div>
  )
}

function MiniStat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-[9px] text-gray-400 uppercase">{label}</div>
      <div className={`text-sm font-bold ${valueClass ?? 'text-white'}`}>{value}</div>
    </div>
  )
}

function SectionHeader({ emoji, label, colorCls }: { emoji: string; label: string; colorCls: string }) {
  return (
    <div className={`text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-2 ${colorCls}`}>
      <span>{emoji} {label}</span>
      <div className="h-px flex-1 bg-current opacity-20" />
    </div>
  )
}

function IconButton({
  children, onClick, title, disabled, className,
}: {
  children: React.ReactNode; onClick: () => void; title: string;
  disabled?: boolean; className?: string;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 rounded-lg qs-glass flex items-center justify-center text-gray-400 disabled:opacity-50 ${className ?? ''}`}
    >{children}</button>
  )
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
      <path d="M9 18l6-6-6-6v12z" />
    </svg>
  )
}

function relativeShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const day = Math.floor(ms / 86400000)
  if (day === 0) return 'hôm nay'
  if (day === 1) return 'hôm qua'
  if (day < 7) return `${day} ngày`
  if (day < 30) return `${Math.floor(day / 7)} tuần`
  return new Date(iso).toLocaleDateString('vi-VN')
}
