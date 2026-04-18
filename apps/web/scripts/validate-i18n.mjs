#!/usr/bin/env node
/**
 * validate-i18n — two-part guard:
 *   (a) hardcoded-string detector: flags Vietnamese diacritics in
 *       .ts/.tsx files outside i18n/ and outside t('...') calls
 *   (b) missing-key detector: grep every t('...') and verify the key
 *       exists in both vi.json and en.json
 *
 * Exits 1 if any issue found. Intended for `npm run validate:i18n` and CI.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC_DIR = join(ROOT, 'src')
const VI = JSON.parse(readFileSync(join(SRC_DIR, 'i18n', 'vi.json'), 'utf8'))
const EN = JSON.parse(readFileSync(join(SRC_DIR, 'i18n', 'en.json'), 'utf8'))

const DIACRITIC_RE =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/
const T_CALL_RE = /\bt\(\s*(['"`])([^'"`]+?)\1/g
const T_CALL_STRIP_RE = /\bt\(\s*(['"`])[^'"`]+?\1[^)]*\)/g

const EXCLUDE_DIR_NAMES = new Set(['__tests__', 'i18n', 'node_modules', 'dist', 'build', 'test'])
const EXCLUDE_FILE_SUFFIX = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx', '.d.ts']
const EXCLUDE_FILE_NAMES = new Set(['setup.ts', 'i18n-test-utils.tsx'])

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (EXCLUDE_DIR_NAMES.has(entry)) continue
      walk(full, out)
    } else if (st.isFile()) {
      if (!/\.(ts|tsx)$/.test(entry)) continue
      if (EXCLUDE_FILE_SUFFIX.some(sfx => entry.endsWith(sfx))) continue
      if (EXCLUDE_FILE_NAMES.has(entry)) continue
      out.push(full)
    }
  }
  return out
}

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out)
    else out[path] = String(v ?? '')
  }
  return out
}

const FLAT_VI = flatten(VI)
const FLAT_EN = flatten(EN)

const files = walk(SRC_DIR)

const hardcoded = [] // { file, line, excerpt }
const missingKeys = [] // { file, line, key, inVi, inEn }

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/')
  const content = readFileSync(file, 'utf8')
  const stripped = content.replace(T_CALL_STRIP_RE, '__T_CALL__')
  const lines = stripped.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Skip import/require/type-only lines
    if (/^\s*(import|export)\s/.test(line)) continue
    if (DIACRITIC_RE.test(line)) {
      hardcoded.push({ file: rel, line: i + 1, excerpt: line.trim().slice(0, 140) })
    }
  }
  // Check every t('...') key
  const origLines = content.split('\n')
  for (let i = 0; i < origLines.length; i++) {
    const line = origLines[i]
    T_CALL_RE.lastIndex = 0
    let m
    while ((m = T_CALL_RE.exec(line)) !== null) {
      const key = m[2]
      if (key.includes('${') || key.includes('{')) continue // dynamic key — skip
      const inVi = key in FLAT_VI
      const inEn = key in FLAT_EN
      if (!inVi || !inEn) {
        missingKeys.push({ file: rel, line: i + 1, key, inVi, inEn })
      }
    }
  }
}

const summary = {
  filesScanned: files.length,
  hardcodedCount: hardcoded.length,
  missingKeyCount: missingKeys.length,
}

if (hardcoded.length) {
  console.log(`\nHardcoded Vietnamese strings (${hardcoded.length}):`)
  for (const h of hardcoded.slice(0, 200)) {
    console.log(`  ${h.file}:${h.line}  ${h.excerpt}`)
  }
  if (hardcoded.length > 200) console.log(`  ... +${hardcoded.length - 200} more`)
}

if (missingKeys.length) {
  console.log(`\nMissing i18n keys (${missingKeys.length}):`)
  for (const k of missingKeys.slice(0, 200)) {
    const tag = `[${k.inVi ? 'vi✓' : 'vi✗'}|${k.inEn ? 'en✓' : 'en✗'}]`
    console.log(`  ${k.file}:${k.line}  ${tag} ${k.key}`)
  }
  if (missingKeys.length > 200) console.log(`  ... +${missingKeys.length - 200} more`)
}

console.log('\nSummary:', JSON.stringify(summary))
if (hardcoded.length > 0 || missingKeys.length > 0) {
  process.exit(1)
}
process.exit(0)
