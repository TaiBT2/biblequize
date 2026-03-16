# 🎮 Sprint 4: Multiplayer Rooms & WebSocket
**Mục tiêu**: Chơi nhiều người realtime với 4 chế độ đa dạng
**Thời gian ước tính**: 4–5 tuần (mở rộng từ 3–4 tuần do thêm game modes)

---

## 📋 Tổng quan 4 chế độ chơi

| Chế độ | Số người | Cơ chế | Độ phức tạp |
|--------|----------|--------|-------------|
| ⚔️ Battle Royale | 5–100 | Trả lời sai → bị loại, top 3 còn lại thắng | Cao |
| 🏃 Speed Race | 2–20 | Cùng câu hỏi, ai đúng + nhanh nhất được nhiều điểm | Trung bình |
| 🫂 Team vs Team | 4–40 | Chia 2 đội, cộng điểm theo đội | Trung bình |
| 🎯 Sudden Death 1v1 | 2 | Ai sai trước thua, thắng → giữ chỗ chờ người kế | Cao |

---

## 🏗️ BACKEND TASKS

### 1. Room Management (Nền tảng chung)

- [ ] **Room entity & DB schema**
  - [ ] Bảng `rooms`: id, code (6 ký tự), host_id, mode (`battle_royale` | `speed_race` | `team_vs_team` | `sudden_death`), status (`lobby` | `in_progress` | `ended`), config (JSON), created_at
  - [ ] Bảng `room_players`: room_id, user_id, team (`A` | `B` | null), status (`active` | `eliminated` | `winner`), score, rank, joined_at
  - [ ] Bảng `room_rounds`: room_id, round_no, question_id, started_at, ended_at
  - [ ] Bảng `room_answers`: round_id, user_id, answer_index, is_correct, answered_at, points_earned
  - [ ] Indexes: `rooms(code)`, `room_players(room_id, user_id)`, `room_answers(round_id, user_id)`

- [ ] **REST APIs quản lý phòng**
  - [ ] `POST /rooms` — Tạo phòng, trả về `{roomId, code}`
  - [ ] `POST /rooms/{id}/join` — Tham gia phòng qua roomId
  - [ ] `POST /rooms/join-by-code` — Tham gia phòng qua 6-digit code
  - [ ] `GET /rooms/{id}` — Trạng thái phòng (danh sách player, config, status)
  - [ ] `POST /rooms/{id}/start` — Host bắt đầu game (yêu cầu ≥ 2 players)
  - [ ] `POST /rooms/{id}/leave` — Rời phòng
  - [ ] `GET /rooms/public` — Danh sách phòng công khai đang chờ (Speed Race, Team vs Team)

- [ ] **Room config validation**
  - [ ] Battle Royale: `maxPlayers` (5–100), `questionCount` (10–50), `timePerQuestion` (10–30s)
  - [ ] Speed Race: `playerCount` (2–20), `questionCount` (10–30), `timePerQuestion` (15–30s)
  - [ ] Team vs Team: `teamSize` (2–20), `questionCount` (15–30), `timePerQuestion` (20–30s)
  - [ ] Sudden Death: luôn 2 người, `maxRounds` (best of 3/5/7)

---

### 2. WebSocket — Spring STOMP Configuration

- [ ] **Cấu hình WebSocket**
  - [ ] `WebSocketConfig`: enable STOMP, set allowed origins, heartbeat
  - [ ] Topic chung: `/topic/rooms/{roomId}` — broadcast sự kiện cho tất cả players trong phòng
  - [ ] Queue cá nhân: `/user/queue/room` — gửi riêng cho từng player (bị loại, kết quả...)
  - [ ] Endpoint kết nối: `/ws` (SockJS fallback)

