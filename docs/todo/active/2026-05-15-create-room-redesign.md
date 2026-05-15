# 2026-05-15 — Create Room redesign theo `create_room_redesign.html`

> **Source**: User request 2026-05-15 — "page tạo phòng tôi muốn redesign lại theo create_room_redesign.html". Mockup tại `docs/MULTIPLAYER/create_room_redesign.html` (1188 LOC HTML+CSS+JS).
>
> **Scope**: Redesign `/room/create` (`apps/web/src/pages/CreateRoom.tsx`) sang 2-column layout với sticky preview panel bên phải. Giữ nguyên hành vi BE (POST `/api/rooms`), giữ tất cả `data-testid` cho E2E, giữ i18n keys.
>
> **Status**: TODO

### Mockup highlights vs current

| Aspect | Current (487 LOC, 1-col max-w-560) | Mockup (2-col max-w-1280) |
|---|---|---|
| Layout | Single column, form fills full width | LEFT (1.55fr) settings + RIGHT (1fr) sticky preview |
| Top bar | Plain back link | Back btn + "Quản trò" host chip (right) |
| Title | Centered with `🎮` emoji | H1 + gradient icon (44×44) + subtitle PL 58 |
| Cards | Hidden separators, single `glass-card` form | 4 distinct cards (`rgba(50,52,64,0.4)` + blur + r-18) |
| Mode cards | 4-col tall (h-140) with top accent bar | 4-col compact with color-tinted bg + check top-right |
| Source picker | 2-card with icon stack | 2-col wide segmented tabs (icon + title + sub) |
| Set picker | Plain list with check | Card style (42×42 icon + name + meta + check) |
| Settings | 2-col grid, plain pills | 2×2 grid, chip-group containers + select-chip + estimate line |
| Public | Gold/green pill toggle | Lozenge switch with sliding knob (42×24) |
| Advanced | Slider (max players) | Same content, behind `<details>` chevron |
| CTA | Gold full-width at form bottom | Inside preview footer + warning line if no set |
| Preview | NONE | Sticky panel: mode badge + room name + stats 2×2 + info rows |

### Tasks

- CRR-1 FE: Extract mode metadata + create PreviewPanel sub-component
  - Status: [x] DONE
  - Files: `apps/web/src/pages/create-room/modeMeta.ts` (new), `apps/web/src/pages/create-room/PreviewPanel.tsx` (new)
  - `modeMeta.ts` exports per-mode `{ icon, label, color, badgeBg, badgeColor, badgeBorder }` cho 4 modes (SPEED_RACE/BATTLE_ROYALE/TEAM_VS_TEAM/SUDDEN_DEATH), match màu mockup (#60a5fa speed, #f87171 survival, #4ade80 team, #c084fc sudden).
  - `PreviewPanel.tsx` (~130 LOC): nhận props `{ roomName, mode, questionCount, timePerQuestion, difficulty, bookScopeLabel, isPublic, questionSource, setName, setCount, onSubmit, submitting, canSubmit, missingSetReason }` → render sticky card với header mode-badge + body stats grid + info rows + warning + CTA. Estimate phút = ceil(questionCount * timePerQuestion / 60).
  - Test: Vitest mount với mock props, snapshot.
  - **Spec impact**: [x] None (UI redesign — behavior unchanged)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: 2 file mới → unit test → commit < 200 LOC

- CRR-2 FE: Rewrite `CreateRoom.tsx` với 2-col layout + 4 cards mockup style
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/CreateRoom.tsx`
  - Cấu trúc mới: container max-w-1280 → topbar (back + host-chip) → title block → main grid 2-col → LEFT (4 cards: Name+Mode, Source+Set, Settings, Privacy+Advanced) + RIGHT (sticky `<PreviewPanel>`).
  - Cards style: `bg-[rgba(50,52,64,0.4)] backdrop-blur border-white/06 rounded-[18px] p-[22px_24px]`.
  - Mode grid: 4-col compact, mỗi card có `--mc` color CSS variable, active = border + shadow + check icon top-right.
  - Source: segmented 2-col tab thay vì stacked cards.
  - Settings: chip-group containers cho Q count / difficulty / time + select-chip cho book scope + blue estimate-line.
  - Toggle switch lozenge style.
  - CTA chuyển từ form bottom → trong PreviewPanel footer.
  - Giữ tất cả `data-testid` hiện có (`create-room-page`, `create-room-organizer-hint` → đổi sang host-chip giữ testid, `create-room-name-input`, `create-room-mode-select`, `question-source-select`, `create-room-submit-btn`).
  - Giữ i18n keys hiện có; mockup hardcoded VN strings chỉ dùng cho design reference.
  - Mobile responsive: < 1024px stack 1 column (preview xuống dưới).
  - Test: Playwright `tests/e2e/create-room*.spec.ts` phải pass nguyên.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: rewrite → Tầng 1+2+3 pass (CreateRoom.test.tsx 15 tests) → commit. File có thể > 300 LOC nhưng đã extract PreviewPanel ra rồi nên CreateRoom ~280 LOC OK.

- CRR-3 FE: Polish + visual regression check
  - Status: [ ] TODO
  - Files: tinkering trong 2 file trên
  - Mobile breakpoint test, focus states, hover transitions, disabled CTA state khi CUSTOM source thiếu set, error banner location (giờ trong PreviewPanel hay LEFT card?).
  - Run Playwright e2e + Vitest baseline check.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: visual check + e2e pass → commit < 50 LOC

### Out of scope

- Backend API changes — `POST /api/rooms` payload không đổi.
- Mockup toolbar (variant switcher) chỉ để review, không port sang prod.
- Mobile native (Expo RN) — desktop web only.
