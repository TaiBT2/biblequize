# 2026-05-15 — Multiplayer Lobby patch theo PROMPT_MULTIPLAYER_LOBBY_REDESIGN.md

> **Source**: User decision 2026-05-15 — đọc `docs/MULTIPLAYER/PROMPT_MULTIPLAYER_LOBBY_REDESIGN.md` (1548 LOC canonical prompt) sau khi đã ship MLR (commit `77165a9`). MLR không follow prompt; user chọn **patch** thay vì rewrite hoặc revert.
>
> **Scope**: Áp dụng các điểm khác biệt vs MLR vừa ship để match canonical prompt, nhưng GIỮ kiến trúc MLR (sub-components đã extract, `pages/multiplayer/` folder).
>
> **Status**: TODO

### Divergence cần patch (7 deltas)

| # | Aspect | MLR vừa ship | Canonical (prompt) |
|---|---|---|---|
| 1 | Palette | speed=#60a5fa, battle=#f87171, team=#4ade80, sudden=#c084fc | **speed=#38bdf8, battle=#ef4444, team=#a855f7, sudden=#fbbf24** (AMBER, không phải streak #fb923c) |
| 2 | Sudden Death icon | `workspace_premium` (crown) | **`target`** (crosshair) |
| 3 | Join code | RIGHT 2/5 glass card trong hero row | **Thin 56px bar ABOVE hero** |
| 4 | Hero row | 3/5 Tạo phòng + 2/5 Join code | **50/50 Tạo phòng (gold) + Solo Arena entry (indigo)** |
| 5 | Solo Arena | Không có | Entry card hero RIGHT + `/solo-arena` placeholder route |
| 6 | Sidebar widget | Skipped | `WeeklyMultiplayerStatsWidget` conditional render trên `/multiplayer*` |
| 7 | BE endpoint | None | `GET /api/users/me/multiplayer-stats?period=weekly` mới (service + DTO + tests) |

### Tasks

- MPP-1 FE: Update `modeMeta.ts` palette + icon (canonical match)
  - Status: [x] DONE
  - Files: `apps/web/src/pages/create-room/modeMeta.ts`
  - Đổi 4 color values: speed `#60a5fa` → `#38bdf8`, battle `#f87171` → `#ef4444`, team `#4ade80` → `#a855f7`, sudden `#c084fc` → `#fbbf24`. Đổi sudden icon `workspace_premium` → `target`. Update badge palette tương ứng. Update RGBA values trong tints/badges.
  - Test: 73 tests phải pass (palette change visual only, không touch logic). Visual diff manual.
  - **Spec impact**: [x] None (design token)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: edit 4 entries → tests pass → commit < 50 LOC

- MPP-2 BE: Endpoint `GET /api/me/multiplayer-stats?period=weekly`
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/modules/user/service/MultiplayerStatsService.java` (mới), `WeeklyMultiplayerStatsDTO.java` (mới), `UserController.java` (add endpoint), repository method update
  - Service compute từ `RoomPlayer.finalRank == 1` (win), aggregate `wins`, `totalMatches`, `winRate`, `mvpCount` (UserAchievement category MULTIPLAYER_MVP). Week start = Monday 00:00 UTC (match leaderboard).
  - Test: 4 JUnit cases — zero matches, mixed wins, week boundary, MVP join.
  - **Spec impact**: [x] SPEC_USER §27.2
  - **Spec strategy**: [x] (a) update inline
  - Checklist: service + DTO + controller + repo method + 4 tests → commit ~150 LOC

- MPP-3 FE: Join code thin bar + Solo Arena entry card + hero 50/50 layout
  - Status: [x] DONE
  - Files: `apps/web/src/pages/multiplayer/JoinByCodeBar.tsx` (mới, thin 56px bar variant), `apps/web/src/pages/multiplayer/SoloArenaEntryCard.tsx` (mới, indigo), `apps/web/src/pages/Multiplayer.tsx` (restructure hero)
  - Tạo `JoinByCodeBar` thin variant của `CodeInput`: gold-tinted bar height ~56px, label + 6 inputs nhỏ + button inline cùng row. Đặt ABOVE hero row.
  - Tạo `SoloArenaEntryCard` indigo `#6366f1` gradient với "NEW" badge shimmer + descrip + "Bắt đầu Solo" button. Click → `/solo-arena`.
  - Restructure Hero: bỏ JoinCode khỏi hero, thay bằng SoloArenaEntryCard. Hero giờ là 50/50 grid.
  - Test: 11 Multiplayer specs pass. Mobile responsive stack vertical.
  - **Spec impact**: [x] SPEC_MULTIPLAYER §7.1
  - **Spec strategy**: [x] (a) update inline
  - Checklist: 2 file mới + Multiplayer.tsx restructure → tests pass → commit ~250 LOC

- MPP-4 FE: `/solo-arena` placeholder route + Coming Soon page
  - Status: [x] DONE
  - Files: `apps/web/src/pages/SoloArenaPlaceholder.tsx` (mới), `apps/web/src/main.tsx` (route)
  - Coming Soon page: indigo gradient, "Solo Arena", subtitle "Sắp ra mắt", back-to-multiplayer button.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: 1 file mới + route → commit < 80 LOC

- MPP-5 FE: Sidebar `WeeklyMultiplayerStatsWidget` conditional render
  - Status: [x] DONE
  - Files: `apps/web/src/pages/multiplayer/WeeklyMultiplayerStatsWidget.tsx` (mới), `apps/web/src/api/users.ts` (add fetch fn nếu chưa có), `apps/web/src/layouts/AppLayout.tsx` (conditional insert)
  - Widget glass card với "TUẦN NÀY" sky-blue label + big wins number + win rate + MVP count. useQuery 60s staleTime, hide gracefully on error.
  - AppLayout: `useLocation()` → render widget chỉ khi `pathname.startsWith('/multiplayer')`.
  - **Spec impact**: [x] SPEC_USER §27.2 (refers to widget)
  - **Spec strategy**: [x] (a) update inline (BE endpoint spec đã ghi ở MPP-2)
  - Checklist: widget + conditional render → commit ~120 LOC

- MPP-6 FE: Empty state add Solo Arena soft-link
  - Status: [x] DONE
  - Files: `apps/web/src/pages/multiplayer/EmptyState.tsx`
  - Thêm divider + "Không có ai online?" + button "Thử Solo Arena → chơi 1 mình" với indigo accent. Click → `/solo-arena`.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: append section → commit < 30 LOC

- MPP-7 Docs: BACKLOG entries BL-MP-QM + BL-MP-SOLO + audit re-run
  - Status: [ ] TODO
  - Files: `docs/spec/BACKLOG.md`, `tools/spec-audit/REPORT.md` (auto)
  - Thêm 2 entries: BL-MP-QM (Quick Match deferred until DAU>200), BL-MP-SOLO (Solo Arena full impl scoped, separate prompt).
  - **Spec impact**: [x] BL-MP-QM, BL-MP-SOLO
  - **Spec strategy**: [x] (b) new BL-N entries
  - Checklist: append BACKLOG + audit clean → commit < 50 LOC

### Out of scope (đã defer per prompt §0.2)

- "Tìm trận nhanh" actual matchmaking → BL-MP-QM (chỉ ghi BACKLOG)
- Solo Arena full implementation → BL-MP-SOLO (chỉ ghi BACKLOG + placeholder)
- Live activity ticker → Sprint 6 (không tracker)
- File location refactor `pages/multiplayer/` → `components/multiplayer/` → SKIP để giảm churn (functional impact = 0)
