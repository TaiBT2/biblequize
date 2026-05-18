import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { soundManager } from '../../services/soundManager'
import { isHapticsEnabled, setHapticsEnabled } from '../../utils/haptics'
import { FILL_STYLE } from './types'

export function SoundHapticsSettings() {
  const { t } = useTranslation()
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled)
  const [volume, setVolume] = useState(Math.round(soundManager.volume * 100))
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled())

  return (
    <section className="bg-surface-container/60 backdrop-blur-sm border border-outline-variant/10 rounded-2xl p-5 md:p-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface inline-flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[18px] text-secondary" style={FILL_STYLE}>volume_up</span>
        {t('profile.soundAndHapticsTitle')}
      </h2>

      <div className="divide-y divide-white/[0.04]">
        <div className="flex items-center justify-between py-3 gap-4">
          <span className="text-sm text-on-surface">{t('profile.soundEffectsLabel')}</span>
          <div className="flex items-center gap-3">
            {soundEnabled && (
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setVolume(v)
                  soundManager.setVolume(v / 100)
                }}
                className="w-32 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            )}
            {soundEnabled && <span className="text-xs font-bold text-secondary w-8 text-right">{volume}%</span>}
            <Toggle
              on={soundEnabled}
              onChange={(next) => {
                setSoundEnabled(next)
                soundManager.setEnabled(next)
                if (next) soundManager.play('buttonTap')
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between py-3 gap-4">
          <span className="text-sm text-on-surface">{t('profile.hapticsLabel')}</span>
          <Toggle on={hapticsOn} onChange={(next) => { setHapticsOn(next); setHapticsEnabled(next) }} />
        </div>
      </div>
    </section>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-10 h-[22px] rounded-full relative transition-colors ${on ? 'gold-gradient' : 'bg-white/10'}`}
      aria-pressed={on}
    >
      <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'right-[3px]' : 'left-[3px]'}`} />
    </button>
  )
}
