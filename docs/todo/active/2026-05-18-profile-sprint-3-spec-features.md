# 2026-05-18 — Profile Sprint 3: SPEC §21.1 catch-up (BE-ready features)

> **Source**: Profile audit 2026-05-18 — P2 missing spec features per `SPEC_USER_v3.1.md §21.1` "Avatar + name + tier badge + frame (cosmetic) + prestige icon ... Bible Journey progress (66 sách) ... Bookmarks tab".
> **Scope**: Add 2 features whose BE endpoints already exist. Bookmarks deferred (BE controller missing). Tier ETA real-data + Settings sections also deferred (separate sprints).

### Tasks

- PRO-S3-1 Bible Journey card (SPEC §21.1 — 66 sách progress)
  - New component `apps/web/src/components/profile/BibleJourneyCard.tsx`
  - Use `GET /api/me/journey` → render summary stats + 66 book grid grouped by OLD/NEW testament
  - Status indicators: COMPLETED (green) / IN_PROGRESS (gold) / LOCKED (muted)
  - Click LOCKED book → no-op; click IN_PROGRESS / COMPLETED → navigate to /practice?book=
  - Status: [x] DONE
  - Files: new `BibleJourneyCard.tsx` + `types.ts` (add JourneyResponse types) + `Profile.tsx` (import + render) + `i18n/vi.json` + `i18n/en.json`
  - Commit: `feat: Profile Bible Journey card (SPEC §21.1) [no-spec-impact]`

- PRO-S3-2 Cosmetic frame on hero avatar (SPEC §21.1 — "frame (cosmetic)")
  - Use `GET /api/me/cosmetics` → `activeFrame` (e.g. `frame_tier3`)
  - Map 6 tier frame IDs to ring styles (color + glow + thickness) — reuse tier `colorHex` from `data/tiers.ts`
  - Replace HeroCompact avatar `border-[3px] border-secondary/40` with tier-aware frame
  - Status: [x] DONE
  - Files: `HeroCompact.tsx` + `types.ts` (add CosmeticResponse) + small fetch hook OR pass from Profile.tsx
  - Commit: `feat: Profile hero avatar cosmetic frame (SPEC §21.1) [no-spec-impact]`

### Deferred (BL track)

- BL-PRO-A: Bookmarks tab — entity + repo tồn tại (`Bookmark.java`, `BookmarkRepository.java`) nhưng thiếu Controller endpoint `GET/POST/DELETE /api/me/bookmarks`. BE work needed first.
- BL-PRO-B: Tier ETA real average XP/day — cần BE expose `averageXpPerDayLast7d` qua `/api/me/tier-progress`. Hiện UI dùng heuristic `currentStreak * 20`.
- BL-PRO-C: Settings sections (Notifications / Privacy / Legal / About) — UI surface lớn, separate sprint sau.

### Common

- **Spec impact**: [x] None — these are SPEC catch-up implementations (FE catches up to BE+spec).
- **Spec strategy**: [x] (c) [no-spec-impact] for each commit (no spec edit needed — features already canonical).
- **Test**: Tầng 3 — pass count không giảm. Profile test 10/10.
