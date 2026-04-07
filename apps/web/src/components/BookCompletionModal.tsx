import { useTranslation } from 'react-i18next'

interface BookCompletionModalProps {
  bookName: string
  masteryPercent: number
  nextBookName?: string | null
  onContinue: () => void
  onClose: () => void
}

export default function BookCompletionModal({
  bookName, masteryPercent, nextBookName, onContinue, onClose,
}: BookCompletionModalProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="glass-card max-w-sm w-full p-8 text-center space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-6xl block">📖</span>
        <h2 className="text-2xl font-black text-secondary">{t('journey.celebration')}</h2>
        <div className="space-y-1">
          <p className="text-lg font-bold text-on-surface">{bookName}</p>
          <p className="text-on-surface-variant text-sm">
            {t('journey.mastery', { percent: masteryPercent })}
          </p>
        </div>

        {nextBookName && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3">
            <p className="text-sm text-secondary font-semibold">
              🔓 {t('journey.unlockNext', { book: nextBookName })}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/20 text-on-surface-variant text-sm hover:bg-surface-container-high"
          >
            {t('common.close')}
          </button>
          <button
            onClick={onContinue}
            className="flex-1 gold-gradient text-on-secondary py-2.5 rounded-xl font-bold text-sm"
          >
            {t('journey.continueBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