- [ ] **Event model (các sự kiện WebSocket)**

  | Event | Direction | Payload |
  |-------|-----------|---------|
  | `PLAYER_JOINED` | Server → All | `{userId, displayName, avatar, playerCount}` |
  | `PLAYER_LEFT` | Server → All | `{userId, playerCount}` |
  | `GAME_STARTING` | Server → All | `{countdown: 3}` |
  | `QUESTION` | Server → All | `{roundNo, questionId, text, options, timeLimit}` |
  | `ANSWER_SUBMIT` | Client → Server | `{roundId, answerIndex}` |
  | `ANSWER_RESULT` | Server → Player | `{correct, correctIndex, pointsEarned, currentScore}` |
  | `ROUND_END` | Server → All | `{correctIndex, explanation, leaderboard[]}` |
  | `PLAYER_ELIMINATED` | Server → All | `{userId, displayName, rank, totalEliminated}` |
  | `GAME_END` | Server → All | `{winners[], finalLeaderboard[]}` |
  | `TEAM_SCORE_UPDATE` | Server → All | `{teamA: score, teamB: score}` (Team vs Team) |

- [ ] **Reconnection handling**
  - [ ] Lưu game state trong Redis (hoặc in-memory cache)
  - [ ] Khi player reconnect: gửi lại current state (câu hỏi hiện tại, thời gian còn lại, điểm số)
  - [ ] Timeout 30s: nếu player không reconnect → tự động eliminate / bỏ qua lượt

---

### 3. ⚔️ Battle Royale Mode — Logic

- [ ] **Elimination engine**
  - [ ] Sau mỗi câu hỏi: tất cả player trả lời sai → status = `eliminated`, broadcast `PLAYER_ELIMINATED`
  - [ ] Nếu **tất cả** sai cùng lúc → không ai bị loại (câu đó bỏ qua)
  - [ ] Nếu còn ≥ 2 người → tiếp tục câu tiếp theo
  - [ ] Game kết thúc khi còn 1 người hoặc hết câu hỏi

- [ ] **Top 3 ranking**
  - [ ] Người bị loại sau cùng = hạng 3 🥉
  - [ ] Người bị loại áp chót = hạng 2 🥈  
  - [ ] Người còn lại cuối cùng = hạng 1 🥇
  - [ ] Nếu nhiều người bị loại trong cùng 1 câu → xếp hạng bằng nhau (ex: đồng hạng 2)

- [ ] **Timeout xử lý**
  - [ ] Player không trả lời trong thời gian quy định → tự động tính là sai → bị loại

- [ ] **Lưu kết quả**
  - [ ] Lưu vào `room_players`: rank, final_score, eliminated_at_round
  - [ ] Top 3 được cộng điểm ranked (tùy config host)

---

### 4. 🏃 Speed Race Mode — Logic

- [ ] **Scoring theo tốc độ**
  - [ ] Trả lời đúng: điểm cơ bản = 100
  - [ ] Speed bonus: `bonus = Math.floor((timeLimit - responseTime) / timeLimit * 50)`
  - [ ] Tổng tối đa mỗi câu = 150 điểm
  - [ ] Trả lời sai hoặc timeout = 0 điểm (không bị loại)

- [ ] **Đồng hồ đếm ngược server-side**
  - [ ] Server điều khiển timer, tránh gian lận client-side timestamp
  - [ ] Sau `timeLimit` giây → tự động chuyển câu tiếp theo

- [ ] **Kết thúc game**
  - [ ] Sau N câu → broadcast `GAME_END` với final leaderboard
  - [ ] Top 3 điểm cao nhất thắng

---

### 5. 🫂 Team vs Team Mode — Logic

- [ ] **Ghép đội**
  - [ ] Host chọn: ghép ngẫu nhiên hoặc tự chọn đội khi join
  - [ ] Đảm bảo 2 đội xấp xỉ bằng nhau (chênh lệch ≤ 1 người)
  - [ ] Broadcast `teamA[]` và `teamB[]` khi game bắt đầu

- [ ] **Cộng điểm đội**
  - [ ] Điểm mỗi player đúng → cộng vào tổng điểm đội
  - [ ] Sau mỗi câu: broadcast `TEAM_SCORE_UPDATE`
  - [ ] Bonus: nếu **tất cả** thành viên đội trả lời đúng → +50 điểm "Perfect Round"

