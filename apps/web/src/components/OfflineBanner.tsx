import { useTranslation } from 'react-i18next'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const { t } = useTranslation()
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-error text-on-error text-center py-2 text-sm font-medium">
      <span className="material-symbols-outlined text-sm align-middle mr-1">wifi_off</span>
      {t('common.offline')}
    </div>
  )
}
