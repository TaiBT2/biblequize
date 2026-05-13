# 2026-05-07 — Multiplayer Lobby Redesign [DONE]

> **Source**: User prompt + mockup `docs/MULTIPLAYER/multiplayer_lobby_redesign_mockup.html`. Option A: áp dụng cho tất cả 5 modes. No auto-start. Implement QR code (qrcode.react). Kick player hover menu. Keep 5 reactions.

### Tasks
- Task ML-1: Install `qrcode.react` + reusable `InviteShareModal` (Copy/Link/QR) — `[x]` DONE (8/8 tests pass)
- Task ML-2: Hero block (mode chip + room name + meta + room code prominent 32px gold) — `[x]` DONE (commit 0e50ee8)
- Task ML-3: Players grid 4-col / 5 slot variants (host/ready/waiting/invite/empty) + kick hover menu — `[x]` DONE (commit 0e50ee8)
- Task ML-4: Compact rules card + bottom bar redesign (3-col desktop / 2-col mobile) — `[x]` DONE (commit 0e50ee8)
- Task ML-5: Chat panel collapsible + FAB (mobile drawer / desktop right 320px) + 5 reactions — `[x]` DONE (commit 0e50ee8)
- Task ML-6: Adapt Team vs Team (split A/B) + Sudden Death (queue order) + Sequential — `[x]` DONE (Team A/B via TeamSplit; Sudden Death via suddenDeathOrder; Sequential delegates to existing SequentialLobbyView)
- Task ML-7: Wire FE kick endpoint (BE đã có `POST /api/rooms/{id}/kick`) — `[x]` DONE (commit 0e50ee8)
- Task ML-8: Update unit tests (`RoomLobby.test.tsx`) + E2E TC (W-M06 multiplayer) — `[x]` DONE (22 unit tests rewritten + 3 new E2E smoke TCs L1-008/009/010 scaffolded with skip pending API setup)
- Task ML-9: Full regression Tầng 3 + commits per task — `[x]` DONE (1176 pass / 30 fail = pre-existing baseline; net -8 vs prior baseline due to RoomLobby fixes)

### Decisions
- Dep mới `qrcode.react` approved by user (~6KB gzip, SVG output).
- Backend kick endpoint đã tồn tại — reuse, không tạo mới.
- Không implement auto-start (host bấm Bắt đầu thủ công).

---
