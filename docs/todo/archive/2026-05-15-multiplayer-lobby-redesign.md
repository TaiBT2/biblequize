# 2026-05-15 — Multiplayer Lobby redesign theo `MOCKUP_MULTIPLAYER_LOBBY.html`

> **Source**: User request 2026-05-15 — "redesign lại theo MOCKUP_MULTIPLAYER_LOBBY.html". Mockup tại `docs/MULTIPLAYER/MOCKUP_MULTIPLAYER_LOBBY.html` (707 LOC).
>
> **Scope**: Redesign `/multiplayer` (`apps/web/src/pages/Multiplayer.tsx` — 713 LOC monolithic) sang structure mới: top header → hero row 3:2 → mode showcase → active rooms (empty + populated states). Giữ BE contract `/api/rooms/public` không đổi, giữ `data-testid` + i18n.
>
> **Decisions locked (2026-05-15)**:
> - Palette: dùng `pages/create-room/modeMeta.ts` (single source of truth, vừa ship cho Create Room) — KHÔNG churn lại
> - Icons: Material Symbols (giữ stack hiện tại) — translate Lucide names sang Material
> - "Tìm trận nhanh" button: HIDE Phase 1 (cần BE matchmaking)
> - Live activity ticker: HIDE Phase 1 (cần BE events endpoint)
> - Sidebar "Tuần này" widget: SKIP (sidebar shared, ngoài scope task này)
> - Sudden Death label: dùng tên mới **"Đấu vương"** (đã ship)
>
> **Status**: TODO

### Tasks

- MLR-1 FE: Extract RoomCard + EmptyState + AvatarStack vào `pages/multiplayer/`
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/multiplayer/RoomCard.tsx` (mới), `apps/web/src/pages/multiplayer/EmptyState.tsx` (mới), `apps/web/src/pages/multiplayer/AvatarStack.tsx` (mới), update `Multiplayer.tsx` imports
  - Refactor pure: tách 3 sub-component khỏi monolithic 713-LOC file. Visual KHÔNG đổi. CodeInput component giữ tạm trong Multiplayer.tsx (sẽ rewrite ở MLR-2).
  - Sau tách: Multiplayer.tsx ~ 400 LOC, mỗi sub-component < 200 LOC.
  - Test: Multiplayer.test.tsx 14 specs phải pass nguyên (visual chưa đổi).
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: extract + import update → Tầng 1+2 pass → commit ~150 LOC delta

- MLR-2 FE: Rewrite Multiplayer.tsx main page per mockup
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/Multiplayer.tsx`, có thể tạo `apps/web/src/pages/multiplayer/HeroCreateCard.tsx` + `HeroJoinCode.tsx` + `ModeShowcase.tsx` nếu cần
  - **Top header**: kicker "CHẾ ĐỘ ĐA NGƯỜI CHƠI" + live count với green pulse dot ("47 đang chơi · 8 phòng đang mở") + title H1 30px "Phòng chơi" + subtitle + "Bộ câu hỏi" button phải. Move "Tạo phòng mới" CTA xuống hero card (không còn ở header).
  - **Hero row** grid `cols-5` (3+2): LEFT card gold-tinted lớn "Tạo phòng & điều phối trận đấu" + chip 👑 "Bạn sẽ là Quản trò" + descrip + "Tạo phòng mới" button (giữ testid `multiplayer-create-btn`). RIGHT card glass "Tham gia phòng" với 6 input boxes 44×52 + "Vào phòng" button.
  - **Mode showcase**: section header "4 chế độ chơi" + link "Xem chi tiết luật chơi" + grid 4-col cards với tint từ `modeMeta`, mỗi card có Material icon (zap → bolt, swords → swords, users-round → groups, flame → local_fire_department) + name + desc + player range. Sudden Death dùng tên "Đấu vương".
  - **Active rooms section**: header "Phòng đang chờ" + green Live chip ("LIVE · N") + refresh/search icon buttons. **Filter chips**: All + 4 modes + divider + sort (Mới nhất / Sắp đầy). Giữ logic sort hiện tại nhưng đổi label "Mới" → "Mới nhất", giữ "Sắp đầy", drop "Khó" (replaced by mode filter).
  - **Empty state**: friendly với gold sparkles icon + "Hãy là phòng đầu tiên hôm nay!" + 4 quick-create button (one per mode, nav `/room/create?mode=X`).
  - Giữ tất cả testid + i18n keys hiện có. Đổi `MODE_CONFIG` inline thành import từ `pages/create-room/modeMeta.ts` (palette consistent).
  - Test: Multiplayer.test.tsx phải pass; có thể cập nhật text assertions cho label mới ("Tạo phòng" trong hero card thay vì header).
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: rewrite → Tầng 1+2+3 pass → commit ~300 LOC delta

- MLR-3 FE: RoomCard redesign per mockup
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/multiplayer/RoomCard.tsx`
  - Restructure: top row mode icon box (`tint-X` bg với border) + mode kicker uppercase + room title; mid row 👑 host + (optional group affiliation); bottom row avatar stack + capacity X/Y + meta "Q câu · Ts/câu"; CTA `gold-gradient` full-width "Tham gia →" (hoặc "Vào hàng đợi" cho Sudden Death, "Chọn đội" cho Team).
  - Team vs Team mode card có **mini 2-team display** (Đội A / Đội B với mini avatars) thay cho avatar stack đơn — Phase 2 (BE chưa trả team data per room). Phase 1: giữ avatar stack chung cho Team.
  - Test: Multiplayer.test.tsx text "Cựu Ước (39 sách)", "20 câu", "15s/câu" phải còn render được — có thể chuyển vị trí nhưng giữ text content.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: redesign → text assertions pass → commit ~150 LOC delta

### Out of scope (Phase 2 — task riêng)

- "Tìm trận nhanh" matchmaking — cần BE queue/MMR
- Live activity ticker — cần BE events
- Sidebar "Tuần này" widget — global sidebar, scope rộng hơn
- Mini 2-team display per room — cần BE trả team split data
- Mobile responsive tinh chỉnh sâu hơn — desktop-first focus
