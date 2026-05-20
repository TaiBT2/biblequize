# 2026-05-20 — Multiplayer page i18n (Phòng Chơi + sidebar widget)

> **Source**: User screenshot 2026-05-20 — locale=EN nhưng page hiển thị mixed VN/EN ("Create Room" + "Tạo phòng đa người chơi" ở cùng card; sidebar "TUẦN NÀY" stays VN).
> **Scope**: `apps/web/src/pages/Multiplayer.tsx` + 9 components trong `multiplayer/` + `WeeklyMultiplayerStatsWidget` sidebar. FE only.
> **Status**: TODO

### Tasks

- MP-1 Add i18n keys to vi.json + en.json (`multiplayer.*` extended namespace + `header.weeklyStats.*` for sidebar)
- MP-2 Multiplayer.tsx — header + hero card copy + filter chips + fallback states (~34 VN lines)
- MP-3 QuickMatchEntryCard.tsx (~15 lines)
- MP-4 JoinByCodeBar.tsx + CodeInput.tsx (~11 lines)
- MP-5 RoomCard.tsx + QuickMatchRoomCard.tsx + AvatarStack.tsx + EmptyState.tsx (~50 lines)
- MP-6 WeeklyMultiplayerStatsWidget.tsx — sidebar "TUẦN NÀY" widget (~8 lines)
- MP-7 QuickMatchConfigModal.tsx (~25 lines)
- MP-8 Validate + regression — `npm run validate:i18n` baseline preserved, vitest pass

### Out of scope (defer)
- Mode display labels (`Speed Race`, `Battle Royale`, `Team vs Team`, `Đấu vương`) — proper names per C2 lock, keep as-is.
- Active room data (room.name, host.name) — user content, not localized.
