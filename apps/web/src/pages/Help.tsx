import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { FAQ_CATEGORIES, FAQ_ITEMS, type FaqCategory } from '../data/faqData'

/**
 * /help — FAQ / self-service support page.
 *
 * <p>Users land here from the sidebar "Help" link, the user menu
 * dropdown, or a deep link on locked game-mode cards (e.g.
 * {@code /help#howUnlockRanked}). Rendered inside AppLayout so users
 * keep nav context.
 *
 * <h3>Behavior</h3>
 * <ul>
 *   <li>Items are grouped by category (see {@link FAQ_CATEGORIES}).</li>
 *   <li>Accordion-style: click a Q to expand/collapse its A.</li>
 *   <li>Category pills filter what's visible.</li>
 *   <li>Deep link {@code /help#<itemId>} auto-expands that item and
 *       smooth-scrolls to it.</li>
 *   <li>Only one item expanded at a time (reduces visual noise for
 *       long content).</li>
 * </ul>
 */
export default function Help() {
  const { t } = useTranslation()
  const location = useLocation()

  const [activeCategory, setActiveCategory] = useState<FaqCategory | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  // Deep link: /help#howUnlockRanked — expand + scroll to that item.
  // Runs once on mount + whenever the hash changes.
  useEffect(() => {
    const hash = location.hash.replace(/^#/, '')
    if (!hash) return
    const matching = FAQ_ITEMS.find((it) => it.id === hash)
    if (!matching) return
    setActiveCategory('all')
    setOpenId(hash)
    // Defer scroll so the accordion has rendered with the newly expanded state.
    requestAnimationFrame(() => {
      document.getElementById(`faq-${hash}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [location.hash])

  const visibleItems = useMemo(
    () =>
      activeCategory === 'all'
        ? FAQ_ITEMS
        : FAQ_ITEMS.filter((it) => it.category === activeCategory),
    [activeCategory],
  )

  return (
    <div data-testid="help-page" className="space-y-8">
      {/* ── Hero ── */}
      <section>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface mb-2">
          {t('help.title')}
        </h1>
        <p className="text-on-surface-variant">{t('help.subtitle')}</p>
      </section>

      {/* ── Category pills ── */}
      <section className="flex flex-wrap gap-2">
        <CategoryPill
          label={t('common.all', { defaultValue: 'Tất cả' })}
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />
        {FAQ_CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat}
            label={t(`help.categories.${cat}`)}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </section>

      {/* ── Q&A list (grouped by category when 'all') ── */}
      {activeCategory === 'all' ? (
        <div className="space-y-8">
          {FAQ_CATEGORIES.map((cat) => {
            const items = FAQ_ITEMS.filter((it) => it.category === cat)
            if (items.length === 0) return null
            return (
              <section key={cat} data-testid={`faq-category-${cat}`}>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-secondary mb-3">
                  {t(`help.categories.${cat}`)}
                </h2>
                <div className="space-y-2">
                  {items.map((it) => (
                    <FaqAccordion
                      key={it.id}
                      id={it.id}
                      open={openId === it.id}
                      onToggle={() => setOpenId(openId === it.id ? null : it.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleItems.map((it) => (
            <FaqAccordion
              key={it.id}
              id={it.id}
              open={openId === it.id}
              onToggle={() => setOpenId(openId === it.id ? null : it.id)}
            />
          ))}
          {visibleItems.length === 0 && (
            <p className="text-on-surface-variant text-sm">{t('help.emptyResult')}</p>
          )}
        </div>
      )}

      {/* ── Footer: contact hint ── */}
      <section className="mt-12 pt-6 border-t border-outline-variant/10 text-center">
        <p className="text-sm text-on-surface-variant">
          {t('help.contactHint')}{' '}
          <a
            href="mailto:support@biblequiz.app"
            className="font-bold text-secondary hover:underline"
          >
            {t('help.contactCta')}
          </a>
        </p>
      </section>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-colors ${
        active
          ? 'gold-gradient text-on-secondary shadow-md'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
      }`}
    >
      {label}
    </button>
  )
}

function FaqAccordion({
  id,
  open,
  onToggle,
}: {
  id: string
  open: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)

  return (
    <div
      id={`faq-${id}`}
      data-testid={`faq-item-${id}`}
      data-open={open ? 'true' : 'false'}
      className={`rounded-2xl border transition-all ${
        open
          ? 'bg-surface-container border-secondary/30'
          : 'bg-surface-container-low border-outline-variant/10 hover:border-outline-variant/30'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-bold text-on-surface flex-1">
          {t(`help.items.${id}.q`)}
        </span>
        <span
          className={`material-symbols-outlined text-on-surface-variant transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div ref={panelRef} className="px-5 pb-5 text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
          {t(`help.items.${id}.a`)}
        </div>
      )}
    </div>
  )
}
