import { describe, it, expect } from 'vitest'
import vi from '../vi.json'
import en from '../en.json'

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[]
interface JsonObject { [key: string]: JsonValue }

function flatten(obj: JsonObject, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v as JsonObject, path))
    } else if (typeof v === 'string') {
      out[path] = v
    } else {
      out[path] = String(v)
    }
  }
  return out
}

const flatVi = flatten(vi as JsonObject)
const flatEn = flatten(en as JsonObject)

function interpolationVars(s: string): string[] {
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g
  const vars: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) vars.push(m[1])
  return vars.sort()
}

describe('i18n key parity (vi ↔ en)', () => {
  it('vi.json and en.json have identical key sets', () => {
    const viKeys = Object.keys(flatVi).sort()
    const enKeys = Object.keys(flatEn).sort()
    const missingInEn = viKeys.filter(k => !(k in flatEn))
    const missingInVi = enKeys.filter(k => !(k in flatVi))
    expect(missingInEn, `Keys present in vi.json but missing in en.json:\n${missingInEn.join('\n')}`).toEqual([])
    expect(missingInVi, `Keys present in en.json but missing in vi.json:\n${missingInVi.join('\n')}`).toEqual([])
  })

  it('vi.json has no empty or whitespace-only values', () => {
    const empties = Object.entries(flatVi).filter(([, v]) => !v || v.trim() === '')
    expect(empties, `Empty vi values:\n${empties.map(([k]) => k).join('\n')}`).toEqual([])
  })

  it('en.json has no empty or whitespace-only values', () => {
    const empties = Object.entries(flatEn).filter(([, v]) => !v || v.trim() === '')
    expect(empties, `Empty en values:\n${empties.map(([k]) => k).join('\n')}`).toEqual([])
  })

  it('interpolation variables match between vi and en for every shared key', () => {
    const mismatches: string[] = []
    for (const key of Object.keys(flatVi)) {
      if (!(key in flatEn)) continue
      const viVars = interpolationVars(flatVi[key])
      const enVars = interpolationVars(flatEn[key])
      if (viVars.join(',') !== enVars.join(',')) {
        mismatches.push(`${key}: vi=[${viVars.join(',')}] en=[${enVars.join(',')}]`)
      }
    }
    expect(mismatches, `Interpolation variable mismatches:\n${mismatches.join('\n')}`).toEqual([])
  })

  it('no value contains an unclosed interpolation like {{foo} or {foo}} (format sanity)', () => {
    const broken: string[] = []
    const check = (locale: string, flat: Record<string, string>) => {
      for (const [key, value] of Object.entries(flat)) {
        if (/\{\{[^}]*$/.test(value) || /^[^{]*\}\}/.test(value)) {
          broken.push(`${locale}.${key}: ${value}`)
        }
      }
    }
    check('vi', flatVi)
    check('en', flatEn)
    expect(broken, `Malformed interpolation:\n${broken.join('\n')}`).toEqual([])
  })
})
