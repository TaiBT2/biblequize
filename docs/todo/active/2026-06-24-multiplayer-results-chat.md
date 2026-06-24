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

### Notes
- Send qua STOMP của RoomQuiz: `send('/app/room/{roomId}/chat', { text })` (giống lobby handleSendChat).
- onSend dùng chung cho cả emoji reactions + input (lobby pattern).
- isHost = `sender === hostName`. Capture cả system messages (join/leave).
- KHÔNG đổi BE — chat vẫn ephemeral; store chỉ giữ trong phiên client.
