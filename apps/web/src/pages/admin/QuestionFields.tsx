import React from 'react'
import { useTranslation } from 'react-i18next'
import { Question, QuestionType, Difficulty, ReviewStatus } from './questionTypes'

interface Props {
  draft: Partial<Question>
  setField: <K extends keyof Question>(key: K, val: Question[K]) => void
  setOption: (i: number, val: string) => void
  toggleCorrect: (i: number) => void
  handleTypeChange: (type: QuestionType) => void
}

/**
 * Presentational question form fields (QPG-3). The "evaluate / AI suggest" panel
 * lives next to this in QuestionEditPage, not inside it.
 */
export default function QuestionFields({ draft, setField, setOption, toggleCorrect, handleTypeChange }: Props) {
  const { t } = useTranslation()
  return (
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
          <label className="block text-xs text-white/50 mb-2">
            {t('admin.questions.modal.optionsLabel')}
            {draft.type === 'multiple_choice_multi' && <span className="ml-2 text-blue-400">{t('admin.questions.modal.multiHint')}</span>}
          </label>
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
        <textarea rows={6} className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 text-sm resize-y min-h-[8rem] leading-relaxed"
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
    </div>
  )
}
