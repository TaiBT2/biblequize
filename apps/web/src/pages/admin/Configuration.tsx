import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const CONFIG_CATEGORIES: Record<string, { key: string; default: string }[]> = {
  Game: [
    { key: 'DAILY_ENERGY', default: '100' },
    { key: 'ENERGY_REGEN_PER_HOUR', default: '20' },
    { key: 'DAILY_QUESTION_CAP', default: '100' },
    { key: 'STREAK_FREEZE_PER_WEEK', default: '1' },
  ],
  Scoring: [
    { key: 'BASE_POINTS_EASY', default: '8' },
    { key: 'BASE_POINTS_MEDIUM', default: '12' },
    { key: 'BASE_POINTS_HARD', default: '18' },
    { key: 'COMBO_THRESHOLD_1', default: '5' },
    { key: 'COMBO_THRESHOLD_2', default: '10' },
  ],
  AI: [
    { key: 'AI_DAILY_QUOTA', default: '200' },
    { key: 'AI_COST_ALERT_USD', default: '10.00' },
    { key: 'AI_DEFAULT_MODEL', default: 'gemini' },
  ],
  Room: [
    { key: 'ROOM_MAX_PLAYERS', default: '20' },
    { key: 'ROOM_CODE_LENGTH', default: '6' },
    { key: 'ROOM_IDLE_TIMEOUT_MIN', default: '30' },
  ],
}

export default function ConfigurationAdmin() {
  const { t } = useTranslation()
  const [values, setValues] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  const getValue = (key: string, def: string) => values[key] ?? def
  const setValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }))
    setDirty(prev => new Set(prev).add(key))
  }

  const saveAll = () => {
    // TODO: POST /api/admin/config with changed values
    alert(t('admin.configuration.saveAlert', { count: dirty.size }))
    setDirty(new Set())
  }

  return (
    <div data-testid="admin-config-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-extrabold text-[#e1e1ef] tracking-tight">{t('admin.configuration.title')}</h2><p className="text-[#d5c4af] text-sm mt-1">{t('admin.configuration.subtitle')}</p></div>
        {dirty.size > 0 && (
          <button data-testid="config-save-btn" onClick={saveAll} className="px-4 py-2 bg-[#e8a832] text-[#281900] rounded-lg text-sm font-bold hover:brightness-110">
            {t('admin.configuration.saveChanges', { count: dirty.size })}
          </button>
        )}
      </div>

      {dirty.size > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-400 text-sm">
          {t('admin.configuration.warningBanner')}
        </div>
      )}

      {Object.entries(CONFIG_CATEGORIES).map(([category, items]) => (
        <div key={category} data-testid={`config-${category.toLowerCase()}-panel`} className="rounded-lg border border-[#504535]/10 bg-[#1d1f29] p-5">
          <h3 className="font-bold text-[#e1e1ef] mb-4">{category}</h3>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#d5c4af]">{t(`admin.configuration.labels.${item.key}`)}</p>
                  <p className="text-[#d5c4af]/30 text-xs">{t('admin.configuration.defaultHint', { key: item.key, default: item.default })}</p>
                </div>
                <input {...(item.key === 'DAILY_ENERGY' ? { 'data-testid': 'config-daily-energy-input' } : {})} value={getValue(item.key, item.default)} onChange={e => setValue(item.key, e.target.value)}
                  className={`w-24 bg-[#0c0e17] border-none rounded px-3 py-1 text-sm text-[#e1e1ef] text-right focus:ring-1 focus:ring-[#e8a832] outline-none ${dirty.has(item.key) ? 'ring-1 ring-amber-500/50' : ''}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
