/**
 * Head-tag dedupe for prerendered HTML (pure; jsdom only, no browser).
 *
 * React 19 hoists PageMeta's <title>/<meta>/<link> into <head> alongside the
 * static index.html defaults, leaving duplicate (+ empty) tags in non-
 * deterministic order. These helpers collapse them to one correct per-page tag.
 */
import { JSDOM } from 'jsdom'

export const keyOf = (el) => {
  const tag = el.tagName.toLowerCase()
  if (tag === 'title') return 'title'
  if (tag === 'meta' && el.getAttribute('name')) return `meta:name:${el.getAttribute('name')}`
  if (tag === 'meta' && el.getAttribute('property')) return `meta:prop:${el.getAttribute('property')}`
  return null
}

export const valueOf = (el) =>
  el.tagName.toLowerCase() === 'title' ? el.textContent.trim() : (el.getAttribute('content') || '').trim()

/** key -> static default value, parsed from the un-prerendered index.html shell. */
export function staticDefaults(shellHtml) {
  const map = {}
  for (const el of new JSDOM(shellHtml).window.document.head.children) {
    const key = keyOf(el)
    if (key && !(key in map)) map[key] = valueOf(el)
  }
  return map
}

/**
 * For each title / meta[name|property]: drop empties, and when duplicated keep
 * the value that DIFFERS from the static default (the per-page one). The
 * canonical is enforced deterministically per route (React's hoisting leaves a
 * stray empty <link rel="canonical">). Fonts/icons/JSON-LD/preloads are intact.
 */
export function dedupeHead(html, defaults, canonicalHref) {
  const dom = new JSDOM(html)
  const { document } = dom.window

  const byKey = new Map()
  for (const el of document.querySelectorAll('title, meta')) {
    const key = keyOf(el)
    if (!key) continue
    if (!valueOf(el)) { el.remove(); continue }
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key).push(el)
  }
  for (const [, els] of byKey) {
    if (els.length < 2) continue
    const perPage = els.filter((el) => valueOf(el) !== defaults[keyOf(el)])
    const keep = perPage.length ? perPage[perPage.length - 1] : els[0]
    for (const el of els) if (el !== keep) el.remove()
  }

  // Enforce exactly one canonical with the route's known href.
  for (const el of document.querySelectorAll('link[rel="canonical"]')) el.remove()
  const link = document.createElement('link')
  link.setAttribute('rel', 'canonical')
  link.setAttribute('href', canonicalHref)
  document.head.appendChild(link)

  return `<!doctype html>\n${document.documentElement.outerHTML}`
}
