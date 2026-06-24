# 2026-06-24 — Multiplayer: chat ở màn kết quả (giữ lịch sử)

> **Source**: User — màn kết quả multiplayer cần có chat để mọi người thảo luận tiếp, GIỮ được cuộc trò chuyện trước đó (từ lobby).
> **Scope quyết định**: Lobby + Màn kết quả (KHÔNG chat trong lúc chơi). Lịch sử preserved.
> **Phát hiện**: chat sống trong local state của `RoomLobby` → mất khi điều hướng Lobby→Quiz→Results. Cần store chia sẻ (Zustand) keyed theo roomId. Backend chat ephemeral (STOMP `/app/room/{id}/chat` → `/topic/room/{id}` CHAT_MESSAGE) — KHÔNG đổi BE.

### Tasks

- MPC-1 Tạo `store/roomChatStore.ts` (Zustand, messagesByRoom keyed, append + cap 200)
  - Status: [x] DONE · Files: `apps/web/src/store/roomChatStore.ts` (mới) · Test: store unit test
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- MPC-2 Tách component chat dùng chung → `components/multiplayer/RoomChat.tsx`
  - Status: [x] DONE · Files: `components/multiplayer/RoomChat.tsx` (mới: ChatMessage, QUICK_EMOJIS, ChatBody, ChatReactionsRow, ChatInputRow, ChatPanel, ChatDrawer, ChatViewProps), `pages/RoomLobby.tsx` (import thay vì define) · Test: Tầng 3 + RoomLobby.test.tsx pass
  - **Spec impact**: [x] None (refactor) · **Spec strategy**: [x] (c) [no-spec-impact]

- MPC-3 RoomLobby mirror message → store (giữ UI lobby nguyên)
  - Status: [x] DONE · Files: `pages/RoomLobby.tsx` (append store trong CHAT_MESSAGE handler) · Test: RoomLobby.test.tsx pass
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c)

- MPC-4 ResultsChat + wire RoomQuiz (capture CHAT_MESSAGE → store, render trên podium/sequential-final)
  - Status: [x] DONE · Files: `components/multiplayer/ResultsChat.tsx` (mới: FAB + ChatDrawer + store), `pages/RoomQuiz.tsx` (CHAT_MESSAGE case + render ResultsChat khi showPodium) · Test: ResultsChat render test
  - **Spec impact**: [x] SPEC_MULTIPLAYER (chat khả dụng ở results) · **Spec strategy**: [x] (a) note

- MPC-5 Tests + Tầng 3 regression
  - Status: [x] DONE · Test: store + ResultsChat + full web vitest ≥ baseline

### Fix follow-up
- MPC-6 (2026-06-24): nút chat FAB bị che — QuizEndScreen là `fixed inset-0 z-50`, FAB cũ z-40 → nâng FAB lên `z-[60]`. Drawer (z-50, render sau QuizEndScreen) hiện đúng nhờ DOM order.

### Persist (reload không mất chat) — user chọn "Redis bền nhất"
- MPC-7 BE: lưu chat vào Redis + endpoint replay
  - Status: [x] DONE · Files: `RoomStateService` (appendChat/getChatHistory, key `room:chat:`, cap 200, TTL 12h, KHÔNG xóa ở clearRoomState), `RoomWebSocketController` (persist trong handleChat + broadcastSystemChat), `RoomController` (`GET /api/rooms/{id}/chat`)
  - **Spec impact**: [x] SPEC_MULTIPLAYER · **Spec strategy**: [x] (a)
- MPC-8 FE: hydrate store từ server khi mount/reload
  - Status: [x] DONE · Files: `store/roomChatStore.ts` (setMessages), `hooks/useRoomChatHistory.ts` (mới), `pages/RoomLobby.tsx` (đọc store thay local state + welcome; gọi hook), `pages/RoomQuiz.tsx` (gọi hook)
  - **Spec impact**: [x] (cover MPC-7) · **Spec strategy**: [x] (c)
- MPC-9 Tests: roomChatStore.setMessages + useRoomChatHistory + Tầng 3 (1406 pass clean run)
  - Status: [x] DONE

### Notes
- Send qua STOMP của RoomQuiz: `send('/app/room/{roomId}/chat', { text })` (giống lobby handleSendChat).
- onSend dùng chung cho cả emoji reactions + input (lobby pattern).
- isHost = `sender === hostName`. Capture cả system messages (join/leave).
- KHÔNG đổi BE — chat vẫn ephemeral; store chỉ giữ trong phiên client.
