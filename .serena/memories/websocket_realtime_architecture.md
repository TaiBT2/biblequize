# WebSocket / Realtime Architecture

> Single source of truth cho hệ thống realtime của BibleQuize. Đọc memory này
> trước khi sửa bất cứ thứ gì liên quan tới room events, chat, hoặc presence.

## TL;DR

- **Protocol stack**: STOMP-over-WebSocket (SockJS fallback) — không phải raw WS
- **Port**: **chung 8080 với REST API**, không tách port riêng
- **Endpoints**: `/ws` (native WS) + `/ws-sockjs` (SockJS long-polling fallback)
- **Auth**: JWT trong CONNECT headers, verify qua `JwtChannelInterceptor`
- **Broker**: in-memory `SimpleBroker` (chưa cluster qua Redis pub/sub — single instance)
- **Destinations**: `/topic/*` (broadcast), `/queue/*` (private user), `/app/*` (client→server)
- **DTO envelope**: `WebSocketMessage` typed `{type, payload}`
- **Rate limit**: Redis token bucket qua `WebSocketRateLimitInterceptor`
- **Public path resolved by FE**: `https://be.quize.top/ws` (prod), `http://localhost:8080/ws` (dev)

## Key files

| File | Vai trò |
|---|---|
| `apps/api/src/main/java/com/biblequiz/infrastructure/WebSocketConfig.java` | `@EnableWebSocketMessageBroker`, register `/ws` + `/ws-sockjs`, enable SimpleBroker `/topic /queue`, app prefix `/app` |
| `apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java` | `@MessageMapping` handlers cho room events (chat, ready toggle, host actions) |
| `apps/api/src/main/java/com/biblequiz/api/websocket/WebSocketMessage.java` | Typed envelope `{type, payload}` — mọi message broadcast dùng |
| `apps/api/src/main/java/com/biblequiz/infrastructure/security/WebSocketRateLimitInterceptor.java` | Token bucket 10 msg/s/user, Redis-backed |
| `apps/web/src/hooks/useStomp.ts` | FE client wrapper, auto-reconnect, JWT injection |

## Same-port architecture (important pitfall)

WebSocket KHÔNG có port riêng. Cùng `server.port=8080` (xem
`application.yml` + per-profile overrides). Lý do:

1. Spring Boot embed Tomcat handle HTTP/1.1 Upgrade tới WebSocket inline
2. 1 SSL cert, 1 nginx upstream, 1 firewall rule
3. Traffic chưa lớn cần tách (single instance prod)

**Nginx config (prod)** cần `Upgrade` + `Connection` headers cho location
`/ws*`, KHÔNG xài `proxy_buffering` (sẽ phá streaming):

```nginx
location /ws {
  proxy_pass http://biblequiz-api:8080;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_read_timeout 86400;  # 24h, ngăn idle disconnect
}
```

**Scale plan tương lai**: nếu muốn tách BE thành 2 services (REST 8080 +
WS 8081) → cần thay `SimpleBroker` bằng external broker (Redis pub/sub
hoặc RabbitMQ STOMP relay) để cross-node messaging. Hiện chưa cần.

## Endpoint matrix (port 8080)

| Path | Loại | Note |
|---|---|---|
| `/api/**` | REST HTTP/JSON | Bearer token |
| `/ws` | Native WebSocket | HTTP/1.1 Upgrade → STOMP frames |
| `/ws-sockjs/**` | SockJS fallback | Long-polling, htmlfile, eventsource — khi WS bị block (corp firewall, cafe wifi) |

## STOMP destinations

- `/topic/room/{roomId}` — broadcast room events tới all subscribers
- `/topic/lobby/public` — public room list updates
- `/queue/user/{userId}/**` — private notification (kick, host changed, etc.)
- `/app/room/{roomId}/chat` — client gửi chat message
- `/app/room/{roomId}/ready` — toggle ready state
- `/app/room/{roomId}/host/*` — host control actions (pause, skip, broadcast)

## WebSocketMessage envelope

Mọi server → client broadcast đi qua DTO:
```java
public class WebSocketMessage {
  String type;       // ROOM_STATE | QUESTION_START | CHAT_MESSAGE | HOST_CHANGED | etc.
  Object payload;
}
```

FE pattern: switch trên `type` để route handler. Đừng thêm event type mới
mà không update FE switch + SPEC_MULTIPLAYER §6 (STOMP event catalog).

