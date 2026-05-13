# PROMPT: Audit Multiplayer Flow End-to-End

> Mục tiêu: Trace toàn bộ user journey từ lúc user click "Thi Đấu" / "Multiplayer" cho đến khi câu hỏi đầu tiên hiện ra, identify mọi friction point, missing UX state, và inconsistency giữa frontend ↔ backend ↔ WebSocket events.
>
> **Verification-first:** KHÔNG được assume. Phải grep/read actual code và quote line numbers cho mọi finding. Nếu không tìm thấy file/component được nhắc đến — note rõ "FILE NOT FOUND" thay vì đoán.
>
> **Output:** Một file `MULTIPLAYER_AUDIT_REPORT.md` lưu tại repo root.

---

## Scope — Files cần đọc

### Frontend (apps/web/src/)

Bắt đầu bằng grep để map tất cả files liên quan, sau đó đọc:

```
pages/Multiplayer.tsx              ← Entry point, browse rooms
pages/CreateRoom.tsx               ← Form tạo phòng
pages/room/RoomLobby.tsx           ← Lobby trước khi start
pages/room/RoomQuiz.tsx            ← Gameplay
pages/room/RoomOverlays.tsx        ← Overlays (đã extract)
hooks/useWebSocket.ts              ← STOMP client
api/rooms.ts (hoặc tương tự)       ← REST calls
store/roomStore.ts (nếu có)
```

### Backend (apps/api/src/main/java/com/biblequiz/)

```
modules/room/api/RoomController.java
modules/room/service/RoomService.java
modules/room/service/*Engine.java          ← Speed Race, Battle Royale, Team, Sudden Death
modules/room/entity/Room.java + Player
modules/room/dto/*
infrastructure/WebSocketConfig.java
infrastructure/security/WebSocketRateLimitInterceptor.java
```

### Tests (để hiểu expected behavior)

```
apps/web/src/pages/__tests__/CreateRoom.test.tsx
apps/web/src/pages/room/__tests__/* (nếu có)
apps/api/src/test/java/.../room/*
```

---

## Audit Phases — 6 phases

Mỗi phase trả lời cụ thể các câu hỏi dưới. Format câu trả lời: **Quote line numbers** + brief explanation. Không paraphrase chung chung.

---

### Phase 1 — Room Discovery (Multiplayer page)

User vào trang Multiplayer. Họ thấy gì? Đường vào tạo phòng / join phòng như thế nào?

1. Layout của `Multiplayer.tsx` — list public rooms? quick-match button? create-room CTA? Cái nào prominent nhất?
2. Public rooms list lấy từ API nào? Có polling/WebSocket update real-time không, hay phải refresh thủ công?
3. Empty state khi không có public room nào — hiện gì?
4. Loading state khi đang fetch — skeleton hay spinner hay blank?
5. Error state khi API fail — handled không?
6. Có "Recent rooms" / "Rooms my friends are in" / suggestion gì không?
7. Mobile layout — có responsive không, bottom CTA có sticky không?

**Pain point check:** User mới mở trang lần đầu — họ có biết phải làm gì tiếp không? Hay phải scroll/đoán?

---

### Phase 2 — Room Creation (CreateRoom page)

1. **Số lượng field user phải điền/chọn:** liệt kê TẤT CẢ inputs (mode, count, time/câu, difficulty, sách, visibility, max players, ...). Mỗi field có default sensible không?
2. **Mode selection UX:** 4 modes (Speed Race / Battle Royale / Team / Sudden Death) — có description rõ ràng cho mỗi mode không? User mới có hiểu khác biệt không? So sánh với SPEC_USER_v3 §5.4.
3. **Defaults vs SPEC:** Đối chiếu với SPEC §5.4.1-5.4.4:
   - Speed Race default: 15 câu, 30s, max 4
   - Battle Royale: 20 câu, 20s, max 8
   - Team: 15 câu, 30s, max 8
   - Sudden Death: 20 câu, 15s, max 8
   Code có match không? Khi user đổi mode, defaults có auto-update không hay giữ nguyên?
4. **Validation:** Field nào required? Submit button có disable khi invalid không? Error message hiển thị ở đâu?
5. **Submit flow:** POST `/api/rooms` → response → navigate đi đâu? Có loading state không? Optimistic update?
6. **Sau khi tạo phòng:** user thấy room code ở đâu? Cách share link/QR — có không? Auto copy clipboard?
7. **Cancel/back:** có confirm "Bạn chắc chắn?" khi user gõ form rồi back không?

