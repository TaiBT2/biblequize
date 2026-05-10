import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMyAttempts, startSoloPractice, playQuizSetCoPlay,
  type QuizSet, type QuizSetMasterySummary, type QuizSetAttempt,
} from '../../api/quizSets'

// Hardcoded hex per MOCKUP_QUIZSET_CARDS.html (Bui rule: no CSS variables in card files,
// avoids the white-background bug from var() resolution failures).
const HEX = {
  gold: '#e8a832',
  goldHover: '#f0b842',
  navy: '#11131e',
  textPrimary: '#f5f5f5',
  textMuted: '#9ba0ad',
  textDim: '#7a7f8c',
  iconText: '#c9cdd6',
  green: '#4ade80',
  blue: '#5b8df0',
  red: '#ef4444',
  copper: '#c89968',
}

type Role = 'LEADER' | 'MOD' | 'MEMBER' | null

interface Props {
  groupId: string
  qs: QuizSet
  myRole: Role
  isMember: boolean
  onPlayCoPlay?: (qs: QuizSet) => void  // wired in P2.4; here disabled placeholder
  onSchedule?: (qs: QuizSet) => void    // wired in scheduled-mode prompt; here disabled placeholder
  onEditDraft?: (qs: QuizSet) => void
  onDeleteDraft?: (qs: QuizSet) => void
  onUnarchive?: (qs: QuizSet) => void
  onMenuOpen?: (qs: QuizSet, anchor: HTMLElement) => void
  onClick?: () => void
}

function statusBadge(status: QuizSet['publishStatus']): { label: string; bg: string; color: string; icon: string } | null {
  switch (status) {
    case 'PUBLISHED': return { label: 'Đã xuất bản', bg: 'rgba(74, 222, 128, 0.15)', color: HEX.green,  icon: 'check_circle' }
    case 'DRAFT':     return { label: 'Bản nháp',    bg: 'rgba(156, 163, 175, 0.15)', color: HEX.textMuted, icon: 'edit_note' }
    case 'ARCHIVED':  return { label: 'Đã lưu trữ',  bg: 'rgba(180, 130, 80, 0.15)',  color: HEX.copper, icon: 'archive' }
    case 'SOFT_DELETED': return { label: 'Đã xóa',  bg: 'rgba(239, 68, 68, 0.15)',   color: HEX.red, icon: 'delete' }
    default: return null
  }
}

function bookFromTagsOrScripture(qs: QuizSet): string {
  if (qs.coverScripture) {
    const m = qs.coverScripture.match(/^([^\d]+)/)
    if (m && m[1].trim()) return m[1].trim()
  }
  if (qs.tags && qs.tags.length > 0) return qs.tags[0]
  return 'Chưa chọn'
}

/**
 * Difficulty pills: BE only exposes a single `difficulty` enum (no per-level breakdown).
 * Map to a 3-pill display where the matching pill shows count, others show 0.
 * MIXED splits roughly: 40/40/20 of totalQuestions.
 * Documented in IMPL_NOTES.md as deviation from mockup.
 */
function difficultyDistribution(qs: QuizSet): { easy: number; medium: number; hard: number } {
  const total = qs.totalQuestions || 0
  switch (qs.difficulty) {
    case 'EASY':   return { easy: total, medium: 0, hard: 0 }
    case 'MEDIUM': return { easy: 0, medium: total, hard: 0 }
    case 'HARD':   return { easy: 0, medium: 0, hard: total }
    case 'MIXED': {
      const easy = Math.round(total * 0.4)
      const medium = Math.round(total * 0.4)
      return { easy, medium, hard: Math.max(0, total - easy - medium) }
    }
    default: return { easy: 0, medium: 0, hard: 0 }
  }
}

function formatRelative(iso?: string | null): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'vừa xong'
  if (min < 60) return `${min} phút trước`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h trước`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'hôm qua'
  if (day < 7) return `${day} ngày trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

