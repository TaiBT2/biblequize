import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { createScheduledQuiz, listScheduledQuizzes } from '../api/scheduledQuiz'

interface QuizSetItem {
  id: string
  name: string
  questionCount: number
}

type DeadlinePreset = '24h' | '7d' | '14d' | 'custom'

const computeDeadline = (preset: DeadlinePreset, customIso?: string): string => {
  const now = new Date()
  if (preset === '24h') return new Date(now.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 19)
  if (preset === '7d') return new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 19)
  if (preset === '14d') return new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 19)
  return customIso ?? new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 19)
}

const ScheduledQuizCreate: React.FC = () => {
  const { t } = useTranslation()
  const { id: groupId } = useParams()
  const navigate = useNavigate()

  const [quizSets, setQuizSets] = useState<QuizSetItem[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string>('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [preset, setPreset] = useState<DeadlinePreset>('7d')
  const [customDeadline, setCustomDeadline] = useState('')
  const [maxAttempts, setMaxAttempts] = useState(3)
  const [isLeaderboardPublic, setIsLeaderboardPublic] = useState(true)
  const [sendNotifications, setSendNotifications] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCount, setActiveCount] = useState(0)

  const atMaxActive = activeCount >= 3

  useEffect(() => {
    if (!groupId) return
    api.get(`/api/groups/${groupId}/quiz-sets`).then(res => {
      if (res.data.success) {
        setQuizSets(res.data.quizSets.map((qs: any) => ({
          id: qs.id, name: qs.name,
          questionCount: Array.isArray(qs.questionIds) ? qs.questionIds.length : 0,
        })))
        if (res.data.quizSets.length > 0) setSelectedSetId(res.data.quizSets[0].id)
      }
    }).catch(() => {})
    listScheduledQuizzes(groupId, 'ACTIVE').then(qs => setActiveCount(qs.length)).catch(() => {})
  }, [groupId])

  const deadline = useMemo(() => computeDeadline(preset, customDeadline), [preset, customDeadline])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId || !selectedSetId || atMaxActive) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createScheduledQuiz(groupId, {
        quizSetId: selectedSetId,
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        deadline,
        maxAttempts,
        isLeaderboardPublic,
        sendNotifications,
      })
      navigate(`/groups/${groupId}/scheduled-quizzes/${created.id}`, { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể tạo quiz'
      const code = err?.response?.data?.code
      setError(code === 'MAX_ACTIVE_QUIZZES_REACHED' ? t('scheduledQuiz.maxActiveError') : msg)
      setSubmitting(false)
    }
  }

  if (!groupId) return null

  return (
    <div className="min-h-screen bg-[#0a0b13] text-on-surface px-4 py-6 max-w-2xl mx-auto" data-testid="scheduled-quiz-create">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="text-on-surface/60 hover:text-on-surface" aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[#60a5fa]">schedule</span>
            {t('scheduledQuiz.createTitle')}
          </h1>
          <p className="text-on-surface-variant text-xs">{t('scheduledQuiz.createSubtitle')}</p>
        </div>
      </div>

      {atMaxActive && (
        <div data-testid="max-active-banner" className="mb-4 px-4 py-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">
          {t('scheduledQuiz.maxActiveBanner')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[rgba(50,52,64,0.4)] border border-[rgba(232,168,50,0.15)] rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1.5">{t('scheduledQuiz.fieldName')} <span className="text-error">*</span></label>
          <input
            value={name} onChange={e => setName(e.target.value)} required
            className="w-full bg-[rgba(17,19,30,0.5)] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:border-secondary outline-none"
            placeholder={t('scheduledQuiz.fieldNamePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5">{t('scheduledQuiz.fieldDescription')}</label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full bg-[rgba(17,19,30,0.5)] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:border-secondary outline-none resize-vertical"
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5">{t('scheduledQuiz.fieldQuizSet')} <span className="text-error">*</span></label>
          <select
            value={selectedSetId} onChange={e => setSelectedSetId(e.target.value)}
            className="w-full bg-[rgba(17,19,30,0.5)] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:border-secondary outline-none"
          >
            {quizSets.length === 0 && <option value="">{t('scheduledQuiz.noQuizSets')}</option>}
            {quizSets.map(qs => (
              <option key={qs.id} value={qs.id}>{qs.name} ({qs.questionCount} câu)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5">{t('scheduledQuiz.fieldDeadline')} <span className="text-error">*</span></label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(['24h', '7d', '14d', 'custom'] as DeadlinePreset[]).map(p => (
              <button
                key={p} type="button" onClick={() => setPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  preset === p
                    ? 'bg-[rgba(232,168,50,0.15)] text-secondary border border-[rgba(232,168,50,0.4)]'
                    : 'bg-[rgba(50,52,64,0.5)] text-on-surface/70 border border-white/5'
                }`}
              >
                {t(`scheduledQuiz.deadline_${p}`)}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <input
              type="datetime-local" value={customDeadline}
              onChange={e => setCustomDeadline(e.target.value)}
              className="w-full bg-[rgba(17,19,30,0.5)] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:border-secondary outline-none"
            />
          )}
          <p className="text-on-surface/50 text-[10px] mt-1">{t('scheduledQuiz.deadlineHelp', { iso: deadline.replace('T', ' ') })}</p>
        </div>
        <div className="bg-[rgba(17,19,30,0.3)] rounded-xl p-3 space-y-3">
          <ToggleRow label={t('scheduledQuiz.toggle3Attempts')} desc={t('scheduledQuiz.toggle3AttemptsDesc')}
            value={maxAttempts === 3} onChange={v => setMaxAttempts(v ? 3 : 1)} />
          <ToggleRow label={t('scheduledQuiz.togglePush')} desc={t('scheduledQuiz.togglePushDesc')}
            value={sendNotifications} onChange={setSendNotifications} />
          <ToggleRow label={t('scheduledQuiz.togglePublicLb')} desc={t('scheduledQuiz.togglePublicLbDesc')}
            value={isLeaderboardPublic} onChange={setIsLeaderboardPublic} />
        </div>

        {error && <div className="text-error text-sm">{error}</div>}

        <button
          type="submit" disabled={submitting || atMaxActive || !selectedSetId}
          data-testid="submit-create"
          className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)',
            color: '#11131e',
            boxShadow: '0 6px 20px rgba(232,168,50,0.3)',
          }}
        >
          <span className="material-symbols-outlined text-base">schedule</span>
          {submitting ? '...' : t('scheduledQuiz.submitCta')}
        </button>
      </form>
    </div>
  )
}

const ToggleRow: React.FC<{ label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, desc, value, onChange }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1">
      <div className="text-sm font-medium">{label}</div>
      {desc && <div className="text-on-surface/60 text-[11px]">{desc}</div>}
    </div>
    <button type="button" onClick={() => onChange(!value)}
      className={`w-10 h-6 rounded-full relative transition ${value ? 'bg-gradient-to-br from-secondary to-tertiary' : 'bg-white/10'}`}
      aria-pressed={value}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${value ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  </div>
)

export default ScheduledQuizCreate
