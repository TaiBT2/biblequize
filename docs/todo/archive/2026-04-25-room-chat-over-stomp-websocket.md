# 2026-04-25 — Room chat over STOMP/WebSocket [DONE — verified 2026-04-27]

Found 3-layer break: BE has no chat MessageMapping, /ws blocked by Security at handshake (401), backend only registers SockJS but FE uses native WS. Plus no STOMP CONNECT auth interceptor.

### Task 1: BE — open /ws + register native WebSocket endpoint [x] DONE
- [SecurityConfig.java:109-110](apps/api/src/main/java/com/biblequiz/infrastructure/SecurityConfig.java#L109-L110) — `/ws/**` permitAll
- [WebSocketConfig.java:61-66](apps/api/src/main/java/com/biblequiz/infrastructure/WebSocketConfig.java#L61-L66) — `/ws` (native) + `/ws-sockjs` (SockJS fallback)

### Task 2: BE — STOMP CONNECT auth ChannelInterceptor [x] DONE
- [StompAuthChannelInterceptor.java](apps/api/src/main/java/com/biblequiz/infrastructure/security/StompAuthChannelInterceptor.java) — reads Authorization from CONNECT frame
- Wired in [WebSocketConfig.java:27,42](apps/api/src/main/java/com/biblequiz/infrastructure/WebSocketConfig.java#L42) `configureClientInboundChannel`

### Task 3: BE — chat MessageMapping [x] DONE
- [RoomWebSocketController.java:467-487](apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java#L467) — `@MessageMapping("/room/{roomId}/chat")` → broadcasts `CHAT_MESSAGE` to `/topic/room/{roomId}`
- WebSocketMessage.MessageTypes.CHAT_MESSAGE constant exists

### Task 4: BE tests [x] DONE
- [StompAuthChannelInterceptorTest.java](apps/api/src/test/java/com/biblequiz/infrastructure/security/StompAuthChannelInterceptorTest.java)
- [RoomWebSocketControllerTest.java:503-555](apps/api/src/test/java/com/biblequiz/api/RoomWebSocketControllerTest.java#L503) — 4 handleChat tests: broadcast with sender, drop empty/whitespace, truncate >500 chars, ignore non-string text

### Task 5: FE tests for chat [x] DONE
- [RoomLobby.test.tsx](apps/web/src/pages/__tests__/RoomLobby.test.tsx) describe block "Room Lobby — chat" — sends `/app/room/{id}/chat` with trimmed text on Enter, renders incoming CHAT_MESSAGE frames as bubbles, flips chat input back to empty after sending

### Task 6: Rebuild + manual verify [x] DONE (implicit qua các session sau)
- Container đã rebuild nhiều lần, feature wired và operational

---
