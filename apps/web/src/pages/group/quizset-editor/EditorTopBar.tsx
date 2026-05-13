import { useNavigate } from 'react-router-dom'
import type { PublishStatus } from '../../../api/quizSets'
import { COLOR } from './styles'

interface Props {
  groupId: string
  groupName?: string
  quizSetName: string
  status: PublishStatus
  lastSavedAgoSec: number | null
  saving: boolean
  questionCount: number
  aiUsed: number
  aiLimit: number
  onPublish: () => void
  onSaveDraft: () => void
  canPublish: boolean
}

function statusBadge(status: PublishStatus, savedAgo: number | null, saving: boolean) {
  if (status === 'DRAFT') {
    const label = saving ? 'ĐANG LƯU...' : savedAgo == null ? 'NHÁP' : `NHÁP · ĐÃ LƯU ${formatAgo(savedAgo)} TRƯỚC`
    return { bg: 'rgba(251,191,36,0.10)', color: COLOR.warning, label }
  }
  if (status === 'PUBLISHED') return { bg: 'rgba(74,222,128,0.12)', color: COLOR.success, label: 'ĐÃ XUẤT BẢN' }
  if (status === 'ARCHIVED')  return { bg: 'rgba(156,163,175,0.12)', color: COLOR.textMuted, label: 'ĐÃ LƯU TRỮ' }
  return { bg: 'rgba(239,68,68,0.12)', color: COLOR.danger, label: 'ĐÃ XOÁ' }
}

function formatAgo(sec: number): string {
  if (sec < 60) return `${sec}s`
  if (sec < 3600) return `${Math.floor(sec / 60)} phút`
  return `${Math.floor(sec / 3600)}h`
}

export default function EditorTopBar({
  groupId, groupName, quizSetName, status, lastSavedAgoSec, saving,
  questionCount, aiUsed, aiLimit, onPublish, onSaveDraft, canPublish,
}: Props) {
  const navigate = useNavigate()
  const badge = statusBadge(status, lastSavedAgoSec, saving)

  return (
    <div style={{
      background: COLOR.bgPanel,
      borderBottom: `1px solid ${COLOR.borderXSubtle}`,
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <button
        onClick={() => navigate(`/groups/${groupId}`)}
        style={{
          background: 'transparent', border: 'none', color: COLOR.textMuted, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, padding: '6px 10px', borderRadius: 6,
        }}
      >
        <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden /> Quay lại
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
        <i className="ti ti-books" style={{ fontSize: 18, color: COLOR.gold }} aria-hidden />
        <div style={{ fontSize: 14, color: COLOR.textPrimary, fontWeight: 500 }}>
          {quizSetName || 'Bộ câu hỏi mới'}
        </div>
        {groupName && (
          <>
            <span style={{ color: COLOR.textDisabled, fontSize: 12 }}>·</span>
            <div style={{ fontSize: 12, color: COLOR.textMuted }}>{groupName}</div>
          </>
        )}
        <span style={{
          background: badge.bg, color: badge.color,
          fontSize: 10, padding: '3px 8px', borderRadius: 999,
          fontWeight: 500, letterSpacing: 0.5, marginLeft: 4, whiteSpace: 'nowrap',
        }}>{badge.label}</span>
      </div>

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: COLOR.goldBg, border: `1px solid rgba(232,168,50,0.22)`,
        padding: '4px 9px', borderRadius: 999, fontSize: 11, color: COLOR.gold,
      }}>
        <i className="ti ti-sparkles" style={{ fontSize: 12 }} aria-hidden />
        <span>AI: {aiUsed}/{aiLimit}</span>
      </div>

      <button onClick={onSaveDraft} disabled={saving} style={{
        background: 'rgba(255,255,255,0.04)', color: COLOR.textSecondary,
        border: `1px solid ${COLOR.borderSubtle}`,
        padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
        opacity: saving ? 0.6 : 1,
      }}>Lưu nháp</button>

      <button onClick={onPublish} disabled={!canPublish} style={{
        background: canPublish ? COLOR.gold : 'rgba(232,168,50,0.30)',
        color: '#1a1226', border: 'none', padding: '8px 18px', borderRadius: 8,
        fontSize: 13, fontWeight: 500, cursor: canPublish ? 'pointer' : 'not-allowed',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        opacity: canPublish ? 1 : 0.6,
      }}>
        <i className="ti ti-rocket" style={{ fontSize: 14 }} aria-hidden />
        {status === 'PUBLISHED' ? `Lưu thay đổi` : `Xuất bản (${questionCount} câu)`}
      </button>
    </div>
  )
}