**Pain point check:** Đếm số click + form fields user phải tương tác từ "Multiplayer page" → "đã ở trong lobby". Quá nhiều?

---

### Phase 3 — Lobby Wait (RoomLobby page)

Đây là phase nghi ngờ nhất "không chuyên nghiệp" — focus kỹ.

1. **Layout lobby:** Quote screen-by-screen — header có gì (room code, mode badge, settings)? Player list ở đâu? Chat? Host controls?
2. **Player list:**
   - Khi player join → animation/sound/notification cho người đang ở trong lobby?
   - Avatar + name + ready status hiển thị thế nào?
   - Empty slots hiển thị thế nào (placeholder card hay chỉ trống)?
   - Có hiển thị "đang chờ X người nữa..." không?
3. **Ready system:**
   - Có ready button hay không?
   - Nếu có: host phải đợi tất cả ready mới start được? Hay start bất kỳ lúc nào?
   - Nếu không: SPEC §5.4 có định nghĩa rõ ready/start flow không? (Check `ready` event trong `/room/{roomId}` channel)
4. **Host controls:**
   - Kick player — UI ở đâu, có confirm không?
   - Edit settings sau khi tạo phòng — được không?
   - Start button — disable khi nào (min players, all ready)?
5. **Player invite:**
   - Có invite link/QR/share button không?
   - Copy room code — có toast confirm không?
6. **Chat:**
   - Có chat trong lobby không?
   - Rate limit (10/min per spec) hiển thị thế nào khi user spam?
7. **WebSocket connection state:**
   - Khi WS chưa connect / disconnect → user thấy gì? Loading? Error banner? Hay UI giả như đã connect?
   - Reconnect logic — có visible feedback không?
8. **Room state sync:**
   - Player A join → player B (đã trong lobby) có thấy ngay không? Có delay không?
   - Có race condition nào: ví dụ 2 người đồng thời join slot cuối cùng?
9. **Idle behavior:**
   - Spec nói `ROOM_IDLE_TIMEOUT_MIN = 30` — frontend có warning trước khi timeout không?
   - Tab background — vẫn nhận updates không?
10. **Leave flow:** click leave → confirm? Animation? Có thông báo cho host không?

**Pain point check:** Nếu chỉ có 1 người trong lobby, họ phải làm gì? Trang có guide họ share code không? Hay chỉ ngồi nhìn empty list?

---

### Phase 4 — Game Start Transition

Đây là moment chuyển từ lobby → quiz. Thường rất bug.

1. **Host click "Bắt đầu" → chuyện gì xảy ra?**
   - Có countdown 3-2-1 không? Hay yank thẳng vào câu 1?
   - Backend `POST /api/rooms/{id}/start` → broadcast event gì → frontend reaction?
2. **Loading state:**
   - Trong khoảnh khắc giữa "click start" và "câu 1 hiện ra" — user thấy gì? Blank screen? Spinner? Cinematic transition?
3. **Sync giữa các player:**
   - Tất cả player có thấy câu 1 cùng lúc không? Hay người mạng nhanh thấy trước?
   - Có "sync wait" để đợi tất cả ack không?
4. **Player join muộn:**
   - Nếu player join sau khi host đã start → behavior gì? Reject? Auto-redirect? Error message?
5. **Disconnect ngay khi start:**
   - WS drop trong giây đầu tiên — họ vẫn vào được game không? Có rejoin được không?
6. **Animation/sound:**
   - Có sound effect "game start" không (theo SPEC §8 sound list)?
   - Haptic mobile?

**Pain point check:** Compare với Kahoot/Quizizz — họ có 5-second countdown + sound + animation. Code mình có gì?

---

### Phase 5 — First Question Render (RoomQuiz initial state)

1. **First render:** câu 1 hiện ra cùng với gì? Question text + options + timer + scoreboard? Order/animation?
2. **Timer start:** timer bắt đầu countdown từ moment nào — server-sent timestamp hay client-side `Date.now()`? (Critical cho fairness)
3. **Player who joined late:** nếu reconnect sau 5s vào câu 1 — timer của họ có bị "lệch" so với người khác không?
4. **WebSocket events received:** liệt kê các events mà RoomQuiz handler — `question`, `answer_result`, `round_end`, `player_eliminated`, etc. (theo SPEC §16.3). Tất cả handlers đều có?
5. **State management:** Local state vs WebSocket state — có conflict không? Ví dụ user click answer trước khi server confirm — UI optimistic hay wait?

