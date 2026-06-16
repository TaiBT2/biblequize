import React from 'react'
import { useTranslation } from 'react-i18next'
import { DraftQuestion, DraftStatus, CLAUDE_MODELS } from './types'

interface DraftCardProps {
  draft: DraftQuestion
  isEditing: boolean
  isSaving: boolean
  editData: Partial<DraftQuestion>
  onEdit: () => void
  onChange: (field: string, val: any) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onApprove: () => void
  onReject: () => void
  onRestore: () => void
  onRemove: () => void
}

const OPT_LABELS = ['A', 'B', 'C', 'D', 'E']
const DIFF_STYLE: Record<string, string> = { easy: 'bg-bq-emerald/10 text-bq-emerald', medium: 'bg-bq-amber/10 text-bq-amberd', hard: 'bg-bq-ruby/10 text-bq-ruby' }
const DIFF_LABEL_KEY: Record<string, string> = {
  easy: 'admin.aiGenerator.draftCard.difficultyEasy',
  medium: 'admin.aiGenerator.draftCard.difficultyMedium',
  hard: 'admin.aiGenerator.draftCard.difficultyHard',
}
const STATUS_STYLE: Record<DraftStatus, string> = { pending: 'bg-bq-amber/10 text-bq-amberd', approved: 'bg-bq-emerald/10 text-bq-emerald', rejected: 'bg-bq-inset text-bq-ink3' }
const STATUS_LABEL_KEY: Record<DraftStatus, string> = {
  pending: 'admin.aiGenerator.draftCard.statusPending',
  approved: 'admin.aiGenerator.draftCard.statusApproved',
  rejected: 'admin.aiGenerator.draftCard.statusRejected',
}

