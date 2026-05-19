# 2026-05-19 — HomeBanner "Mùa này" → "Đấu Hạng" + icon 🏆

> **Source**: User feedback — "sao tôi thấy điểm không giống trong leaderboard và icon để không hợp lý lắm"
> **Scope**: i18n label + HomeBanner icon. Pure clarity, không đổi data source.

## Root cause (Issue 1)

| Surface | Field | Source |
|---|---|---|
| HomeBanner "MÙA NÀY" | `rankedStatus.seasonPoints` | `SeasonRanking.totalPoints` — Đấu Hạng only |
| Leaderboard tab "Mùa" | `/api/leaderboard/season` | `UserDailyProgress` — tất cả modes |

→ Số khác nhau là đúng intent (ranked-only vs all-mode aggregate), nhưng label "MÙA NÀY" gợi ý hiểu lầm rằng nó phải khớp leaderboard. Decision: giữ data source, đổi label.

## Issue 2

Icon `📊` (bar chart) gợi analytics → đổi sang `🏆` trophy cho semantic ranking/achievement.

### Tasks

- HB-2 i18n `home.greeting.seasonPoints` → "Đấu Hạng" (vi) / "Ranked" (en)
  - Status: [x] DONE
  - Files: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`

- HB-3 Đổi icon `coin` → `trophy` (glyph `📊` → `🏆`) + rename type
  - Status: [x] DONE
  - Files: `apps/web/src/components/HomeBanner.tsx`
  - **Spec impact**: [x] None (label đã canonical per C2 "Đấu Hạng")
  - **Spec strategy**: [x] (c) [no-spec-impact]

## Checklist

- [x] HB-2 + HB-3 impl
- [x] HomeBanner 6/6 + Home 26/26 (32/32) pass
- [x] Tầng 3 full regression: 1254 pass (baseline 1212), 56 pre-existing fail unrelated
- [ ] Commit `fix(home-banner): rename "Mùa này" → "Đấu Hạng" + 🏆 icon [no-spec-impact]`