---

### Phase 6 — Edge Cases & Error Handling

Liệt kê và đánh giá UX cho mỗi case:

1. Room code invalid / không tồn tại → user thấy gì khi paste sai code?
2. Room đã full → message gì?
3. Room đã started, user join → redirect đâu?
4. User bị kick → modal? toast? redirect?
5. Host disconnect trong lobby → ai thành host mới? Có promote logic không?
6. Host disconnect trong game → game tiếp tục hay end?
7. Last player leave → room auto-cancel?
8. Network drop → reconnect grace period 60s (SPEC §5.4.5) — frontend có countdown UI không?
9. Backend crash / 500 error → user thấy gì? Có retry?
10. Permissions: user không đủ tier để join mode → message gì? (Battle Royale yêu cầu Tier 3, etc.)

---

## Deliverable — MULTIPLAYER_AUDIT_REPORT.md

Cấu trúc bắt buộc:

```markdown
# Multiplayer Flow Audit Report

## Executive Summary
- Top 5 critical issues (1-line each)
- Severity rating: 🔴 Critical / 🟡 Major / 🟢 Minor
- Estimated user drop-off points

## Phase 1: Room Discovery
### Findings
- [Issue title] (severity)
  - File: `path/to/file.tsx:123-145`
  - Current behavior: ...
  - Why it's a problem: ...
  - Suggested fix (high-level): ...
### What's working well
- ...

## Phase 2: Room Creation
[same structure]

## Phase 3: Lobby Wait
[same structure — DETAILED, this is the suspected pain area]

## Phase 4: Game Start Transition
[same structure]

## Phase 5: First Question Render
[same structure]

## Phase 6: Edge Cases
[same structure — table format OK]

## State Diagram
ASCII or mermaid diagram of:
- Frontend route transitions
- Backend room status transitions (LOBBY → IN_PROGRESS → ENDED)
- WebSocket event timeline (host start → all players see Q1)

## Frontend ↔ Backend ↔ WebSocket Inconsistencies
Liệt kê các trường hợp 3 bên không đồng bộ — ví dụ FE expect event `game_start` nhưng BE chỉ broadcast `room_state`.

## Comparison with SPEC_USER_v3
Bảng đối chiếu — feature/behavior nào trong SPEC §5.4 mà code KHÔNG implement, hoặc implement khác spec.

## Comparison with industry standards (Kahoot/Quizizz pattern)
- Countdown before start: ❓
- Player join animation: ❓
- Pre-game lobby music/ambience: ❓
- Real-time player counter: ❓
- "Waiting for X more players" CTA: ❓
- Host transfer on disconnect: ❓

## Prioritized Fix List
| # | Issue | Severity | Effort | Phase |
|---|-------|----------|--------|-------|
| 1 | ... | 🔴 | S/M/L | ... |

## Files Touched (for context)
List of all files read during audit + LOC.
```

---

## Rules cho Claude Code khi audit

1. **KHÔNG fix gì cả** — chỉ audit và report.
2. **KHÔNG tạo mockup** — chỉ analyze.
3. **Quote line numbers** cho mọi claim. Không quote = không count.
4. **Nếu file không tồn tại / function không tìm thấy** — note "NOT FOUND" thay vì assume.
5. **Test files cũng đọc** để hiểu expected behavior.
6. **Backend ↔ Frontend mismatch** là focus area — events, payload shapes, status codes.
7. **Dấu hiệu silent failure** (catch + ignore, fallback without log) — note rõ.
8. **Check tất cả 4 game modes** — không chỉ Speed Race. Mỗi mode có thể có UX khác nhau.
9. **Mobile responsiveness** — quote Tailwind breakpoints, viewport handling.
10. **Stop sau khi tạo report** — confirm với Bui trước khi đề xuất fix.

---

## Bonus — Nếu thời gian cho phép

Sau khi xong main report, ghi thêm section "Quick Wins" — top 5 fixes có thể làm dưới 1 commit mỗi cái mà cải thiện UX rõ rệt. Format:

```
1. [Fix title]
   File: ...
   Change: ... (1-2 sentences)
   Impact: ...
```

---

**Bắt đầu bằng grep map files, sau đó đọc theo thứ tự Phase 1 → 6. Stop và confirm sau khi `MULTIPLAYER_AUDIT_REPORT.md` được tạo xong.**
