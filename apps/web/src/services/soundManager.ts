/**
 * Sound Manager — generates all sounds via Web Audio API.
 * No external sound files needed. Total footprint: 0 KB assets.
 */

type SoundName =
  | 'correctAnswer' | 'wrongAnswer'
  | 'timerTick' | 'timerWarning'
  | 'combo3' | 'combo5' | 'combo10'
  | 'quizComplete' | 'perfectScore' | 'newRecord'
  | 'tierUp' | 'badgeUnlock'
  | 'buttonTap'

const STORAGE_KEY = 'bq_sound_settings'

class SoundManager {
  private _enabled: boolean = true
  private _volume: number = 0.7
  private ctx: AudioContext | null = null

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const { enabled, volume } = JSON.parse(saved)
        this._enabled = enabled ?? true
        this._volume = volume ?? 0.7
      }
    } catch { /* use defaults */ }
  }

  private getContext(): AudioContext | null {
    if (!this.ctx || this.ctx.state === 'closed') {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch {
        return null
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', vol?: number) {
    const ctx = this.getContext()
    if (!ctx) return
    const v = (vol ?? 1) * this._volume
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(v * 0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  private playChord(freqs: number[], duration: number, type: OscillatorType = 'sine', vol?: number) {
    freqs.forEach(f => this.playTone(f, duration, type, (vol ?? 1) / freqs.length))
  }

  private playSequence(notes: { freq: number; delay: number; dur: number; type?: OscillatorType }[], vol?: number) {
    const ctx = this.getContext()
    if (!ctx) return
    const v = (vol ?? 1) * this._volume
    notes.forEach(({ freq, delay, dur, type }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type ?? 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(v * 0.25, ctx.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + dur)
    })
  }

  play(sound: SoundName) {
    if (!this._enabled) return

    switch (sound) {
      case 'correctAnswer':
        // Happy "ding!" — ascending two notes
        this.playSequence([
          { freq: 880, delay: 0, dur: 0.1 },
          { freq: 1320, delay: 0.08, dur: 0.15 },
        ])
        break

      case 'wrongAnswer':
        // Sad buzzer — low descending
        this.playSequence([
          { freq: 300, delay: 0, dur: 0.15, type: 'square' },
          { freq: 200, delay: 0.12, dur: 0.2, type: 'square' },
        ], 0.6)
        break

      case 'timerTick':
        this.playTone(600, 0.05, 'sine', 0.3)
        break

      case 'timerWarning':
        this.playTone(800, 0.08, 'square', 0.4)
        break

      case 'combo3':
        // "Fire!" — ascending triad
        this.playSequence([
          { freq: 523, delay: 0, dur: 0.12 },
          { freq: 659, delay: 0.1, dur: 0.12 },
          { freq: 784, delay: 0.2, dur: 0.2 },
        ])
        break

      case 'combo5':
        // "Amazing!" — faster ascending + octave
        this.playSequence([
          { freq: 523, delay: 0, dur: 0.08 },
          { freq: 659, delay: 0.06, dur: 0.08 },
          { freq: 784, delay: 0.12, dur: 0.08 },
          { freq: 1047, delay: 0.18, dur: 0.25 },
        ])
        break

      case 'combo10':
        // Epic! — full chord + sparkle
        this.playSequence([
          { freq: 523, delay: 0, dur: 0.08 },
          { freq: 659, delay: 0.05, dur: 0.08 },
          { freq: 784, delay: 0.1, dur: 0.08 },
          { freq: 1047, delay: 0.15, dur: 0.08 },
          { freq: 1319, delay: 0.2, dur: 0.08 },
          { freq: 1568, delay: 0.25, dur: 0.3 },
        ])
        break

      case 'quizComplete':
        // Short fanfare
        this.playSequence([
          { freq: 523, delay: 0, dur: 0.15 },
          { freq: 659, delay: 0.15, dur: 0.15 },
          { freq: 784, delay: 0.3, dur: 0.15 },
          { freq: 1047, delay: 0.45, dur: 0.4 },
        ])
        break

      case 'perfectScore':
        // Celebration — longer fanfare with chord
        this.playSequence([
          { freq: 523, delay: 0, dur: 0.12 },
          { freq: 659, delay: 0.1, dur: 0.12 },
          { freq: 784, delay: 0.2, dur: 0.12 },
          { freq: 1047, delay: 0.3, dur: 0.2 },
          { freq: 1319, delay: 0.5, dur: 0.2 },
          { freq: 1568, delay: 0.7, dur: 0.5 },
        ])
        // Add shimmer
        setTimeout(() => {
          this.playChord([1047, 1319, 1568], 0.6, 'sine', 0.3)
        }, 900)
        break

      case 'newRecord':
        this.playSequence([
          { freq: 784, delay: 0, dur: 0.1 },
          { freq: 988, delay: 0.1, dur: 0.1 },
          { freq: 1175, delay: 0.2, dur: 0.1 },
          { freq: 1568, delay: 0.3, dur: 0.4 },
        ])
        break

      case 'tierUp':
        // Level up — majestic ascending chord
        this.playSequence([
          { freq: 262, delay: 0, dur: 0.2 },
          { freq: 330, delay: 0.15, dur: 0.2 },
          { freq: 392, delay: 0.3, dur: 0.2 },
          { freq: 523, delay: 0.5, dur: 0.3 },
          { freq: 659, delay: 0.7, dur: 0.3 },
          { freq: 784, delay: 0.9, dur: 0.5 },
        ])
        setTimeout(() => this.playChord([523, 659, 784], 0.8, 'sine', 0.4), 1100)
        break

      case 'badgeUnlock':
        this.playSequence([
          { freq: 659, delay: 0, dur: 0.12 },
          { freq: 880, delay: 0.1, dur: 0.12 },
          { freq: 1047, delay: 0.2, dur: 0.3 },
        ])
        break

      case 'buttonTap':
        this.playTone(1200, 0.03, 'sine', 0.2)
        break
    }
  }

  get enabled() { return this._enabled }
  get volume() { return this._volume }

  setEnabled(enabled: boolean) {
    this._enabled = enabled
    this.save()
  }

  setVolume(volume: number) {
    this._volume = Math.max(0, Math.min(1, volume))
    this.save()
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        enabled: this._enabled,
        volume: this._volume,
      }))
    } catch { /* ignore */ }
  }
}

export const soundManager = new SoundManager()