- [ ] **Kết thúc game**
  - [ ] Đội nhiều điểm hơn sau N câu thắng
  - [ ] Hòa → round tiebreaker (1 câu duy nhất, đội nào đúng + nhanh hơn thắng)

---

### 6. 🎯 Sudden Death 1v1 Mode — Logic

- [ ] **Ghép cặp**
  - [ ] Khi vào phòng: xếp hàng chờ (matchmaking queue)
  - [ ] Ghép 2 player đầu tiên trong queue thành 1 match
  - [ ] Spectators: người còn lại trong phòng xem real-time

- [ ] **Luật chơi**
  - [ ] Cả 2 nhận cùng câu hỏi, trả lời độc lập
  - [ ] Ai trả lời **sai** trước → thua match đó
  - [ ] Nếu cả 2 đều sai cùng lúc (trong cùng 1 câu) → câu đó hòa, tiếp tục câu tiếp
  - [ ] Nếu cả 2 đều đúng → câu đó hòa, tiếp tục
  - [ ] Người thua → trở về spectator
  - [ ] Người thắng → ở lại "ghế nóng", chờ người thách đấu tiếp theo từ queue

- [ ] **Best of N (optional config)**
  - [ ] Host config: best of 1 / best of 3 / best of 5
  - [ ] Theo dõi wins/losses giữa cùng 2 player cho đến khi có người thắng

- [ ] **Streak & ranking**
  - [ ] Theo dõi winning streak: thắng liên tiếp bao nhiêu người
  - [ ] Leaderboard phòng: xếp theo số trận thắng liên tiếp

---

### 7. Question Distribution & Anti-cheat

- [ ] **Câu hỏi đồng bộ**
  - [ ] Tất cả player trong phòng nhận **cùng câu hỏi** tại **cùng thời điểm**
  - [ ] Câu hỏi được server chọn trước và cache cho cả game session
  - [ ] Không gửi `correctAnswer` trong payload câu hỏi đến client

- [ ] **Anti-cheat cơ bản**
  - [ ] Server validate timestamp: không chấp nhận answer gửi trước khi câu hỏi được broadcast
  - [ ] Rate limit: mỗi player chỉ được gửi 1 answer/round
  - [ ] Server-side timer: không tin tưởng timer của client

---

## 🖥️ FRONTEND TASKS

### 1. Lobby & Room UI

- [ ] **Trang chủ Multiplayer** (`/multiplayer`)
  - [ ] 4 card chọn chế độ: Battle Royale / Speed Race / Team vs Team / Sudden Death
  - [ ] Mỗi card: mô tả ngắn, số người chơi, icon chế độ
  - [ ] Nút "Tạo phòng" và "Tìm phòng"

- [ ] **Tạo phòng** (`/rooms/create`)
  - [ ] Chọn chế độ (pre-selected nếu từ card)
  - [ ] Cấu hình: public/private, số câu, thời gian/câu, sách Kinh Thánh, độ khó
  - [ ] Team vs Team: chọn "ghép ngẫu nhiên" hoặc "tự chọn đội"
  - [ ] Nút tạo → redirect sang lobby phòng

- [ ] **Join phòng**
  - [ ] Modal nhập 6-digit code
  - [ ] Trang `/rooms/public` liệt kê phòng đang chờ (Speed Race, Team vs Team)
  - [ ] QR code share (hiển thị trong lobby)

- [ ] **Lobby phòng** (`/rooms/{id}/lobby`)
  - [ ] Danh sách players đang chờ (avatar + tên)
  - [ ] Team vs Team: 2 cột Team A / Team B, nút "Đổi đội" (nếu tự chọn)
  - [ ] Room code + nút copy + QR code
  - [ ] Host: nút "Bắt đầu" (enable khi đủ player)
  - [ ] Player: nút "Sẵn sàng" (ready toggle)
  - [ ] Countdown 3–2–1 animation khi host bắt đầu

