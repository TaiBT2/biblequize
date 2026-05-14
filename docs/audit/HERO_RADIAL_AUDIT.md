# Hero Đấu Hạng — Radial Glow Redesign Audit

> **Sprint:** Variant 02 (Radial Glow) per `hero_dau_hang_variants.html`
> **Branch:** `chore/code-quality-improvements`
> **Date:** 2026-05-14
> **Scope:** Frontend visual only — no logic, copy, or conditional changes

---

## A-1 · Hero component location

Single source — no duplicates:

- File: [apps/web/src/components/HeroRankedCard.tsx](../../apps/web/src/components/HeroRankedCard.tsx) (197 lines)
- Mounted in: [apps/web/src/pages/Home.tsx](../../apps/web/src/pages/Home.tsx) (rendered only when `dailyDone === true` in State B flow)
- Test file: [apps/web/src/components/__tests__/HeroRankedCard.test.tsx](../../apps/web/src/components/__tests__/HeroRankedCard.test.tsx) (6 specs)

Other matches for "Đấu Hạng" / "Vào trận" — NOT the hero, do not touch:
- `i18n/vi.json` — translation key value (BL-4 fix)
- `RankedStandardCard.tsx` — State A standard card (different visual treatment)
- `Ranked.test.tsx` — tests `Đấu Hạng` header text on /ranked page
- `TournamentDetail.tsx` — tournament UI uses "Vào trận"

---

## A-2 · Current source review

**Component name:** `HeroRankedCard` (default export, function component, named props).

