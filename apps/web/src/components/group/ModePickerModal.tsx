import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getModeAvailability, MODE_LABELS, type QuizSet, type RoomMode } from '../../api/quizSets'

const DIFFICULTY: Record<string, { vi: string; emoji: string }> = {
  EASY:   { vi: 'Dễ',         emoji: '🟢' },
  MEDIUM: { vi: 'Trung bình', emoji: '⚡' },
  HARD:   { vi: 'Khó',        emoji: '🔥' },
  MIXED:  { vi: 'Tổng hợp',   emoji: '🎲' },
}

const MULTIPLAYER_MODES: RoomMode[] = [
  'GROUP_LIVE_SEQUENTIAL', 'SPEED_RACE', 'TEAM_VS_TEAM', 'BATTLE_ROYALE', 'SUDDEN_DEATH',
]

export interface ModePickerModalProps {
  quizSet: QuizSet
  busy: boolean
  groupId: string
  onPick: (mode: RoomMode) => void
  /** Solo handler. Pass `null` to hide the solo section (e.g. when the card already exposes a separate solo entry). */
  onSolo: (() => void) | null
  /** When false, the "Lên lịch" section is hidden (e.g. for users without Leader/Mod role). */
  canSchedule?: boolean
  onClose: () => void
}

export default function ModePickerModal({
  quizSet, busy, groupId, onPick, onSolo, canSchedule = true, onClose,
}: ModePickerModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const cover = quizSet.coverImageUrl?.startsWith('emoji:') ? quizSet.coverImageUrl.slice(6) : '📖'
  const diff = quizSet.difficulty ? DIFFICULTY[quizSet.difficulty] : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60 lg:bg-black/70 backdrop-blur-sm qs-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full lg:max-w-4xl max-h-[85vh] overflow-y-auto qs-scroll-thin rounded-t-3xl lg:rounded-3xl flex flex-col"
        style={{ background: 'rgba(20, 22, 32, 0.95)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 lg:px-8 py-4 lg:py-5 border-b border-white/10 flex items-center justify-between sticky top-0 backdrop-blur z-10" style={{ background: 'rgba(20, 22, 32, 0.95)' }}>
          <div>
            <h2 className="text-base lg:text-xl font-extrabold text-white">{t('quizSet.detail.modePickerTitle')}</h2>
            <div className="hidden lg:block text-xs text-gray-400 mt-0.5">
              Bộ: <span className="text-white">{quizSet.name}</span> · {quizSet.totalQuestions} câu{diff && ` · ${diff.emoji} ${diff.vi}`}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-400"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile quiz set summary */}
        <div className="lg:hidden px-4 mb-3 mt-3">
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

        <div className="px-4 lg:px-8 py-3 lg:py-6">
          {onSolo && (
            <>
              <SectionHeader emoji="📚" label={t('quizSet.detail.sectionSolo')} colorCls="text-emerald-400" />
              <button
                onClick={() => { if (!busy) onSolo() }}
                disabled={busy}
                className="qs-mode-card w-full qs-glass rounded-xl p-3 lg:p-4 flex items-center gap-3 lg:gap-4 border border-emerald-400/20 disabled:opacity-50 mb-4 lg:mb-6"
              >
                <div className={`qs-mode-icon qs-mode-seq shrink-0 lg:w-14 lg:h-14 lg:text-3xl`}>📚</div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 lg:mb-1">
                    <span className="text-sm lg:text-base font-bold text-white">{t('quizSet.detail.soloPractice')}</span>
                    <span className="text-[9px] lg:text-[10px] px-1.5 lg:px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">{t('quizSet.detail.soloMastery')}</span>
                  </div>
                  <div className="text-[10px] lg:text-xs text-gray-400">{t('quizSet.detail.soloDescription')}</div>
                  <div className="hidden lg:block text-[10px] text-gray-500 mt-1">⚠️ KHÔNG đóng góp Group Leaderboard (Q-A locked)</div>
                </div>
                <Chevron />
              </button>
            </>
          )}

          {/* Multiplayer */}
          <SectionHeader emoji="👥" label={t('quizSet.detail.sectionMultiplayer')} colorCls="text-[#e8a832]" />
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 mb-4 lg:mb-6">
            {MULTIPLAYER_MODES.map(mode => {
              const cfg = MODE_LABELS[mode]
              const av = getModeAvailability(mode, quizSet.totalQuestions)
              const isSuggested = quizSet.suggestedMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => av.available && !busy && onPick(mode)}
                  disabled={!av.available || busy}
                  className={`qs-mode-card w-full rounded-xl p-3 lg:p-4 flex items-center gap-3 ${
                    av.available
                      ? (isSuggested
                          ? `border-2 border-emerald-400/40 ${cfg.cssClass}`
                          : `border ${cfg.cssClass}`)
                      : 'qs-glass border border-white/10 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`qs-mode-icon ${cfg.cssClass} shrink-0 lg:w-12 lg:h-12 lg:text-2xl`}>{cfg.emoji}</div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-bold text-white">{cfg.vi}</span>
                      {isSuggested && (
                        <span className="text-[9px] lg:text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-semibold">{t('quizSet.detail.modeSuggested')}</span>
                      )}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isSuggested ? 'text-emerald-300' : 'text-gray-400'}`}>
                      {av.available ? cfg.tagline : av.reason}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {canSchedule && (
            <>
              <SectionHeader emoji="📅" label="Sự kiện nhóm" colorCls="text-purple-400" />
              <button
                onClick={() => {
                  navigate(`/groups/${groupId}/scheduled-quizzes/new?quizSetId=${quizSet.id}`)
                  onClose()
                }}
                className="qs-mode-card qs-glass-subtle w-full rounded-xl p-3 lg:p-4 flex items-center gap-3 lg:gap-4 border border-purple-400/20"
              >
                <div
                  className="qs-mode-icon shrink-0 lg:w-14 lg:h-14 lg:text-3xl"
                  style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                >📅</div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm lg:text-base font-bold text-white mb-0.5">Lên lịch quiz cho nhóm</div>
                  <div className="text-[10px] lg:text-xs text-gray-400">Cho cả nhóm chơi async trong khoảng thời gian. Có hạn chót, có attempts limit.</div>
                </div>
                <Chevron />
              </button>
            </>
          )}
        </div>

        {/* Desktop footer tip */}
        <div className="hidden lg:flex px-8 py-4 border-t border-white/10 items-center justify-between bg-black/20">
          <div className="text-[10px] text-gray-500">💡 Tip: Sequential phù hợp khi nội dung cần thảo luận. Speed Race phù hợp thiếu nhi.</div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg qs-glass-subtle border border-white/10 text-gray-300 text-xs font-semibold"
          >Hủy</button>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ emoji, label, colorCls }: { emoji: string; label: string; colorCls: string }) {
  return (
    <div className={`text-[10px] lg:text-xs font-bold uppercase tracking-wider mb-2 lg:mb-3 flex items-center gap-2 ${colorCls}`}>
      <span>{emoji} {label}</span>
      <div className="h-px flex-1 bg-current opacity-20" />
    </div>
  )
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
      <path d="M9 18l6-6-6-6v12z" />
    </svg>
  )
}