---

### 2. In-Game UI (chung)

- [ ] **Question display component** (dùng chung cho tất cả modes)
  - [ ] Số câu hỏi hiện tại (VD: Câu 5/20)
  - [ ] Timer progress bar (đổi màu: xanh → vàng → đỏ)
  - [ ] Nội dung câu hỏi + 4 lựa chọn A/B/C/D
  - [ ] Sau khi chọn: highlight đáp án đúng (xanh) / sai (đỏ)
  - [ ] Hiển thị giải thích ngắn sau mỗi câu

- [ ] **Answer feedback animation**
  - [ ] Đúng: confetti nhỏ + "+100 pts" nổi lên
  - [ ] Sai: shake animation + "Sai rồi!" 
  - [ ] Timeout: flash đỏ toàn màn hình

---

### 3. ⚔️ Battle Royale UI

- [ ] **Player count overlay**
  - [ ] Góc trên phải: "👥 Còn lại: 47/100" (cập nhật real-time)
  - [ ] Khi ai đó bị loại: toast notification nhỏ "❌ [Tên] đã bị loại"

- [ ] **Elimination screen** (hiện ra khi bị loại)
  - [ ] "Bạn đã bị loại! 💀" + câu đúng là gì
  - [ ] Thứ hạng: "Bạn xếp hạng #23/100"
  - [ ] Nút "Xem tiếp" → chuyển sang spectator mode

- [ ] **Spectator view** (sau khi bị loại)
  - [ ] Vẫn thấy câu hỏi + câu trả lời của những người còn lại
  - [ ] Live counter "Còn lại X người"
  - [ ] Có thể chọn 1 người để "theo dõi"

- [ ] **Final top 3 screen**
  - [ ] Podium animation 🥇🥈🥉
  - [ ] Tên + avatar + điểm số
  - [ ] Confetti full-screen cho người thắng

---

### 4. 🏃 Speed Race UI

- [ ] **Live leaderboard sidebar** (cập nhật sau mỗi câu)
  - [ ] Top 5 hiển thị thường trực bên phải
  - [ ] Player của mình luôn hiển thị dù không top 5
  - [ ] Flash animation khi thứ hạng thay đổi

- [ ] **Speed indicator**
  - [ ] Hiển thị thời gian phản hồi sau mỗi câu: "Bạn trả lời sau 4.2s"
  - [ ] So sánh với người nhanh nhất: "Nhanh nhất: 1.8s"

- [ ] **End screen**
  - [ ] Bảng tổng điểm đầy đủ
  - [ ] "Câu trả lời của bạn" vs "Câu trả lời nhanh nhất"
  - [ ] Nút "Chơi lại" → tạo phòng mới cùng mode

---

### 5. 🫂 Team vs Team UI

- [ ] **Team score bar** (top màn hình, luôn hiển thị)
  - [ ] "Team A [====----] Team B" kiểu tug-of-war
  - [ ] Điểm số 2 đội: "Team A: 850 | Team B: 720"
  - [ ] Flash khi điểm thay đổi

- [ ] **Teammate indicator**
  - [ ] Sau khi trả lời: hiển thị ai trong đội đã trả lời (avatar nhỏ ✅/❌)
  - [ ] "Perfect Round" animation nếu cả đội đúng hết

- [ ] **End screen**
  - [ ] "Team A thắng! 🎉" hoặc "Hòa! ⚔️"
  - [ ] Điểm từng người trong cả 2 đội
  - [ ] MVP highlight: người đóng góp nhiều điểm nhất mỗi đội

---

### 6. 🎯 Sudden Death 1v1 UI

- [ ] **Match arena** (2 người đối mặt)
  - [ ] Layout: Avatar + tên Player 1 ← VS → Player 2
  - [ ] Chỉ báo trả lời: ✅/❌/⏳ xuất hiện khi player trả lời
  - [ ] Không hiện đáp án của đối thủ cho đến khi cả 2 đã trả lời