**Class system:** Tailwind utility classes + inline `style={{}}` for complex multi-stop gradients (codebase pattern shared with FeaturedDailyCard, HomeBanner — jsdom can't parse multi-layer `background:` shorthand cleanly so layers are split into wrapper + overlay div).

**Current background (line 51-55):**
```tsx
style={{
  background: 'linear-gradient(135deg, #e8a832 0%, #c98a1c 55%, #7a5818 100%)',
  boxShadow: '0 18px 50px -10px rgba(232,168,50,0.30), 0 0 0 1px rgba(232,168,50,0.4), inset 0 1px 0 rgba(255,220,140,0.4)',
}}
```
+ overlay `<div data-testid="hero-ranked-card-highlight">` with radial highlight at 30%/0% (line 57-66).

**Cross icon:** Inline SVG (200×200 viewBox) in `<svg data-testid="hero-ranked-card-ornament">` lines 72-119 — Variant B from `hero_ornament_options.html`. Includes 8+8 sunburst rays + inner halo + cross path + center decoration. Color `#1a1208` (dark) at opacity 0.14.

**Container element:** Single `<div role="button">` with `relative overflow-hidden rounded-[20px] p-6 md:p-8 mb-3.5`.

**Inner grid:** `grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:gap-7` — content left, CTA button right (stacks on mobile).

**Heading "Đấu Hạng":** `<h2>` text-26/34px font-extrabold tracking-[-0.035em], color `#1a1208` (dark on gold), text-shadow `0 1px 0 rgba(255,220,140,0.4)`.

**Eyebrow:** `text-[10px] font-bold tracking-[0.22em] uppercase`, color `rgba(26,18,8,0.7)`.

**Tagline:** `text-[13px] font-medium`, color `rgba(26,18,8,0.75)`.

**Meta row stats:** 14px line SVG icons, text `rgba(26,18,8,0.8)`.

**CTA "Vào trận":** Dark button `#1a1208` bg, gold `#e8a832` text, `rounded-xl px-5 md:px-6 py-3 md:py-3.5`, `box-shadow: 0 6px 18px rgba(26,18,8,0.4), inset 0 1px 0 rgba(232,168,50,0.15)` — per spec C-DESIGN-5 KEEP unchanged.

---

## A-3 · Design tokens inventory

[apps/web/tailwind.config.js](../../apps/web/tailwind.config.js):

### Existing gold + glass tokens
| Token | Hex | Usage |
|---|---|---|
| `secondary` | `#e8a832` | Primary gold — buttons, accents, current code uses `text-secondary` |
| `tertiary` | `#e7c268` | Gold light — meta chips, gradients |
| `gold-deep` | `#c98a1c` | Gold mid — gradient stop |
| `gold-shadow` | `#7a5818` | Gold dark — gradient stop |
| `ivory` | `#f5f0e6` | Default warm text |
| `ivory-dim` | `#b8b1a3` | Muted text |
| `ivory-faint` | `#6e6a60` | Tertiary text |
| `maroon` | `#7c2d3a` | Daily card accent |
| `sage` | `#4a6b52` | Completed strip accent |

NO existing token for `gold-radial-glow` or per-component radial recipe.

### Tokens to ADD (proposed)
Per spec heading uses `#f4d178` (brighter than tertiary `#e7c268`) and cross uses cream `#fff5dc`. Both are 1-of-1 uses on this hero. Two viable paths:

| Path | Approach | Pros | Cons |
|---|---|---|---|
| **A** — Add 2 tokens | `gold-bright: '#f4d178'` + `gold-cream: '#fff5dc'` in `tailwind.config.js` | Per C-DESIGN-3, "no hardcoded hex if codebase has token system" | New tokens used by 1 component only |
| **B** — Inline hex on this card | Use `style={{ color: '#f4d178' }}` + `style={{ color: '#fff5dc' }}` | Localized, doesn't pollute global namespace | Bends C-DESIGN-3 |

**Recommendation:** Path A — add the 2 tokens. Codebase precedent: HR-1 added 7 hero-specific tokens (ivory family, gold-deep, maroon, sage) for HomeBanner / VerseFooter — same pattern.

The radial gradient itself stays inline `style={{ background: '...' }}` since multi-stop radial syntax doesn't fit Tailwind utilities cleanly — same convention as the existing 3 hero-style cards.

---

## A-4 · Card border-radius inventory (Home page surface)

| Component | Border-radius | Notes |
|---|---|---|
| **HomeBanner** | `rounded-[22px]` | Largest container — main banner |
| **HeroRankedCard** (current) | `rounded-[20px]` | Hero — sits between Banner and Journey weight |
| **BibleJourneyCard** | `rounded-[18px]` | Journey full-width container |
| **FeaturedDailyCard** | `rounded-2xl` (= 16px) | Standard featured |
| **DailyMissionsCard** | `rounded-2xl` (= 16px) | Standard featured |
| **RankedStandardCard** | `rounded-2xl` (= 16px) | Standard mode card |
| **DailyCompletedStrip** | `rounded-[14px]` | Thin pill, smaller scale |
| **CompactCard** | `rounded-xl` (= 12px) | Smallest tile |

Tailwind config: `rounded-2xl = 1rem = 16px`, `rounded-3xl = 1.5rem = 24px` — no built-in `20px`.

**Decision:** **Keep `rounded-[20px]`** on the hero. Rationale:
- Sits between HomeBanner (22px) and Journey (18px) — visual weight tier matches
- Spec line says "dự kiến `20px` / `rounded-2xl`" — these are different (20 ≠ 16), and the existing hero radius is already 20px. Aligning to 16px (`rounded-2xl`) would shrink the hero to look like a regular featured card, undermining its hero status.
- No 2 cards on Home share an identical radius — there's no single "system" value. The cards form a 5-tier scale (12 → 14 → 16 → 18/20 → 22) where weight follows hierarchy.

If Bui wants strict hierarchy unification (e.g. all hero-tier cards = `22px` to match Banner), flag in checkpoint review.

---

## A-5 · Responsive breakpoints + radial behavior plan

Tailwind defaults active in this codebase (no custom screens override): `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`.

Hero uses `md` as the primary breakpoint:
- `<md` (≤767px) — single-column grid; CTA stacks UNDER content (full-width); ornament SVG `hidden md:block`.
- `≥md` (≥768px) — 2-col grid `[1fr_auto]`; CTA right; ornament visible at `right-[220px]`.

### Radial-glow position plan

| Breakpoint | Strategy | Background recipe |
|---|---|---|
| Desktop ≥768px | Radial centered RIGHT | `radial-gradient(ellipse at 100% 50%, gold@0.35 0%, gold@0.12 35%, transparent 65%)` + `rgba(50,52,64,0.5)` glass base |
| Mobile <768px | Radial centered BOTTOM (since CTA stacks below) | `radial-gradient(ellipse at 50% 100%, gold@0.35 0%, gold@0.12 35%, transparent 65%)` + same glass base |

Implementation: a single CSS variable `--hero-radial-pos` would be cleanest, but for parity with existing hero pattern, render TWO overlay layers or use inline `style` keyed off `window.matchMedia` is overkill. Simplest: write the desktop recipe inline + a Tailwind `md:` utility with the desktop variant. Default (mobile) uses the `50% 100%` recipe; desktop overrides. Achieved with a small CSS rule in `global.css` using `@media (min-width: 768px)` OR using two layered overlay divs (`block md:hidden` for mobile glow, `hidden md:block` for desktop glow).

**Recommendation:** Two overlay divs (consistent with how `hero-ranked-card-highlight` is already split out — pattern: separate radial layer from base glass layer for jsdom compat + responsive control).

Cross icon (existing ornament) sits at `right-[220px]` which on desktop falls INSIDE the right-anchored radial glow — exactly the "cross as light source" intent. On mobile the ornament is hidden so the bottom-anchored glow stands alone.

---

## A-6 · Acceptance reconciliation (preview)

| Spec line | Current state | Action in Phase 2 |
|---|---|---|
| Background not full gold gradient | Currently full gold linear-gradient | Replace with glass base + radial gold overlay |
| Radial glow from right, fade left | Highlight overlay at 30%/0% (top-left) | Move to 100% 50% (right-center) |
| Cross cream, opacity ~0.18 | Cross color `#1a1208` opacity `0.14` (dark on gold) | Change to `gold-cream #fff5dc` opacity `0.18` (light on glass) |
| Heading text-shadow glow | text-shadow `0 1px 0 rgba(255,220,140,0.4)` (dark emboss) | Replace with `0 0 24px rgba(232,168,50,0.3)` (gold glow) + color `#f4d178` |
| Eyebrow + tagline + meta keep | Currently dark-on-gold | Switch to ivory family — current dark colors won't read on glass dark base |
| CTA unchanged | Dark button + gold text | KEEP exact |
| Border radius matches | `rounded-[20px]` | KEEP — see A-4 |
| Backdrop blur 12px | NOT present (full gold currently) | ADD `backdrop-filter: blur(12px)` |
| Border `1px solid rgba(232,168,50,0.15)` | Box-shadow `0 0 0 1px rgba(232,168,50,0.4)` (thicker, more gold) | Soften per spec |
| No inline hex if tokens exist | Inline hex in 6+ places | Add 2 tokens (`gold-bright`, `gold-cream`); inline gradient styles stay (multi-stop radial doesn't fit utilities) |

### Light-color shift on inner text

Spec preserves "tagline + eyebrow + meta colors GIỮ NGUYÊN" — but current values are dark-on-gold (`rgba(26,18,8,0.7-0.8)`). On the new glass-dark base, these will be invisible. **This is a spec ambiguity.** Most likely intent: keep the *role* (eyebrow muted, tagline soft, meta soft) but adapt color to read on dark glass. Proposal:
- Eyebrow → `text-ivory-dim` (was dark muted)
- Tagline → `text-ivory-dim` (was dark muted)
- Meta text → `text-ivory-dim` (was dark)
- Meta icons → `text-secondary` (gold) — explicit per spec

Bui to confirm at Checkpoint 1.

---

## A-7 · Test impact

[HeroRankedCard.test.tsx](../../apps/web/src/components/__tests__/HeroRankedCard.test.tsx) — 6 specs:
1. Renders title "Đấu Hạng" + default label/tagline — **PASS** (text unchanged)
2. Custom label/tagline overrides — **PASS** (logic unchanged)
3. CTA fires onEnter — **PASS** (CTA unchanged)
4. Energy + ranked progress numbers — **PASS** (text unchanged)
5. **`uses gold-gradient background style`** — currently asserts inline style contains `linear-gradient` + `#e8a832` on the card and `radial-gradient` on the highlight overlay. **WILL NEED UPDATE** since the new bg is glass + radial overlay (not linear-gradient on card root).
6. Card-body click triggers onEnter — **PASS** (handler unchanged)

Plan: rewrite spec #5 to assert the new structure — base layer carries glass `rgba(50,52,64...)` + radial overlay carries `radial-gradient` with `100% 50%` position.

---

## A-8 · Open questions for Checkpoint 1

1. **Inner text color shift on dark glass** — spec says "GIỮ NGUYÊN" but values are dark-on-gold (invisible on new dark base). Proposed: switch to ivory-dim family. Confirm or correct.
2. **Tokens path** — add `gold-bright` (#f4d178) + `gold-cream` (#fff5dc) to `tailwind.config.js`? (Recommended path A above.)
3. **Border radius** — keep `rounded-[20px]` (current, between Banner 22 and Journey 18) or unify to 22px to match Banner?
4. **Cross icon repositioning** — current `right-[220px]` works for radial center at `100% 50%`. Move closer to right edge (e.g. `right-[40px]`) so cross sits AT the brightest radial point? Or keep current geometry?
5. **CTA anchoring on mobile** — radial moves to `50% 100%` on mobile so the glow halos the (stacked) CTA from below. Confirm this reading vs alternatives.

---

## Phase 2 plan preview (post-approval)

1. Add 2 tokens to `tailwind.config.js` — `gold-bright`, `gold-cream`
2. Edit [HeroRankedCard.tsx](../../apps/web/src/components/HeroRankedCard.tsx):
   - Replace card root `background` → glass `rgba(50,52,64,0.5)` + `border 1px rgba(232,168,50,0.15)` + `backdrop-filter: blur(12px)`
   - Replace highlight overlay → desktop `radial-gradient(ellipse at 100% 50%, ...)` + mobile `at 50% 100%` variant (two overlay divs, responsive)
   - Cross ornament: color `gold-cream`, opacity `0.18`, simplify (drop the dark-on-gold variant)
   - Heading: color `gold-bright`, text-shadow gold glow
   - Inner text: switch dark colors → ivory-dim family
   - Meta icons: explicit `text-secondary`
   - CTA: untouched
3. Update HeroRankedCard.test.tsx spec #5 — assert glass base + radial overlay shape
4. Build pass + 6/6 tests pass
5. Commit `feat(home): radial glow hero for Đấu Hạng (V2 design)`

---

*Audit by Claude · Bui review before Phase 2.*
