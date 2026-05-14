# 2026-05-14 — Home Redesign (Vintage Gamified) — Phase 1 Audit

> **Source**: User prompt 2026-05-14 + design files `docs/designs/biblequiz/` (Home.html + styles.css + 2 screenshots)
> **Scope**: Read-only audit để gate Phase 2 (UI rebuild). Direction "vintage gamified" — illuminated manuscript meets mobile-game chunkiness. Supersedes `2026-05-13-home-redesign-modern-spiritual` + `2026-05-05-home-redesign-theo-mockup-home-redesign-mockup-html` (per user decision 2026-05-14).
> **Status**: IN PROGRESS

### Tasks

- HRV-1 Typography audit — Yeseva One + JetBrains Mono availability
  - Status: `[x]` DONE · Files: `apps/web/index.html`, `apps/web/tailwind.config.js`, `apps/web/src/styles/global.css`, `docs/dev/design-system.md` · Test: N/A (audit report only)
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Investigation: grep cho `Yeseva` / `JetBrains` trong font load pipeline; check current font stack (Be Vietnam Pro? Cormorant Garamond đã load chưa từ HR sprint); xác định cần add deps Google Fonts hay không
  - Output: ghi vào audit report HRV-6 — status `[present|missing]` + remediation cost

- HRV-2 Token audit — vintage palette vs current shipped tokens
  - Status: `[x]` DONE · Files: `apps/web/tailwind.config.js`, `apps/web/src/styles/global.css` · Test: N/A
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Investigation: design tokens vintage = `--gold-bright #FFD56B` / `--ruby #C73E3E` / `--ruby-glow` / `--plum #8C5BB5` / `--emerald #4FA876` / chunky shadow `0 6px 0 0 <deep>`. Current shipped (HR-1) = `ivory` / `gold-deep` / `maroon` / `sage` / Cormorant Garamond. Map mỗi vintage token ↔ shipped (rename / new / overlap). Quyết keep-or-revert là **user decision sau audit**.
  - Output: bảng mapping vintage-token ↔ current-token + 3 options (keep-as-base / extend / revert)

- HRV-3 Modes audit — "Luyện tập / Chủ đề tuần / Mystery / Tốc độ" status
  - Status: `[x]` DONE · Files: `docs/spec/SPEC_USER_v3.1.md` §game modes, `apps/web/src/pages/`, BE Controller cho weekly/mystery/speed-round · Test: N/A
  - **Spec impact**: `[x]` None (audit) — Phase 2 sẽ quyết spec impact theo từng mode
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Investigation: grep route `/weekly-quiz` `/mystery-mode` `/speed-round` (file 2026-05-05 đã reference các route này); confirm với BE Controller; mode nào shipped (link to existing page) vs mode nào coming-soon (disabled card)
  - Output: bảng mode × {shipped, route, endpoint, gate (level/tier required)}

- HRV-4 Journey 66-book BE endpoint audit
  - Status: `[x]` DONE · Files: `apps/api/src/main/java/com/biblequiz/**/journey*`, `apps/api/src/main/java/com/biblequiz/**/book*` (Controller, Service, DTO) · Test: N/A
  - **Spec impact**: `[ ]` None hoặc `[ ]` SPEC_USER §Journey (xác định trong audit)
  - **Spec strategy**: `[ ]` (a)/(b)/(c) (quyết sau audit)
  - Investigation: grep `Journey` / `BookProgress` / `66 books` trong BE; endpoint trả book progress array? state mapping (current/locked/done)? FE đã có hook chưa? Nếu chưa có BE → ghi BL-N candidate cho Phase 2.
  - Output: endpoint contract (nếu có) hoặc BL-N entry candidate

- HRV-5 Current Home.tsx audit — data sources + reusable components
  - Status: `[x]` DONE · Files: `apps/web/src/pages/Home.tsx` (375 LOC), `apps/web/src/components/Home*.tsx`, `apps/web/src/components/Greeting*.tsx`, `apps/web/src/components/FeaturedDaily*.tsx` · Test: N/A
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Investigation: TanStack Query keys nào đang dùng (`/api/me`, `/tier-progress`, `/ranked-status`, `/daily-challenge`, etc.); list components reusable (HomeBanner, FeaturedDailyCard đã ship từ HR sprint — có dùng được không?); 375 LOC vượt 300 limit → cần split plan
  - Output: bảng query-key × hook × component + reuse-vs-rewrite recommendation

- HRV-6 Consolidated audit report + spec strategy recommendation cho Phase 2
  - Status: `[x]` DONE · Files: `apps/web/src/pages/__tests__/HOME_REDESIGN_VINTAGE_AUDIT.md` (NEW) · Test: N/A
  - **Spec impact**: `[ ]` None hoặc `[ ]` SPEC_USER §Home (xác định trong audit)
  - **Spec strategy**: `[ ]` (a)/(b)/(c) (quyết sau audit)
  - Investigation: tổng hợp HRV-1..HRV-5; recommend Phase 2 sub-task breakdown (mỗi task < 100 LOC, 1 commit/task); recommend keep-or-revert tokens HR-1; recommend i18n keys mới cần thêm; identify constraint conflicts đã chốt (C1 6-tier, C2 Đấu Hạng)
  - Output: 1 markdown report ≤ 200 lines + STOP gate chờ Bui duyệt trước Phase 2

### Constraint locks đã chốt (user decision 2026-05-14)

- **C1**: XP marks + rank chip dùng **VN 6-tier** (Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ / Hiền Triết / Tiên Tri / Sứ Đồ). KHÔNG English tier names.
- **C2**: Ranked CTA dùng "**Đấu Hạng**" (title + button + label). KHÔNG "Xếp hạng" / "Đấu trường" / "Vào trận".
- **C4**: Verse cite "BTTHĐ 2011" — design đã match ✓.

### Rules

- Phase 1 = **read-only audit**, KHÔNG sửa code production.
- Phase 1 chỉ commit 1 file mới (`HOME_REDESIGN_VINTAGE_AUDIT.md`) + cập nhật task file này.
- **STOP gate** sau HRV-6 — chờ user duyệt audit report mới sang Phase 2.
- Branch: `feat/home-redesign-vintage`.
