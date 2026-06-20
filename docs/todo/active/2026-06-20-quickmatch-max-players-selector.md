# 2026-06-20 — Quick Match: cho chọn số người chơi tối đa (bỏ hardcode 10)

> **Source**: User — "chế độ đấu nhanh max player được 10 người chơi thôi à". · **Scope**: QuickMatch modal + BE createQuickMatchRoom.

Hiện `RoomService.createQuickMatchRoom` hardcode `setMaxPlayers(10)`; modal Đấu Nhanh không có ô chọn. Phòng thường (CreateRoom) cho 2–100. Join cap chỉ dựa field `maxPlayers` (`room.isFull()`), nên nâng an toàn.

Quyết định (user 2026-06-20): **Thêm chips chọn trong modal** — 10 / 20 / 50 / 100, default 10.

### Tasks

- QMP-1 BE: `createQuickMatchRoom` nhận `maxPlayers` (default 10, clamp 2–100) + RoomController đọc/validate body
  - Status: [x] DONE · Files: `RoomService.java`, `RoomController.java` · Test: `RoomControllerTest`
  - **Spec impact**: [ ] SPEC_MULTIPLAYER (quick-match body) · **Spec strategy**: [ ] (a) update inline

- QMP-2 FE: ChipGroup maxPlayers trong QuickMatchConfigModal + `QuickMatchConfig.maxPlayers` + i18n
  - Status: [x] DONE · Files: `multiplayer/QuickMatchConfigModal.tsx`, `api/quickMatch.ts`, `i18n/vi.json`, `i18n/en.json` · Test: full FE regression
  - Chips [10,20,50,100], default 10; gửi kèm config. i18n no tăng count.
  - **Spec impact**: [ ] (gộp QMP-1) · **Spec strategy**: [ ] (a)
