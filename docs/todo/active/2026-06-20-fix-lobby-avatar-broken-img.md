# 2026-06-20 — Fix avatar lỗi ở Lobby multiplayer (preset/URL hỏng hiện alt text)

> **Source**: User screenshot — phòng lobby `/room/.../lobby`, card người chơi "TAI THANH" avatar vỡ (hiện alt text đè lên ô gradient). · **Scope**: `RoomLobby.tsx` PlayerCard avatar.

Nguyên nhân: PlayerCard render avatar bằng `<img src={player.avatarUrl}>` thô — KHÔNG đi qua `resolveAvatar`. Khi `avatarUrl` là `preset:<id>` (emoji) hoặc URL OAuth 404 → ảnh vỡ → browser hiện `alt` (tên user) đè lên nền gradient. Các surface khác (Leaderboard, Profile, UserDropdown) đều dùng `resolveAvatar` + onError fallback. SequentialLobbyView chỉ dùng chữ cái đầu nên không dính.

### Tasks

- LAV-1 Fix PlayerCard avatar dùng `resolveAvatar` (img/preset/initial) + onError fallback
  - Status: [x] DONE · Files: `pages/RoomLobby.tsx` · Test: `RoomLobby.test.tsx` (+3 avatar tests)
  - img-broken (404) → fallback chữ cái; preset → emoji; thiếu → chữ cái đầu. Bám pattern Leaderboard.tsx:180-191.
  - **Spec impact**: [ ] (c) [no-spec-impact] (bug fix, no behavior change ngoài render đúng)
  - **Spec strategy**: [x] (c)
  - Checklist: impl · Tầng 1+2+3 pass · commit