- [ ] **Winning streak display**
  - [ ] "🔥 Đang thắng 5 trận liên tiếp!" dưới tên người đang giữ ghế
  - [ ] Spectator count: "👀 12 người đang xem"

- [ ] **Spectator panel**
  - [ ] Danh sách người chờ trong queue: "Bạn xếp thứ 3 trong hàng chờ"
  - [ ] Chat emoji reactions: 🔥💪😱🙏 (không có text chat)

- [ ] **Match result**
  - [ ] "Bạn thắng! 🎉 Chờ thách đấu tiếp theo..." (nếu thắng)
  - [ ] "Bạn thua! Xếp hàng lại để thách đấu..." (nếu thua)

---

### 7. WebSocket Client Integration

- [ ] **WebSocket service** (`useRoomWebSocket` hook)
  - [ ] Connect/disconnect lifecycle quản lý tự động
  - [ ] Subscribe to `/topic/rooms/{roomId}` và `/user/queue/room`
  - [ ] Reconnection tự động với exponential backoff (1s → 2s → 4s → 8s)
  - [ ] Connection status indicator (🟢 Connected / 🟡 Reconnecting / 🔴 Disconnected)

- [ ] **Optimistic UI**
  - [ ] Khi submit answer: disable các lựa chọn ngay lập tức (không đợi server)
  - [ ] Hiển thị "Đang xử lý..." trong khi chờ `ANSWER_RESULT`

---

## 🗄️ DATABASE SCHEMA (Bổ sung cho Sprint 4)

```sql
-- Rooms
CREATE TABLE rooms (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  code        CHAR(6) UNIQUE NOT NULL,
  host_id     BIGINT NOT NULL REFERENCES users(id),
  mode        ENUM('battle_royale','speed_race','team_vs_team','sudden_death') NOT NULL,
  status      ENUM('lobby','in_progress','ended') DEFAULT 'lobby',
  config      JSON NOT NULL,
  -- config example: {"questionCount":20,"timePerQuestion":20,"books":["Genesis"],"difficulty":"mixed","isPublic":true}
  started_at  TIMESTAMP NULL,
  ended_at    TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rooms_code (code),
  INDEX idx_rooms_status (status)
);

-- Room Players
CREATE TABLE room_players (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id     BIGINT NOT NULL REFERENCES rooms(id),
  user_id     BIGINT NOT NULL REFERENCES users(id),
  team        ENUM('A','B') NULL,
  status      ENUM('waiting','active','eliminated','spectator','winner') DEFAULT 'waiting',
  score       INT DEFAULT 0,
  final_rank  INT NULL,
  joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_room_user (room_id, user_id),
  INDEX idx_room_players_room (room_id)
);

-- Room Rounds (mỗi câu hỏi = 1 round)
CREATE TABLE room_rounds (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id     BIGINT NOT NULL REFERENCES rooms(id),
  round_no    INT NOT NULL,
  question_id BIGINT NOT NULL REFERENCES questions(id),
  started_at  TIMESTAMP NULL,
  ended_at    TIMESTAMP NULL,
  UNIQUE KEY uk_room_round (room_id, round_no)
);

-- Room Answers
CREATE TABLE room_answers (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  round_id        BIGINT NOT NULL REFERENCES room_rounds(id),
  user_id         BIGINT NOT NULL REFERENCES users(id),
  answer_index    TINYINT NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  response_ms     INT NOT NULL,    -- milliseconds to answer
  points_earned   INT DEFAULT 0,
  answered_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_round_user (round_id, user_id),
  INDEX idx_room_answers_round (round_id)
);
```

---

## 📡 WEBSOCKET EVENT FLOW

