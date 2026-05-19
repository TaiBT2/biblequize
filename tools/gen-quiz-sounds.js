#!/usr/bin/env node
/**
 * Generate WAV files matching apps/web/src/services/soundManager.ts tones.
 *
 * Outputs:
 *   apps/mobile/assets/sounds/correct.wav  — 2-note ding (880 → 1320 Hz)
 *   apps/mobile/assets/sounds/wrong.wav    — descending buzzer (300 → 200 Hz square)
 *
 * Format: 44.1 kHz mono 16-bit PCM. Exponential decay envelope mirrors
 * soundManager.playSequence (gain * 0.25 → 0.001 over duration).
 */

const fs = require('fs')
const path = require('path')

const SAMPLE_RATE = 44100

function envelope(t, dur, peak = 0.25) {
  if (t < 0 || t > dur) return 0
  // Exponential decay: peak * (0.001/peak) ^ (t/dur)
  return peak * Math.pow(0.001 / peak, t / dur)
}

function osc(freq, t, type = 'sine') {
  const phase = 2 * Math.PI * freq * t
  switch (type) {
    case 'square': return Math.sin(phase) >= 0 ? 1 : -1
    case 'sawtooth': return 2 * (freq * t - Math.floor(freq * t + 0.5))
    default: return Math.sin(phase)
  }
}

/**
 * notes: [{ freq, delay (s), dur (s), type? }]
 * Returns Float32Array of mono samples covering total length.
 */
function renderSequence(notes, volPerNote = 0.25) {
  const total = Math.max(...notes.map(n => n.delay + n.dur)) + 0.05
  const N = Math.ceil(total * SAMPLE_RATE)
  const buf = new Float32Array(N)
  for (const n of notes) {
    const startSample = Math.floor(n.delay * SAMPLE_RATE)
    const noteSamples = Math.floor(n.dur * SAMPLE_RATE)
    for (let i = 0; i < noteSamples; i++) {
      const t = i / SAMPLE_RATE
      const s = osc(n.freq, n.delay + t, n.type) * envelope(t, n.dur, volPerNote)
      const idx = startSample + i
      if (idx < N) buf[idx] += s
    }
  }
  // Clip to [-1, 1] for safety
  for (let i = 0; i < N; i++) {
    if (buf[i] > 1) buf[i] = 1
    if (buf[i] < -1) buf[i] = -1
  }
  return buf
}

function writeWav(samples, filePath) {
  const N = samples.length
  const byteRate = SAMPLE_RATE * 2 // 16-bit mono
  const dataSize = N * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)         // PCM chunk size
  buf.writeUInt16LE(1, 20)          // PCM format
  buf.writeUInt16LE(1, 22)          // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24)
  buf.writeUInt32LE(byteRate, 28)
  buf.writeUInt16LE(2, 32)          // block align
  buf.writeUInt16LE(16, 34)         // bits per sample
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < N; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2)
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, buf)
  console.log(`Wrote ${filePath} (${(dataSize / 1024).toFixed(1)} KB, ${(N / SAMPLE_RATE * 1000).toFixed(0)} ms)`)
}

// ── correctAnswer: ascending two-note ding (web soundManager.ts case 'correctAnswer') ───
writeWav(
  renderSequence([
    { freq: 880, delay: 0, dur: 0.1 },
    { freq: 1320, delay: 0.08, dur: 0.15 },
  ]),
  path.join(__dirname, '..', 'apps', 'mobile', 'assets', 'sounds', 'correct.wav'),
)

// ── wrongAnswer: descending square buzzer (volPerNote 0.25 * 0.6 = 0.15) ────────────────
writeWav(
  renderSequence([
    { freq: 300, delay: 0, dur: 0.15, type: 'square' },
    { freq: 200, delay: 0.12, dur: 0.2, type: 'square' },
  ], 0.15),
  path.join(__dirname, '..', 'apps', 'mobile', 'assets', 'sounds', 'wrong.wav'),
)
