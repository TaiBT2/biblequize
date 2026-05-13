# 2026-05-10 — Fix: Quản trò mất isHost sau WS ROOM_STATE event [DONE]

> **Bug**: Trong organizer mode (`hostPlaysGame=false`), sau event WS ROOM_STATE đầu tiên, host UI chuyển từ "BẮT ĐẦU TRẬN ĐẤU" sang "Sẵn sàng" (bấm không tác dụng).
>
> **Root cause**: `RoomDetailsDTO.myUserId` là per-viewer field nhưng nằm trong broadcast snapshot. `broadcastRoomState()` gọi `getRoomDetails(id, null)` → `myUserId=null` → FE `setRoom(msg.data)` ghi đè `myUserId` của REST. Trong organizer mode host không có trong `room.players` → fallback `isHost` cần `room.myUserId === room.hostId` → false.
>
> **Strategy**: Tách concern — bỏ `myUserId` khỏi DTO (room state = pure shared), FE đọc từ `authStore` (single source of truth cho identity).

### Tasks

- Task QT-1: BE bỏ `myUserId` khỏi `RoomDetailsDTO` + REST trả `viewerUserId` ngoài DTO
  - Status: `[x]` DONE · Files: `RoomService.java`, `RoomController.java` · Test: `RoomServiceTest`, `RoomControllerTest`
  - **Spec impact**: `[x]` SPEC_MULTIPLAYER §STOMP events ROOM_STATE payload schema
  - **Spec strategy**: `[x]` (a) update inline
  - Checklist: impl · Tầng 1+2+3 pass · spec updated · `audit.sh` no NEW broken · commit

- Task QT-2: FE bỏ `room.myUserId`, dùng helper từ `authStore`
  - Status: `[x]` DONE · Files: `RoomLobby.tsx`, `RoomQuiz.tsx` (nếu có), tests · Test: Vitest
  - **Spec impact**: `[x]` None (refactor nội bộ)
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · commit

- Task QT-3: Regression test "WS ROOM_STATE không làm mất isHost của Quản trò"
  - Status: `[x]` DONE · Files: `RoomLobby.test.tsx` · Test: 1 test mới
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: test fail trước fix → pass sau fix · commit

- Task QT-4: Update SPEC_MULTIPLAYER §STOMP events
  - Status: `[x]` DONE · Files: `docs/spec/SPEC_MULTIPLAYER.md`
  - **Spec impact**: `[x]` SPEC_MULTIPLAYER §STOMP events
  - **Spec strategy**: `[x]` (a) update inline
  - Checklist: doc updated · `audit.sh` no NEW broken · commit `docs: update SPEC_MULTIPLAYER §...`

- Task QT-5: Tầng 3 full regression + manual smoke
  - Status: `[x]` DONE · Test: Vitest + Playwright + JUnit ≥ baseline
  - Manual: tạo Quản trò room → 2 player join + ready → host vẫn thấy "BẮT ĐẦU TRẬN ĐẤU" sau WS event
  - Checklist: ALL PASS · cập nhật TODO.md DONE

---