## Auth flow

1. Client `CONNECT` frame có header `Authorization: Bearer <JWT>`
2. `JwtChannelInterceptor` (extends `ChannelInterceptor`) trong
   `configureClientInboundChannel` parse JWT → set `Principal` cho session
3. Sau đó mọi `SEND` / `SUBSCRIBE` đều có user context qua `Principal`
4. Nếu JWT invalid → CONNECT bị reject với ERROR frame, client retry sau

Xem: `WebSocketSecurityConfig.java` (nếu tồn tại) hoặc bean
`ChannelInterceptor` trong `WebSocketConfig`.

## Rate limit

`WebSocketRateLimitInterceptor` — Redis-backed token bucket:
- Default: 10 msg/s per user
- Key: `ws:ratelimit:{userId}`
- Excess message → STOMP ERROR frame `RATE_LIMIT_EXCEEDED`
- Áp dụng cho SEND, không áp dụng SUBSCRIBE

## FE client setup (`hooks/useStomp.ts`)

```typescript
const client = new Client({
  webSocketFactory: () => new SockJS(import.meta.env.VITE_API_URL + '/ws-sockjs'),
  connectHeaders: { Authorization: `Bearer ${token}` },
  reconnectDelay: 5000,
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000,
})
```

- Auto-reconnect 5s
- Heartbeat 10s (cả 2 chiều) — server detect dead connection
- Token refresh: nếu 401 trên REST → refresh + force `client.deactivate()`
  rồi reactivate với JWT mới

## Realtime feature inventory (2026-05-15)

| Feature | STOMP destination | Status |
|---|---|---|
| Room chat | `/app/room/{id}/chat` → `/topic/room/{id}` | ✅ Shipped (TODO archive 2026-04-25) |
| Room state sync (player join/leave/ready) | `/topic/room/{id}` ROOM_STATE | ✅ Core |
| Question lifecycle (START/END) | `/topic/room/{id}` QUESTION_START/END | ✅ Core |
| Sudden Death match overlay | `/topic/room/{id}` SUDDEN_DEATH_MATCH | ✅ V17 |
| Host control (pause/skip/broadcast/end-early) | `/app/room/{id}/host/*` | ✅ Sprint 4 |
| Host changed (R4 cleanup) | `/queue/user/{id}` HOST_CHANGED | ✅ SPEC §5.4.0 |
| Group LiveNow banner | `/topic/lobby/public` LIVE_ROOM_BROADCAST | ✅ |
| Live activity ticker (mockup §Activity) | TBD | ❌ Defer Sprint 6 |
| Quick Match auto-start when 2 ready | `/topic/room/{id}` QUICK_MATCH_READY (planned) | ⏳ BL-MP-QM |

## Pitfalls (sửa = ăn hành)

1. **`useWebSocket.ts` đã bị xoá 2026-05-13 (BL-15)** — KHÔNG resurrect, chỉ dùng `useStomp.ts`
2. **CORS headers cho `/ws`**: phải set `allowed-origins` trong `WebSocketConfig.registerStompEndpoints`, không phải `application.yml` CORS config (đó là cho HTTP REST). Sai ở đây = WS connect fail nhưng REST vẫn chạy → khó debug.
3. **SimpleBroker không persist messages**: nếu BE restart, client mất state, phải re-subscribe + fetch room state qua REST. KHÔNG dùng STOMP cho durable events.
4. **No cross-node messaging**: deploy thêm BE instance mà chưa swap sang Redis broker → message gửi từ node A KHÔNG đến subscriber ở node B. Currently single-instance prod, an toàn.
5. **JWT refresh mid-session**: khi token expire (1h), client phải reconnect — không có cơ chế swap JWT trong session đang live. FE `useStomp` detect 401 → re-CONNECT.
6. **Mobile (Expo) WS proxy**: native WebSocket không qua nginx host-header nên test local mobile cần override `VITE_API_URL` (ngrok/tunnel), không phải `localhost`.

## References

- [SPEC_MULTIPLAYER.md](docs/spec/SPEC_MULTIPLAYER.md) §6 — STOMP event catalog (canonical)
- [SPEC_USER_v3.1.md](docs/spec/SPEC_USER_v3.1.md) — JWT auth flow
- [TODO archive 2026-04-25](docs/todo/archive/2026-04-25-room-chat-over-stomp-websocket.md) — chat implementation history
