import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api/client'
import {
  Question, QuestionType, Difficulty, ReviewStatus, DuplicateWarning,
  QCheck, optionDefaults, evaluateQuestionQuality,
} from './questionTypes'

interface Props {
  /** Initial draft. Has `id` for an existing question (PUT), omit for create (POST). */
  initial: Partial<Question>
  onClose: () => void
  /** Called after a successful save — parent should refresh its list + close. */
  onSaved: () => void
}

/**
 * Shared question editor (QED-1). Owns its own draft state so it can be dropped
 * into both the Questions management page and the Review Queue without the host
 * tracking form state.
 */
export default function QuestionEditModal({ initial, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Partial<Question>>(initial)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null)
  const [quality, setQuality] = useState<QCheck[] | null>(null)

  const setField = <K extends keyof Question>(key: K, val: Question[K]) =>
    setDraft(prev => ({ ...prev, [key]: val }))

  const setOption = (i: number, val: string) =>
    setDraft(prev => {
      const opts = [...(prev.options ?? [])]
      opts[i] = val
      return { ...prev, options: opts }
    })

  const toggleCorrect = (i: number) =>
    setDraft(prev => {
      if (prev.type === 'multiple_choice_multi') {
        const cur = prev.correctAnswer ?? []
        const next = cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i].sort()
        return { ...prev, correctAnswer: next }
      }
      return { ...prev, correctAnswer: [i] }
    })

  const handleTypeChange = (newType: QuestionType) => {
    const lang = draft.language ?? 'vi'
    setDraft(prev => ({
      ...prev, type: newType,
      options: optionDefaults(newType, lang),
      correctAnswer: [0], correctAnswerText: '',
    }))
    setQuality(null)
  }

  const saveQuestion = async (forceCreate = false) => {
    setSaveError(null); setDuplicateWarning(null); setIsSaving(true)
    try {
      if (draft.id) {
        await api.put(`/api/admin/questions/${draft.id}`, draft)
      } else {
        const url = forceCreate ? '/api/admin/questions?forceCreate=true' : '/api/admin/questions'
        await api.post(url, draft)
      }
      onSaved()
    } catch (e: any) {
      const errData = e?.response?.data
      if (e?.response?.status === 409 && errData?.error === 'POSSIBLE_DUPLICATE') {
        setDuplicateWarning(errData)
      } else if (e?.response?.status === 409 && errData?.error === 'DUPLICATE') {
        setSaveError(t('admin.questions.error.exactDuplicate', { message: errData.message }))
      } else {
        setSaveError(errData?.message ?? errData?.error ?? t('admin.questions.error.saveFailed'))
      }
    } finally {
      setIsSaving(false)
    }
  }

  const isMc = draft.type === 'multiple_choice_single' || draft.type === 'multiple_choice_multi'

  return (
    <div data-testid="admin-questions-create-modal" className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-6">
      <div data-testid="question-form-modal" className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#111018] p-6 shadow-2xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{draft.id ? t('admin.questions.modal.editTitle') : t('admin.questions.modal.createTitle')}</h3>
          <button onClick={onClose} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">✕</button>
        </div>

        <div className="space-y-4">
          {/* Row 1: Scripture ref */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-white/50 mb-1">{t('admin.questions.modal.bookLabel')}</label>
              <input className="w-full h-9 px-3 rounded bg-white/10 border border-white/10 text-sm"
                value={draft.book ?? ''} onChange={e => setField('book', e.target.value)} placeholder={t('admin.questions.modal.bookPlaceholder')} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">{t('admin.questions.modal.chapterLabel')}</label>
              <input type="number" className="w-full h-9 px-3 rounded bg-white/10 border border-white/10 text-sm"
                value={draft.chapter ?? ''} onChange={e => setField('chapter', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">{t('admin.questions.modal.verseStartLabel')}</label>
              <input type="number" className="w-full h-9 px-3 rounded bg-white/10 border border-white/10 text-sm"
                value={draft.verseStart ?? ''} onChange={e => setField('verseStart', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>

          {/* Row 2: Meta */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">{t('admin.questions.modal.verseEndLabel')}</label>
              <input type="number" className="w-full h-9 px-3 rounded bg-white/10 border border-white/10 text-sm"
                value={draft.verseEnd ?? ''} onChange={e => setField('verseEnd', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">{t('admin.questions.modal.difficultyLabel')}</label>
              <select className="w-full h-9 px-3 rounded bg-white/10 border border-white/10 text-sm"
                value={draft.difficulty ?? 'easy'} onChange={e => setField('difficulty', e.target.value as Difficulty)}>
                <option value="easy">{t('admin.questions.filter.easy')}</option>
                <option value="medium">{t('admin.questions.filter.medium')}</option>
                <option value="hard">{t('admin.questions.filter.hard')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">{t('admin.questions.modal.typeLabel')}</label>
              <select className="w-full h-9 px-3 rounded bg-white/10 border border-white/10 text-sm"
                value={draft.type ?? 'multiple_choice_single'}
                onChange={e => handleTypeChange(e.target.value as QuestionType)}>
                <option value="multiple_choice_single">{t('admin.questions.modal.mcSingleFull')}</option>
                <option value="multiple_choice_multi">{t('admin.questions.modal.mcMultiFull')}</option>
                <option value="true_false">{t('admin.questions.modal.trueFalseFull')}</option>
                <option value="fill_in_blank">{t('admin.questions.modal.fillBlank')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">{t('admin.questions.modal.languageLabel')}</label>
              <select className="w-full h-9 px-3 rounded bg-white/10 border border-white/10 text-sm"
                value={draft.language ?? 'vi'} onChange={e => setField('language', e.target.value)}>
                <option value="vi">{t('admin.questions.modal.langVi')}</option>
                <option value="en">{t('admin.questions.modal.langEn')}</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs text-white/50 mb-1">
              {t('admin.questions.modal.contentLabel')}
              {draft.type === 'fill_in_blank' && <span className="ml-2 text-yellow-400">{t('admin.questions.modal.fillBlankHint')}</span>}
            </label>
            <textarea data-testid="admin-question-content-input" rows={3} className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 text-sm resize-none"
              value={draft.content ?? ''} onChange={e => setField('content', e.target.value)} />
          </div>

          {/* Options + Correct Answer */}
          {draft.type !== 'fill_in_blank' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs text-white/50">
                  {t('admin.questions.modal.optionsLabel')}
                  {draft.type === 'multiple_choice_multi' && <span className="ml-2 text-blue-400">{t('admin.questions.modal.multiHint')}</span>}
                </label>
                {isMc && (
                  <button type="button"
                    onClick={() => setQuality(evaluateQuestionQuality(draft))}
                    className="text-xs px-2.5 py-1 rounded bg-[#e8a832]/15 border border-[#e8a832]/30 text-[#e8a832] hover:bg-[#e8a832]/25 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">checklist</span>
                    Đánh giá chất lượng
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(draft.options ?? []).map((opt, i) => {
                  const isCorrect = (draft.correctAnswer ?? []).includes(i)
                  const isMulti   = draft.type === 'multiple_choice_multi'
                  const isTF      = draft.type === 'true_false'
                  return (
                    <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${isCorrect ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                      <span className="text-xs font-bold text-white/50 w-5 mt-2">{String.fromCharCode(65 + i)}</span>
                      <textarea
                        className="flex-1 min-h-[2rem] px-2 py-1.5 rounded bg-white/10 border border-white/10 text-sm resize-none leading-snug break-words"
                        rows={Math.min(4, Math.max(1, Math.ceil((opt?.length || 0) / 46)))}
                        value={opt}
                        readOnly={isTF}
                        onChange={e => !isTF && setOption(i, e.target.value)}
                      />
                      <button type="button"
                        onClick={() => toggleCorrect(i)}
                        className={`flex-shrink-0 w-8 h-8 mt-0.5 rounded flex items-center justify-center text-sm font-bold transition-colors ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}
                        title={isMulti ? t('admin.questions.modal.toggleCorrectTitle') : t('admin.questions.modal.pickCorrectTitle')}>
                        {isMulti ? (isCorrect ? '✓' : '○') : (isCorrect ? '●' : '○')}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* QEV: quality evaluation result */}
              {quality && (
                <div data-testid="quality-eval-result" className="mt-3 p-3 rounded-lg bg-[#11131c] border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Đánh giá đáp án</span>
                    <button type="button" onClick={() => setQuality(null)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
                  </div>
                  {quality.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className={c.status === 'pass' ? 'text-emerald-400' : c.status === 'warn' ? 'text-yellow-400' : 'text-sky-400'}>
                        {c.status === 'pass' ? '✓' : c.status === 'warn' ? '⚠' : 'ℹ'}
                      </span>
                      <span className="text-white/70 leading-snug">{c.label}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-white/30 pt-1">Đánh giá tức thời theo nguyên tắc; bấm lại sau khi sửa để cập nhật.</p>
                </div>
              )}
            </div>
          )}

          {/* Fill-in-blank answer */}
          {draft.type === 'fill_in_blank' && (
            <div>
              <label className="block text-xs text-white/50 mb-1">{t('admin.questions.modal.fillAnswerLabel')}</label>
              <input className="w-full h-9 px-3 rounded bg-white/10 border border-white/10 text-sm"
                value={draft.correctAnswerText ?? ''}
                onChange={e => setField('correctAnswerText', e.target.value)}
                placeholder={t('admin.questions.modal.fillAnswerPlaceholder')} />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs text-white/50 mb-1">{t('admin.questions.modal.explanationLabel')}</label>
            <textarea rows={2} className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 text-sm resize-none"
              value={draft.explanation ?? ''} onChange={e => setField('explanation', e.target.value)}
              placeholder={t('admin.questions.modal.explanationPlaceholder')} />
          </div>

          {/* Review Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">{t('admin.questions.modal.reviewStatusLabel')}</label>
              <select className="w-full h-9 px-3 rounded bg-white/10 border border-white/10 text-sm"
                value={draft.reviewStatus ?? 'ACTIVE'}
                onChange={e => setField('reviewStatus', e.target.value as ReviewStatus)}>
                <option value="ACTIVE">{t('admin.questions.modal.statusActive')}</option>
                <option value="PENDING">{t('admin.questions.modal.statusPending')}</option>
                <option value="REJECTED">{t('admin.questions.modal.statusRejected')}</option>
              </select>
            </div>
          </div>

          {saveError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{saveError}</div>
          )}

          {duplicateWarning && (
            <div data-testid="duplicate-warning" className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <h4 className="text-yellow-400 font-semibold text-sm mb-2">⚠️ {duplicateWarning.message}</h4>
              <div className="space-y-2 mb-3">
                {duplicateWarning.similarQuestions?.map((q) => (
                  <div key={q.questionId} className="bg-white/5 rounded p-2 text-xs">
                    <p className="text-on-surface">{q.content}</p>
                    <p className="text-on-surface-variant mt-1">
                      {q.book} {q.chapter}:{q.verseStart} · {t('admin.questions.modal.similaritySuffix', { percent: q.similarityPercent })}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDuplicateWarning(null)} className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs">{t('admin.questions.modal.duplicateCancel')}</button>
                <button onClick={() => saveQuestion(true)} className="px-3 py-1.5 rounded bg-yellow-600 hover:bg-yellow-500 text-xs font-medium">{t('admin.questions.modal.duplicateProceed')}</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-sm">{t('admin.questions.modal.cancelButton')}</button>
          <button data-testid="admin-question-save-btn" disabled={isSaving} onClick={() => saveQuestion()}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium">
            {isSaving ? t('admin.questions.modal.saving') : (draft.id ? t('admin.questions.modal.updateButton') : t('admin.questions.modal.createSubmit'))}
          </button>
        </div>
      </div>
    </div>
  )
}
