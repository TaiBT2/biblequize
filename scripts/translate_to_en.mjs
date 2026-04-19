#!/usr/bin/env node
/**
 * Batch-translate VI question JSON files to EN using Gemini API.
 *
 * Requires Node 18+ (built-in fetch). No npm dependencies.
 *
 * Usage:
 *     $env:GEMINI_API_KEY = "..."
 *     node scripts/translate_to_en.mjs --book ruth       # test 1 book
 *     node scripts/translate_to_en.mjs --all             # all books
 *     node scripts/translate_to_en.mjs --all --force     # overwrite existing EN files
 *
 * Output: writes `{book}_quiz_en.json` next to each VI file.
 * Idempotent: skips files that already have EN version unless --force.
 *
 * Strategy: batch 5 questions per API call. If a batch fails (rate
 * limit / network / malformed JSON from model), logs and moves on —
 * partial progress is saved. Re-run without --force to continue.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SEED_DIR = join(__dirname, '..', 'apps', 'api', 'src', 'main', 'resources', 'seed', 'questions')

const PROMPT_TEMPLATE = (count, questionsJson) => `You are a professional Bible translator working on a quiz app for Protestant audiences.
Translate these ${count} Vietnamese quiz questions into clear, natural English
while preserving the exact meaning and Bible references.

Terminology (always use these English forms):
  - Đức Chúa Trời / Đức Giê-hô-va → God / the LORD
  - Chúa Giê-su / Jêsus → Jesus
  - Đấng Cứu Thế / Đấng Christ → Christ / the Messiah
  - Sứ đồ → Apostle
  - Môn đồ → Disciple
  - Kinh Thánh → the Bible / Scripture
  - Thánh Linh / Thần Linh → the Holy Spirit
  - Thiên sứ → angel
  - Bản dịch: use the English Standard Version (ESV) phrasing when quoting verses

Rules:
  1. Translate "content", each "options" entry, and "explanation".
  2. KEEP "correctAnswer" array EXACTLY as-is (it's an index into options).
  3. KEEP "book", "chapter", "verseStart", "verseEnd", "difficulty", "type" unchanged.
  4. Translate "tags" to English equivalents (e.g., "Cựu Ước" → "Old Testament",
     "Sáng Thế Ký" → "Genesis", "Sáng tạo" → "Creation", "Cơ bản" → "Easy").
  5. Set "language" to "en".
  6. Output valid JSON array with one object per question. No prose, no markdown.

Input (Vietnamese JSON array):
${questionsJson}

Output the translated JSON array ONLY.`

// Primary + fallback models. Try in order on 429/quota errors.
// Current (2026) free-tier Gemini model names. Adjust if Google deprecates.
// Check available models: `node scripts/translate_to_en.mjs --list-models`
const MODELS = (process.env.GEMINI_MODEL || 'gemini-2.5-flash,gemini-2.0-flash,gemini-2.0-flash-lite').split(',')
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 5
const RPM_DELAY_MS = Number(process.env.RPM_DELAY_MS) || 5_000   // throttle: wait ≥5s between calls (→ ≤12 RPM)
const MAX_RETRIES = 3

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function callGemini(model, apiKey, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`Gemini HTTP ${res.status}: ${text.slice(0, 300)}`)
    err.status = res.status
    throw err
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error(`Gemini response missing content`)
  return JSON.parse(text)
}

async function translateBatch(questions, apiKey) {
  const prompt = PROMPT_TEMPLATE(questions.length, JSON.stringify(questions, null, 2))
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  }

  // Per-call rate-limit pause (except the very first call)
  if (globalThis.__lastCallAt) {
    const elapsed = Date.now() - globalThis.__lastCallAt
    if (elapsed < RPM_DELAY_MS) await sleep(RPM_DELAY_MS - elapsed)
  }

  let lastErr
  // Try each model in order, retry with exponential backoff on 429
  for (const model of MODELS) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await callGemini(model, apiKey, body)
        globalThis.__lastCallAt = Date.now()
        if (model !== MODELS[0] || attempt > 0) {
          process.stdout.write(`(ok via ${model}${attempt > 0 ? `, retry ${attempt}` : ''}) `)
        }
        return result
      } catch (e) {
        lastErr = e
        globalThis.__lastCallAt = Date.now()
        // Retry on 429/503 with backoff; fail fast on 4xx (bad request / auth)
        if (e.status === 429 || e.status === 503) {
          const wait = 10_000 * Math.pow(2, attempt)  // 10s, 20s, 40s
          process.stdout.write(`(${e.status}, wait ${wait / 1000}s) `)
          await sleep(wait)
          continue
        }
        break // non-retriable — try next model
      }
    }
  }
  throw lastErr
}

async function translateFile(viPath, apiKey, force) {
  const enPath = viPath.replace(/_quiz\.json$/, '_quiz_en.json')
  if (existsSync(enPath) && !force) {
    console.log(`  ${enPath.split(/[\\/]/).pop()} already exists — skip (use --force to overwrite)`)
    return
  }
  const viQuestions = JSON.parse(await readFile(viPath, 'utf-8'))
  const translated = []
  for (let i = 0; i < viQuestions.length; i += BATCH_SIZE) {
    const batch = viQuestions.slice(i, i + BATCH_SIZE)
    process.stdout.write(`  translating ${i + 1}..${i + batch.length} / ${viQuestions.length} ... `)
    try {
      const enBatch = await translateBatch(batch, apiKey)
      translated.push(...enBatch)
      console.log('ok')
    } catch (e) {
      console.log(`FAILED: ${e.message}`)
      console.log('  (stopping to preserve partial progress)')
      break
    }
  }
  if (translated.length > 0) {
    await writeFile(enPath, JSON.stringify(translated, null, 2) + '\n', 'utf-8')
    console.log(`  wrote ${enPath.split(/[\\/]/).pop()} (${translated.length} questions)`)
  }
}

async function listAvailableModels(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`ListModels failed: HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`)
    return
  }
  const data = await res.json()
  const supported = (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace('models/', ''))
    .sort()
  console.log('Models available on this key (support generateContent):')
  for (const m of supported) console.log(`  ${m}`)
  console.log(`\nTry:  $env:GEMINI_MODEL = "${supported[0] || 'gemini-2.0-flash'}"`)
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const listModels = args.includes('--list-models')
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY env var required.')
    console.error('  PowerShell:  $env:GEMINI_API_KEY = "..."')
    console.error('  Bash:        export GEMINI_API_KEY=...')
    process.exit(1)
  }

  if (listModels) {
    await listAvailableModels(apiKey)
    return
  }

  let files
  if (args.includes('--all')) {
    const entries = await readdir(SEED_DIR)
    files = entries
      .filter((f) => f.endsWith('_quiz.json') && !f.endsWith('_quiz_en.json'))
      .sort()
      .map((f) => join(SEED_DIR, f))
  } else {
    const bookIdx = args.findIndex((a) => a === '--book')
    if (bookIdx === -1 || !args[bookIdx + 1]) {
      console.error('Usage: node scripts/translate_to_en.mjs --book <slug> | --all  [--force]')
      process.exit(1)
    }
    const slug = args[bookIdx + 1]
    const f = join(SEED_DIR, `${slug}_quiz.json`)
    if (!existsSync(f)) {
      console.error(`ERROR: ${f} not found`)
      process.exit(1)
    }
    files = [f]
  }

  for (const viFile of files) {
    console.log(`\n→ ${viFile.split(/[\\/]/).pop()}`)
    await translateFile(viFile, apiKey, force)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