export default function DraftCard({ draft, isEditing, isSaving, editData, onEdit, onChange, onSaveEdit, onCancelEdit, onApprove, onReject, onRestore, onRemove }: DraftCardProps) {
  const { t } = useTranslation()
  const cur = isEditing ? { ...draft, ...editData } as DraftQuestion : draft
  const opts = Array.isArray(cur.options) ? cur.options : []
  const isCorrect = (i: number) => Array.isArray(cur.correctAnswer) ? cur.correctAnswer.includes(i) : cur.correctAnswer === i

  return (
    <div data-testid="ai-draft-card" data-status={draft.status} className={`bg-bq-white rounded-lg p-5 border-2 transition-all duration-200 ${
      draft.status === 'approved' ? 'border-bq-emerald/30 opacity-80' :
      draft.status === 'rejected' ? 'border-transparent opacity-50' :
      isEditing ? 'border-bq-amber/50 shadow-bq-soft' : 'border-bq-hair hover:border-bq-ink3/40'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[draft.status]}`}>{t(STATUS_LABEL_KEY[draft.status])}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_STYLE[cur.difficulty] || 'bg-bq-inset text-bq-ink2'}`}>{DIFF_LABEL_KEY[cur.difficulty] ? t(DIFF_LABEL_KEY[cur.difficulty]) : cur.difficulty}</span>
        <span className="text-xs text-bq-ink2 font-medium">
          {cur.book} {cur.chapter}{(cur.verseStart || cur.verseEnd) ? `:${cur.verseStart || '?'}–${cur.verseEnd || '?'}` : ''}
        </span>
        {draft.generatedBy && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-bq-amber/10 text-bq-amberd border border-bq-amber/30">
            {CLAUDE_MODELS.find(m => m.id === draft.generatedBy)?.label ?? draft.generatedBy}
          </span>
        )}
        {draft.status !== 'approved' && (
          <button onClick={onRemove} className="ml-auto text-bq-ink3 hover:text-bq-ruby transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* View mode */}
      {!isEditing && (
        <div className="space-y-3">
          <p className="text-bq-ink font-semibold text-sm leading-snug">{cur.content}</p>
          {opts.length > 0 && (
            <div className="space-y-1.5">
              {opts.map((opt, i) => (
                <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm border ${
                  isCorrect(i) ? 'bg-bq-emerald/10 border-bq-emerald/40 text-bq-emerald font-semibold' : 'bg-bq-inset border-bq-hair text-bq-ink2'
                }`}>
                  <span className={`w-5 h-5 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ${
                    isCorrect(i) ? 'bg-bq-action text-white' : 'bg-bq-inset text-bq-ink2'
                  }`}>{OPT_LABELS[i]}</span>
                  <span className="flex-1">{opt}</span>
                </div>
              ))}
            </div>
          )}
          {cur.explanation && (
            <div className="px-3 py-2.5 bg-bq-amber/10 border border-bq-amber/30 rounded-xl text-xs text-bq-amberd leading-relaxed">
              <span className="font-bold">{t('admin.aiGenerator.draftCard.explanationPrefix')}</span>{cur.explanation}
            </div>
          )}
        </div>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-bq-ink2 uppercase tracking-wider mb-1.5">{t('admin.aiGenerator.draftCard.questionLabel')}</label>
            <textarea rows={2} value={cur.content} onChange={e => onChange('content', e.target.value)} className="w-full bg-bq-white border border-bq-hair rounded-lg px-3 py-2 text-bq-ink placeholder:text-bq-ink3 focus:ring-1 focus:ring-bq-sapphire transition-all resize-none text-sm" />
          </div>
          {opts.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-bq-ink2 uppercase tracking-wider mb-1.5">{t('admin.aiGenerator.draftCard.optionsLabel')}</label>
              {opts.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ${
                    isCorrect(i) ? 'bg-bq-action text-white' : 'bg-bq-inset text-bq-ink2'
                  }`}>{OPT_LABELS[i]}</span>
                  <input type="text" value={opt} onChange={e => { const n = [...opts]; n[i] = e.target.value; onChange('options', n) }} className="w-full bg-bq-white border border-bq-hair rounded-lg px-3 py-2 text-bq-ink placeholder:text-bq-ink3 focus:ring-1 focus:ring-bq-sapphire transition-all text-sm py-2 flex-1" />
                  <button onClick={() => onChange('correctAnswer', i)} className={`w-8 h-8 rounded-lg text-sm font-black transition-all flex-shrink-0 ${
                    isCorrect(i) ? 'bg-bq-action text-white' : 'bg-bq-inset text-bq-ink3 hover:bg-bq-hair'
                  }`}>✓</button>
                </div>
              ))}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-bq-ink2 uppercase tracking-wider mb-1.5">{t('admin.aiGenerator.draftCard.explanationLabel')}</label>
            <textarea rows={2} value={cur.explanation || ''} onChange={e => onChange('explanation', e.target.value)} className="w-full bg-bq-white border border-bq-hair rounded-lg px-3 py-2 text-bq-ink placeholder:text-bq-ink3 focus:ring-1 focus:ring-bq-sapphire transition-all resize-none text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={onSaveEdit} className="flex-1 bg-bq-action text-white shadow-bq-action text-sm font-bold py-2.5 rounded-xl hover:brightness-110 transition-colors">{t('admin.aiGenerator.draftCard.saveEditButton')}</button>
            <button onClick={onCancelEdit} className="px-5 text-sm font-bold text-bq-ink2 bg-bq-inset py-2.5 rounded-xl hover:bg-bq-hair transition-colors">{t('admin.aiGenerator.draftCard.cancelEditButton')}</button>
          </div>
        </div>
      )}

      {/* Save error */}
      {draft.saveError && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-bq-ruby/10 border border-bq-ruby/30">
          <p className="text-bq-ruby text-xs font-semibold leading-snug">{draft.saveError}</p>
        </div>
      )}

      {/* Actions */}
      {draft.status === 'pending' && !isEditing && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-bq-hair">
          <button data-testid="ai-draft-approve-btn" onClick={onApprove} disabled={isSaving}
            className="flex-1 bg-bq-action text-white shadow-bq-action text-sm font-bold py-2.5 rounded-xl hover:brightness-110 transition-colors disabled:opacity-60">
            {isSaving ? t('admin.aiGenerator.draftCard.approveSaving') : t('admin.aiGenerator.draftCard.approveButton')}
          </button>
          <button onClick={onEdit} className="px-4 text-sm font-bold text-bq-ink2 bg-bq-inset py-2.5 rounded-xl hover:bg-bq-hair transition-colors">{t('admin.aiGenerator.draftCard.editButton')}</button>
          <button data-testid="ai-draft-reject-btn" onClick={onReject} className="w-10 flex items-center justify-center text-bq-ink3 bg-bq-inset rounded-xl hover:bg-bq-ruby/10 hover:text-bq-ruby transition-colors" title={t('admin.aiGenerator.draftCard.rejectTitle')}>✕</button>
        </div>
      )}

      {draft.status === 'rejected' && (
        <div className="mt-3 pt-3 border-t border-bq-hair">
          <button onClick={onRestore} className="text-xs text-bq-ink3 hover:text-bq-amberd transition-colors font-semibold">{t('admin.aiGenerator.draftCard.restoreButton')}</button>
        </div>
      )}

      {draft.status === 'approved' && (
        <div className="mt-3 pt-3 border-t border-bq-emerald/30 flex items-center gap-1.5 text-xs text-bq-emerald font-semibold">
          {t('admin.aiGenerator.draftCard.approvedFooter')}
          {draft.approvedId && <span className="text-bq-emerald/70 font-normal ml-1">#{draft.approvedId.slice(0, 8)}</span>}
        </div>
      )}
    </div>
  )
}