export default function QuizSetListCard({
  groupId, qs, myRole, isMember,
  onPlayCoPlay: _onPlayCoPlay, onSchedule: _onSchedule,
  onEditDraft, onDeleteDraft, onUnarchive,
  onClick,
}: Props) {
  const navigate = useNavigate()
  const [mastery, setMastery] = useState<QuizSetMasterySummary | null>(null)
  const [attempts, setAttempts] = useState<QuizSetAttempt[]>([])
  const [attemptsLoaded, setAttemptsLoaded] = useState(false)
  const [showAttempts, setShowAttempts] = useState(false)
  const [soloModal, setSoloModal] = useState(false)
  const [soloBusy, setSoloBusy] = useState(false)
  const [soloError, setSoloError] = useState<string | null>(null)
  const [coPlayBusy, setCoPlayBusy] = useState(false)
  const [coPlayError, setCoPlayError] = useState<string | null>(null)

  const badge = statusBadge(qs.publishStatus)
  const book = bookFromTagsOrScripture(qs)
  const dist = difficultyDistribution(qs)
  const isLeader = myRole === 'LEADER' || myRole === 'MOD'
  const hasPlayed = !!mastery && mastery.totalAttempts > 0
  const isPublished = qs.publishStatus === 'PUBLISHED'
  const isDraft = qs.publishStatus === 'DRAFT'
  const isArchived = qs.publishStatus === 'ARCHIVED'

  // Eager-fetch mastery summary for PUBLISHED to render personal-best banner.
  useEffect(() => {
    if (!isPublished || !isMember) return
    let canceled = false
    getMyAttempts(groupId, qs.id)
      .then(res => {
        if (canceled) return
        setMastery(res.masterySummary)
        setAttempts(res.attempts)
        setAttemptsLoaded(true)
      })
      .catch(() => { /* silent — banner just won't render */ })
    return () => { canceled = true }
  }, [groupId, qs.id, isPublished, isMember])

  const ensureAttemptsLoaded = async () => {
    if (attemptsLoaded) return
    try {
      const res = await getMyAttempts(groupId, qs.id)
      setMastery(res.masterySummary)
      setAttempts(res.attempts)
      setAttemptsLoaded(true)
    } catch (_) { /* ignore */ }
  }

  const handleSoloClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setSoloError(null)
    await ensureAttemptsLoaded()
    setSoloModal(true)
  }

  const handleSoloConfirm = async () => {
    setSoloBusy(true); setSoloError(null)
    try {
      const result = await startSoloPractice(groupId, qs.id)
      navigate(`/quiz/${result.sessionId}?mode=solo&quizSetId=${qs.id}`)
    } catch (err: any) {
      setSoloError(err?.response?.data?.message || err?.message || 'Không thể bắt đầu lượt chơi')
      setSoloBusy(false)
    }
  }

  const handleCoPlay = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (coPlayBusy) return
    setCoPlayBusy(true); setCoPlayError(null)
    try {
      const room = await playQuizSetCoPlay(groupId, qs.id)
      navigate(`/room/${room.id}/lobby`)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể tạo phòng'
      setCoPlayError(msg)
      setCoPlayBusy(false)
    }
  }

  const handleCardClick = () => {
    if (onClick) onClick()
    else navigate(`/groups/${groupId}/quiz-sets/${qs.id}`)
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick() } }}
        data-testid="quiz-set-list-card"
        data-status={qs.publishStatus}
        style={{
          background: 'rgba(50, 52, 64, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {/* HEADER STRIP */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {badge && (
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 6,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
                textTransform: 'uppercase',
                background: badge.bg, color: badge.color,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{badge.icon}</span>
              {badge.label}
            </span>
          )}
          <span
            style={{
              background: 'rgba(232, 168, 50, 0.1)', color: HEX.gold,
              padding: '4px 10px', borderRadius: 6,
              fontSize: 12, fontWeight: 600,
              marginLeft: 'auto', marginRight: 8,
            }}
          >{book}</span>
          {isLeader && (
            <button
              type="button"
              onClick={e => { stop(e); /* TODO: open contextual leader menu */ }}
              aria-label="Tùy chọn"
              style={{
                background: 'transparent', border: 'none', color: HEX.textMuted,
                cursor: 'pointer', width: 28, height: 28, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_vert</span>
            </button>
          )}
        </div>

        {/* BODY */}
        <div style={{ padding: 16, flex: 1 }}>
          <div
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: 17, fontWeight: 700,
              marginBottom: 4, color: HEX.textPrimary,
            }}
          >{qs.name}</div>
          <div
            style={{
              color: qs.description ? HEX.textMuted : HEX.textDim,
              fontStyle: qs.description ? 'normal' : 'italic',
              fontSize: 13, marginBottom: 14,
            }}
          >{qs.description || 'Chưa có mô tả'}</div>

          {/* Difficulty pills (3-bin display per mockup; data adapted from single difficulty enum) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <DifficultyPill label="Dễ"  count={dist.easy}   color={HEX.green} />
            <DifficultyPill label="TB"  count={dist.medium} color={HEX.gold} />
            <DifficultyPill label="Khó" count={dist.hard}   color={HEX.red} />
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 10, fontSize: 12, color: HEX.textMuted,
            }}
          >
            <Stat icon="quiz">
              <span style={{ color: HEX.gold, fontWeight: 600 }}>{qs.totalQuestions}</span> câu
            </Stat>
            <Divider />
            <Stat icon="groups">{qs.playCount} lượt chơi</Stat>
            {qs.lastPlayedAt && (
              <>
                <Divider />
                <Stat icon="schedule">{formatRelative(qs.lastPlayedAt)}</Stat>
              </>
            )}
          </div>

          {/* Personal best banner — only when user has played */}
          {hasPlayed && mastery && (
            <div
              style={{
                marginTop: 10, padding: '10px 12px',
                background: 'rgba(232, 168, 50, 0.08)',
                border: '1px solid rgba(232, 168, 50, 0.2)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, color: HEX.gold,
              }}
              data-testid="personal-best-banner"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>emoji_events</span>
              <span>Điểm cao nhất của bạn</span>
              <span style={{ fontWeight: 700, marginLeft: 'auto' }}>
                {mastery.bestScore}
                {mastery.bestAccuracy != null && ` · ${Number(mastery.bestAccuracy).toFixed(0)}%`}
              </span>
            </div>
          )}

          {/* Collapsible my-attempts panel */}
          {hasPlayed && attemptsLoaded && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={e => { stop(e); setShowAttempts(v => !v) }}
                aria-expanded={showAttempts}
                data-testid="my-attempts-toggle"
                style={{
                  background: 'transparent', border: 'none', color: HEX.textMuted,
                  cursor: 'pointer', fontSize: 11, padding: 0,
                  display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {showAttempts ? 'expand_less' : 'expand_more'}
                </span>
                Lượt chơi của bạn ({mastery!.totalAttempts})
              </button>
              {showAttempts && attempts.length > 0 && (
                <ul
                  data-testid="my-attempts-list"
                  style={{ listStyle: 'none', margin: '6px 0 0 0', padding: 0, fontSize: 11, color: HEX.textMuted }}
                >
                  {attempts.map((a, i) => {
                    const isBest = a.score === mastery!.bestScore && a.score > 0
                    return (
                      <li
                        key={a.sessionId}
                        style={{
                          padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 8,
                          color: isBest ? HEX.gold : HEX.textMuted,
                          background: isBest ? 'rgba(232, 168, 50, 0.06)' : 'transparent',
                          borderRadius: 4,
                          fontWeight: isBest ? 600 : 400,
                        }}
                      >
                        <span style={{ minWidth: 50 }}>Lần {attempts.length - i}</span>
                        <span>{a.correctAnswers}/{a.totalQuestions} ({Number(a.accuracy).toFixed(0)}%)</span>
                        <span style={{ marginLeft: 'auto', color: HEX.textDim }}>{formatRelative(a.completedAt)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ACTIONS FOOTER — state-aware */}
        <div
          style={{
            padding: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex', gap: 8,
            background: isDraft ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)',
          }}
        >
          {isPublished && (
            <>
              <button
                type="button"
                disabled={!isMember || coPlayBusy}
                onClick={handleCoPlay}
                title={isMember ? 'Tạo phòng chơi cùng nhóm (Speed Race)' : 'Chỉ thành viên nhóm mới chơi được'}
                aria-label="Chơi cùng nhau"
                data-testid="btn-coplay"
                style={{
                  flex: 1, background: HEX.gold, color: HEX.navy, border: 'none',
                  padding: '11px 14px', borderRadius: 10,
                  fontWeight: 700, fontSize: 14,
                  cursor: (!isMember || coPlayBusy) ? 'not-allowed' : 'pointer',
                  opacity: (!isMember || coPlayBusy) ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>groups</span>
                {coPlayBusy ? 'Đang tạo phòng...' : 'Chơi cùng nhau'}
              </button>
              <IconButton
                disabled
                title="Tính năng đặt lịch sắp ra mắt"
                aria-label="Đặt lịch (sắp ra mắt)"
                icon="event"
                onClick={stop}
                data-testid="btn-schedule"
              />
              <IconButton
                title={hasPlayed ? 'Chơi lại solo' : 'Chơi solo'}
                aria-label={hasPlayed ? 'Chơi lại solo' : 'Chơi solo'}
                icon={hasPlayed ? 'refresh' : 'person'}
                onClick={handleSoloClick}
                disabled={!isMember}
                data-testid="btn-solo"
              />
            </>
          )}
          {isDraft && isLeader && (
            <>
              <button
                type="button"
                onClick={e => { stop(e); onEditDraft ? onEditDraft(qs) : navigate(`/groups/${groupId}/quiz-sets/${qs.id}`) }}
                style={{
                  flex: 1,
                  background: 'rgba(232, 168, 50, 0.15)', color: HEX.gold,
                  border: '1px dashed rgba(232, 168, 50, 0.4)',
                  padding: '11px 14px', borderRadius: 10,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit',
                }}
                data-testid="btn-edit-draft"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                Tiếp tục soạn
              </button>
              {onDeleteDraft && (
                <IconButton
                  title="Xóa nháp"
                  aria-label="Xóa nháp"
                  icon="delete"
                  onClick={e => { stop(e); onDeleteDraft(qs) }}
                  data-testid="btn-delete-draft"
                />
              )}
            </>
          )}
          {isArchived && (
            <>
              <button
                type="button"
                onClick={e => { stop(e); navigate(`/groups/${groupId}/quiz-sets/${qs.id}`) }}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)', color: HEX.iconText,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '11px 14px', borderRadius: 10,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit',
                }}
                data-testid="btn-view-archived"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                Xem chi tiết
              </button>
              {isLeader && onUnarchive && (
                <IconButton
                  title="Mở khóa"
                  aria-label="Mở khóa"
                  icon="lock_open"
                  onClick={e => { stop(e); onUnarchive(qs) }}
                  data-testid="btn-unarchive"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* CO-PLAY ERROR TOAST */}
      {coPlayError && (
        <div
          role="alert"
          data-testid="coplay-error"
          style={{
            position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 60, padding: '8px 14px', borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.9)', color: '#fff',
            fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
          }}
          onClick={() => setCoPlayError(null)}
        >{coPlayError}</div>
      )}

      {/* SOLO MODAL */}
      {soloModal && (
        <div
          onClick={() => !soloBusy && setSoloModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: 16,
          }}
          data-testid="solo-modal"
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(40, 42, 56, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16, maxWidth: 420, width: '100%',
              padding: 24, color: HEX.textPrimary,
            }}
          >
            <h2 style={{ fontFamily: '"Sora", sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              Chơi solo: {qs.name}
            </h2>
            {mastery && mastery.totalAttempts > 0 ? (
              <div style={{ fontSize: 13, color: HEX.textMuted, marginBottom: 18 }}>
                Đã chơi: <span style={{ color: HEX.gold, fontWeight: 600 }}>{mastery.totalAttempts} lượt</span>
                {' · '}
                Best: <span style={{ color: HEX.gold, fontWeight: 600 }}>
                  {mastery.bestScore}/{qs.totalQuestions}
                  {mastery.bestAccuracy != null && ` (${Number(mastery.bestAccuracy).toFixed(0)}%)`}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: HEX.textMuted, marginBottom: 18 }}>
                Lượt chơi đầu tiên của bạn — chúc may mắn!
              </div>
            )}
            {soloError && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                background: 'rgba(239, 68, 68, 0.15)', color: HEX.red, fontSize: 12,
              }}>{soloError}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSoloModal(false)}
                disabled={soloBusy}
                style={{
                  background: 'transparent', color: HEX.textMuted,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13,
                }}
              >Hủy</button>
              <button
                type="button"
                onClick={handleSoloConfirm}
                disabled={soloBusy}
                data-testid="solo-modal-confirm"
                style={{
                  background: HEX.gold, color: HEX.navy,
                  border: 'none', padding: '8px 14px', borderRadius: 8,
                  cursor: soloBusy ? 'wait' : 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                }}
              >{soloBusy ? 'Đang bắt đầu...' : 'Bắt đầu lượt mới'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DifficultyPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      style={{
        flex: 1, background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 8, padding: '6px 8px', textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <span style={{ display: 'block', fontWeight: 700, fontSize: 15, marginBottom: 1, color }}>{count}</span>
      <span style={{ fontSize: 10, color: '#9ba0ad', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</span>
    </div>
  )
}

function Stat({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 12, background: 'rgba(255, 255, 255, 0.1)' }} />
}

interface IconButtonProps {
  icon: string
  onClick: (e: React.MouseEvent) => void
  title: string
  'aria-label': string
  disabled?: boolean
  'data-testid'?: string
}

function IconButton(props: IconButtonProps) {
  const { icon, onClick, title, disabled } = props
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={props['aria-label']}
      disabled={disabled}
      data-testid={props['data-testid']}
      style={{
        width: 42, height: 42,
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#c9cdd6', borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'inherit', opacity: disabled ? 0.5 : 1,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
    </button>
  )
}
