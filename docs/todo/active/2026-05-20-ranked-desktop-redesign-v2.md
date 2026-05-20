# 2026-05-20 — Ranked intro DESKTOP redesign v2 (mockup_ranked_desktop_v2.html)

> **Source**: User mockup `docs/mockups/mockup_ranked_desktop_v2.html` (632 LOC HTML). Tiếp tục từ slim mobile redesign 2026-05-20 morning — desktop iteration với app shell sidebar + 2-col Stats+Action + Hero tier combined + Season 2-col.
> **User constraint**: Giữ quyết định cũ — **KHÔNG có book scope dropdown** (mockup có "Toàn Kinh Thánh ▼" nhưng user confirm bỏ). Chỉ implement phần khác.
> **Scope**: `apps/web/src/pages/Ranked.tsx` + components trong `apps/web/src/components/ranked/`. AppLayout sidebar **không đụng** (giữ widgets hiện tại). Mobile (< md) fallback layout em đã ship sáng nay.

## Mockup → Implementation matrix

| Mockup section | Hiện tại | Sau v2 |
|---|---|---|
| Sidebar widgets (Bạn bè / Streak freeze / Verse) | LeaderboardRank + Season + WinRate + WeekCombo | **Giữ nguyên** (out of scope task này) |
| Page header | Title plain + subtitle + text link "Cách chơi" | Title `Đấu **Hạng**` (italic Cormorant Garamond) + subtitle dài hơn + bordered pill "Cách chơi →" |
| Hero tier | 3-element TierProgressCard (badge + stars + next text + bar) | **Combined card**: tier badge + stars trái · "Đích tiếp theo" + next tier (italic gold) + "Còn N XP" phải · bar foot dưới |
| Energy + 3-stat | Energy full-width + 3-col grid bên dưới | Trong cùng "Stats card": Energy phía trên + 3-cell ministats với border-right divider (desktop md+); mobile vẫn 3 grid cells |
| CTA position | `RankedActionFooter` fixed bottom | **Action card** inline cạnh Stats (md+) — eyebrow "BẮT ĐẦU TRẬN ĐẤU" + title `Sẵn sàng *leo hạng*?` italic + helper + CTA inline + sub "~N câu với năng lượng hiện có". Mobile (<md) vẫn fixed footer |
| Season card | 1-col text + 2 sub-stat cards stacked | **2-col grid**: trái text dài (name + meta `· Bonus ×1.5` + prize + progress bar `Còn N điểm`) · phải 2 sub-cards (Hạng mùa + Điểm mùa) + leaderboard link bên dưới |

### Tasks

- DESKTOP-1 Page header restyle — italic "Hạng" + bordered "Cách chơi" pill
  - Status: [x] DONE
  - Files: `apps/web/src/components/ranked/RankedHeader.tsx`
  - Italic Cormorant Garamond cho "Hạng" (font already loaded via google fonts trong global). Subtitle expand thành "Cạnh tranh điểm số mỗi ngày — leo tier, vào BXH mùa". Cách chơi link đổi thành bordered pill với `arrow_forward` icon.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- DESKTOP-2 Hero tier combined card
  - Status: [x] DONE
  - Files: `apps/web/src/components/ranked/TierProgressCard.tsx`
  - Restructure thành 2-col top row (tier badge + stars trái, target text phải) + bar foot dưới. Italic gold Cormorant cho `nextTier.name`. Help "?" icon bên cạnh stars cho tooltip về 5-star tier system.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- DESKTOP-3 Stats + Action 2-col layout
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Ranked.tsx` + `apps/web/src/components/ranked/RankedActionFooter.tsx` (rework thành inline Action card)
  - Md+ breakpoint: grid 2-col 1.55fr/1fr — Stats card chứa Energy + 3-mini-stats; Action card chứa CTA + helper. Mobile (<md): stack vertical, CTA vẫn dùng fixed footer (RankedActionFooter giữ behavior cũ trên mobile).
  - Drop book scope dropdown (per user constraint).
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- DESKTOP-4 Stats card composite (Energy + 3-mini-stats with dividers md+)
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Ranked.tsx` + có thể restructure `EnergyCard` / `RankedStreakCard` / `DailyStatsCards` để compose thành 1 card duy nhất
  - Mobile: giữ 3 cards riêng + Energy ở trên (như đang ship). Desktop: gộp tất cả vào 1 card có 2 section (Energy section trên có border-bottom, 3-mini section dưới có border-right giữa cells).
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

- DESKTOP-5 Season card 2-col layout
  - Status: [x] DONE
  - Files: `apps/web/src/components/ranked/SeasonCard.tsx`
  - Md+ breakpoint: grid 1.4fr/1fr — trái text (season name + meta inline với dot separator + prize text + progress bar `Còn N điểm`) · phải 2 sub-cards stacked + leaderboard link. Mobile (<md): giữ stack layout em vừa ship sáng nay.
  - Bonus `×1.5` chip trong meta row khi liturgical season active.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

### Out of scope

- Sidebar widget swap (Bạn bè / Streak freeze / Verse) — affect AppLayout shared module. Tách task riêng.
- Book scope dropdown — per user constraint 2026-05-20 (đã chốt bỏ).
- Mobile redesign — giữ layout em vừa ship sáng nay (matches earlier user mockup).
