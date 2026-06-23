# 2026-06-23 — Create Room: toggle "Tôi cũng chơi" (host plays)

> **Source**: User report — chủ phòng Speed Race không được tính điểm. Điều tra: trang "Tạo Phòng" (`POST /api/rooms`) mặc định `hostPlaysGame=false` → Quản trò không chơi; FE không gửi field nên host luôn bị loại khỏi scoring + leaderboard.
> **Scope**: FE-only (`apps/web`). Backend + lobby ĐÃ hỗ trợ `hostPlaysGame=true` sẵn (RoomController:88, RoomService overload, RoomLobby minNonHost). Chỉ thiếu UI opt-in.
> **Guard**: Toggle MẶC ĐỊNH TẮT → giữ nguyên hành vi Quản trò hiện tại (không phá luồng đa người chơi).

### Tasks

- HPT-1 Thêm `hostPlaysGame` vào formData + payload (default false)
  - Status: [x] DONE · Files: `apps/web/src/pages/CreateRoom.tsx` · Test: CreateRoom.test.tsx (test #16 default false, #17 toggle→true)
  - **Spec impact**: [x] SPEC_MULTIPLAYER (Quản trò §) — opt-in host-plays
  - **Spec strategy**: [x] (a) update inline (1 dòng note)
  - Checklist: impl · Tầng 1+2 pass · spec note · commit

- HPT-2 UI toggle trong Card 4 + cập nhật chip "Quản trò" theo state
  - Status: [x] DONE · Files: `apps/web/src/pages/CreateRoom.tsx`, `apps/web/src/i18n/{vi,en}.json` · Test: test #17 toggle aria-pressed + chip text · Tầng 3: 1388 pass (baseline 1277)
  - **Spec impact**: [x] SPEC_MULTIPLAYER
  - **Spec strategy**: [x] (a) update inline
  - Checklist: impl · i18n vi+en · Tầng 3 pass · commit

### Notes
- Backend đọc body `hostPlaysGame` (instanceof Boolean → else FALSE) nên gửi `false` an toàn = giữ default Quản trò.
- `handleSubmit` đã `{ ...formData }` → field tự vào payload, chỉ cần thêm vào state.
- Khi `hostPlaysGame=true`: host là RoomPlayer, lobby `minNonHost=1`, `isOrganizerMode=false` → host chơi như player thường. Đã verify trong RoomLobby.tsx.
