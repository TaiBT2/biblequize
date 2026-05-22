import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'

interface PoolExhaustedModalProps {
  isOpen: boolean
  onClose: () => void
  /** From coverageStatus.currentWeek.canUnlockNext — drives the CTA set. */
  canUnlockNext: boolean
  onUnlockNextWeek: () => void
}

/**
 * Pool-exhaustion modal (§7.11.4) — replaces the legacy alert() when the
 * week's question pool runs dry. Calming "nights" tone, not an error.
 *
 * canUnlockNext = true  → 2 CTAs: unlock next week / defer
 * canUnlockNext = false → 1 CTA:  close (pool refreshes tomorrow)
 */
export default function PoolExhaustedModal({
  isOpen,
  onClose,
  canUnlockNext,
  onUnlockNextWeek,
}: PoolExhaustedModalProps) {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" ariaLabel={t('ranked.pool_exhausted.title')}>
      <div style={{ textAlign: 'center' }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 60, color: '#e8a832', fontVariationSettings: "'FILL' 1" }}
        >
          nights_stay
        </span>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#ffffff',
            margin: '12px 0 8px',
          }}
        >
          {t('ranked.pool_exhausted.title')}
        </h2>

        <p style={{ fontSize: 14, color: '#c5c8d8', lineHeight: 1.5, margin: 0 }}>
          {canUnlockNext
            ? t('ranked.pool_exhausted.body')
            : t('ranked.pool_exhausted.no_unlock_body')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          {canUnlockNext ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onUnlockNextWeek()
                  onClose()
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #e8a832, #d4951f)',
                  color: '#11131e',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t('ranked.pool_exhausted.unlock_cta')}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#c5c8d8',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('ranked.pool_exhausted.defer_cta')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#c5c8d8',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('ranked.pool_exhausted.close_cta')}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
