import React from 'react'
import { useTranslation } from 'react-i18next'

const EXPORTS = [
  { type: 'questions', icon: 'quiz', labelKey: 'questionsLabel', descKey: 'questionsDesc', formats: ['CSV', 'JSON'] },
  { type: 'users', icon: 'group', labelKey: 'usersLabel', descKey: 'usersDesc', formats: ['CSV', 'Excel'] },
  { type: 'leaderboard', icon: 'leaderboard', labelKey: 'leaderboardLabel', descKey: 'leaderboardDesc', formats: ['CSV', 'PDF'] },
  { type: 'groups', icon: 'church', labelKey: 'groupsLabel', descKey: 'groupsDesc', formats: ['CSV', 'Excel'] },
  { type: 'analytics', icon: 'analytics', labelKey: 'analyticsLabel', descKey: 'analyticsDesc', formats: ['CSV', 'JSON'] },
]

export default function ExportCenter() {
  const { t } = useTranslation()

  const handleExport = (type: string, format: string) => {
    alert(t('admin.exportCenter.notImplemented', { type, format }))
  }

  return (
    <div data-testid="admin-export-page" className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-extrabold text-bq-ink tracking-tight">{t('admin.exportCenter.title')}</h1>
        <p className="text-bq-ink2 text-sm">{t('admin.exportCenter.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORTS.map(e => (
          <div key={e.type} data-testid={`export-${e.type}-card`} className="bg-bq-white rounded-lg border border-bq-hair shadow-bq-soft p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-bq-inset text-bq-amberd rounded">
                <span className="material-symbols-outlined">{e.icon}</span>
              </div>
              <div><h4 className="font-semibold text-bq-ink">{t(`admin.exportCenter.exports.${e.labelKey}`)}</h4><p className="text-bq-ink3 text-xs">{t(`admin.exportCenter.exports.${e.descKey}`)}</p></div>
            </div>
            <div className="flex gap-2">
              {e.formats.map(f => (
                <button key={f} data-testid={`export-btn-${f.toLowerCase()}`} onClick={() => handleExport(e.type, f)}
                  className="px-4 py-1.5 bg-bq-inset border border-bq-hair rounded text-xs text-bq-ink hover:bg-bq-hair transition-colors font-medium">{f}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