### Battle Royale Flow
```
Lobby → [Host starts] → GAME_STARTING (countdown 3s)
  → QUESTION (câu 1, timer 20s)
    → Players submit ANSWER_SUBMIT
    → Server evaluates all answers at timer end
    → ANSWER_RESULT (gửi riêng từng người)
    → PLAYER_ELIMINATED (broadcast những người sai)
    → ROUND_END (broadcast leaderboard còn lại)
  → Lặp lại QUESTION...
  → GAME_END (khi ≤ 1 người hoặc hết câu)
```

### Speed Race Flow
```
GAME_STARTING → QUESTION (timer 25s)
  → Server nhận ANSWER_SUBMIT theo thứ tự thời gian
  → Khi hết timer: ROUND_END + leaderboard update
  → Tiếp tục đến câu cuối → GAME_END
```

### Team vs Team Flow
```
GAME_STARTING → QUESTION
  → Sau khi tất cả trả lời hoặc hết timer:
    → ROUND_END + TEAM_SCORE_UPDATE
  → Sau câu cuối: GAME_END
  → Nếu hòa: 1 câu TIEBREAKER → GAME_END
```

### Sudden Death 1v1 Flow
```
2 players matched → MATCH_START
  → QUESTION → cả 2 trả lời
  → Nếu 1 người sai → MATCH_END (loser eliminated)
  → Nếu hòa (cùng đúng/cùng sai) → câu tiếp theo
  → Winner giữ ghế, người thua về spectator
  → Người tiếp trong queue vào thách đấu
```

---

## ✅ ACCEPTANCE CRITERIA

### Chức năng cơ bản (phải có)
- [ ] Host tạo phòng được với 4 chế độ, share code/QR cho người khác join
- [ ] WebSocket connection ổn định, tự reconnect khi mất mạng < 30s
- [ ] Tất cả players nhận câu hỏi đồng thời (chênh lệch < 200ms)
- [ ] Server-side timer, không client-side (anti-cheat)

### Battle Royale
- [ ] Người trả lời sai bị loại ngay sau khi hết thời gian mỗi câu
- [ ] Top 3 người còn lại nhận huy chương 🥇🥈🥉
- [ ] Người bị loại chuyển sang spectator view tiếp tục xem game

### Speed Race
- [ ] Điểm speed bonus tính đúng theo công thức
- [ ] Leaderboard cập nhật real-time sau mỗi câu
- [ ] Kết quả cuối cùng hiển thị đúng top 3

### Team vs Team
- [ ] Đội điểm cao hơn sau N câu thắng
- [ ] Tiebreaker hoạt động khi hòa
- [ ] "Perfect Round" bonus cộng đúng khi cả đội trả lời đúng

### Sudden Death 1v1
- [ ] Ai sai trước thua match, chuyển về spectator
- [ ] Người thắng giữ ghế, tự động match với người tiếp theo trong queue
- [ ] Winning streak hiển thị chính xác

### Performance
- [ ] WebSocket hoạt động ổn định với 50+ users đồng thời trong 1 phòng
- [ ] Latency từ submit answer đến nhận result < 500ms
- [ ] Không mất event khi player reconnect trong 30s

---

## 📅 Thứ tự thực hiện đề xuất

```
Tuần 1: Core WebSocket + Room management REST APIs + DB schema
         Speed Race (mode đơn giản nhất để test WebSocket)

Tuần 2: Battle Royale BE (elimination engine) + FE (player count, spectator)
         Lobby UI hoàn chỉnh (tạo/join phòng, 4 chế độ)

Tuần 3: Team vs Team BE + FE
         Sudden Death 1v1 BE + FE (matchmaking queue)

Tuần 4: Reconnection handling + Anti-cheat + Performance test (50 users)
         Polish UI, animations, bug fixes

Tuần 5 (buffer): Load testing, edge cases, acceptance testing
```

---

## 🔗 Dependencies
- ✅ Sprint 1: Auth + User entities (cần userId cho room_players)
- ✅ Sprint 2: Questions + Quiz session logic (tái sử dụng question selection)
- Sprint 5 (Tournament) sẽ tái sử dụng: WebSocket infrastructure, Room model, 1v1 match logic từ Sudden Death
