# SPEC-v2 — Bổ sung mục 4.4: Room Game Modes

> Thêm vào SPEC-v2.md, thay thế mục 4.4 hiện tại.
> Dựa trên audit code thực tế (ROOM_MODES_AUDIT.md) + chuẩn hóa logic.

---

## 4.4 Multiplayer Room

### 4.4.0 Tổng quan

Tạo phòng chơi multiplayer với 4 chế độ khác nhau. Mỗi chế độ có gameplay, scoring, và win condition riêng.

**Chung cho tất cả modes:**
- Mã phòng: 6 ký tự (auto-generate)
- Players: 2–20 người/phòng
- Host cấu hình: chế độ chơi, số câu, thời gian/câu, độ khó, sách, visibility
- Realtime qua WebSocket (STOMP)
- Room lifecycle: LOBBY → IN_PROGRESS → ENDED (hoặc CANCELLED)
- State storage: DB (entities) + Redis (realtime state, TTL 2 giờ)

**Entities:**
```
Room(id, roomCode, roomName, maxPlayers, currentPlayers, questionCount, 
     timePerQuestion, status, mode, isPublic, host, startedAt, endedAt)

RoomPlayer(id, room, user, username, score, team, playerStatus, 
           finalRank, winningStreak, joinedAt)

RoomRound(id, room, roundNumber, questionId, startedAt, endedAt)

RoomAnswer(id, round, userId, answerIndex, isCorrect, responseMs)
```

---

### 4.4.1 Speed Race ⚡

> Ai nhanh nhất, giỏi nhất thắng.

**Concept:** Tất cả players cùng trả lời mỗi câu. Điểm tính theo đúng/sai + tốc độ. Tổng điểm cao nhất thắng.

**Phù hợp:** Casual, mọi nhóm, mọi skill level. Mode mặc định.

**Scoring:**
```
Đúng:  baseScore = 100
       speedBonus = floor((timeLimitMs - responseMs) / timeLimitMs * 50)
       totalPerQuestion = 100 + speedBonus   // Range: 100–150

Sai:   0 điểm
Timeout (không trả lời): 0 điểm
```

**Ví dụ:** câu 30s, trả lời đúng trong 6s → 100 + floor((30000-6000)/30000 * 50) = 100 + 40 = 140 điểm.

**Win condition:** Tổng điểm cao nhất sau hết câu hỏi.

**Tie-break:** Nếu cùng tổng điểm → so tổng responseMs (nhanh hơn thắng).

**Elimination:** Không — tất cả chơi đến hết, ai cũng có cơ hội.

**Config:**
| Option | Default | Range |
|--------|---------|-------|
| questionCount | 15 | 5–30 |
| timePerQuestion | 30s | 10–60s |
| maxPlayers | 4 | 2–20 |

**Frontend:**
- Leaderboard sidebar realtime (cập nhật sau mỗi câu)
- Score animation khi đúng (+140 floating text)
- Kết thúc: podium top 3 + full ranking

---

### 4.4.2 Battle Royale ❤️

> Sai = bị loại. Sống sót cuối cùng thắng.

**Concept:** Elimination mode. Trả lời sai hoặc không trả lời → bị loại (ELIMINATED). Người cuối cùng còn ACTIVE thắng.

**Phù hợp:** Competitive, 4+ người. Tạo kịch tính cao.

**Scoring:** Không tính điểm per-câu. Xếp hạng dựa trên thứ tự bị loại (sống lâu hơn = rank cao hơn).

**Rules:**
```
Trả lời đúng:  giữ ACTIVE, tiếp tục
Trả lời sai:   chuyển ELIMINATED
Timeout:        chuyển ELIMINATED

Ngoại lệ quan trọng:
- Nếu TẤT CẢ active players đều sai trong 1 round → KHÔNG AI bị loại
  (tránh game kết thúc vô nghĩa khi câu quá khó)
- Round tiếp theo bắt đầu bình thường
```

**Win condition:** Người cuối cùng có status ACTIVE.

**Kết thúc sớm:** Nếu chỉ còn 1 player ACTIVE → game kết thúc ngay (không cần chơi hết câu).

**Max rounds (mới — chưa có trong code):**
```
maxRounds = questionCount * 2   // hoặc 50, tùy cái nào nhỏ hơn
Nếu đạt maxRounds mà vẫn > 1 active → rank bằng: 
  1. Số round survived (nhiều hơn = cao hơn)
  2. Nếu bằng → tổng responseMs (nhanh hơn = cao hơn)
```

**Elimination flow:**
```
Player bị loại → status = ELIMINATED
  → WebSocket: player_eliminated { userId, roundNumber }
  → Player chuyển sang spectator mode (vẫn xem game, không trả lời)
  → finalRank = số active players còn lại + 1 (tại thời điểm bị loại)
```

**Final ranking:**
```
Rank 1: player cuối cùng còn ACTIVE
Rank 2+: theo thứ tự bị loại ngược (bị loại sau = rank cao hơn)
Nếu nhiều người bị loại cùng round → cùng rank
```

**Config:**
| Option | Default | Range |
|--------|---------|-------|
| questionCount | 20 | 10–50 |
| timePerQuestion | 20s | 10–30s |
| maxPlayers | 8 | 4–20 |

**Frontend:**
- Active player counter: "🟢 5 người còn lại"
- Elimination toast: "💀 Nguyễn A bị loại!"
- Spectator mode: xem game tiếp, answer buttons disabled, "Đang xem" badge
- Kết thúc: podium top 3, full elimination order

---

### 4.4.3 Team vs Team 👥

> 2 đội thi đấu, phối hợp để thắng.

**Concept:** Chia đều thành 2 đội (A/B). Mỗi người trả lời cá nhân, điểm cộng vào đội. Đội tổng điểm cao hơn thắng.

**Phù hợp:** Nhóm bạn bè, hội thánh, team building. Khuyến khích tinh thần đồng đội.

**Scoring:**
```
Cá nhân: giống Speed Race (100 + speedBonus, range 100-150)
Team score = tổng điểm cá nhân của các thành viên

Perfect Round Bonus:
- Nếu TẤT CẢ thành viên của 1 đội đều trả lời ĐÚNG trong 1 câu
  → +50 điểm cho MỖI thành viên (bonus cộng vào team score)
- Ví dụ: đội 3 người, cả 3 đúng → +150 bonus cho team
- Khuyến khích cả đội cùng giỏi, không chỉ 1 người carry
```

**Chia đội:**
```
- Số người chẵn: chia đều A/B (4 người → 2v2)
- Số người lẻ: đội A nhiều hơn 1 người (5 người → 3v2)
- Phân theo thứ tự join: alternating A-B-A-B hoặc random shuffle (host chọn)
- Host có thể manual swap player giữa 2 đội trong LOBBY
```

**Win condition:** Đội có tổng điểm cao hơn sau hết câu hỏi.

**Tie-break (mới — chưa có trong code):**
```
Nếu 2 đội cùng điểm:
1. So số Perfect Rounds (đội nào nhiều hơn thắng)
2. Nếu vẫn bằng → so tổng responseMs (nhanh hơn thắng)
3. Nếu vẫn bằng → HÒA (cả 2 đội cùng thắng — "Cả hai đội đều xuất sắc!")
```

**Elimination:** Không — tất cả chơi đến hết.

**Config:**
| Option | Default | Range |
|--------|---------|-------|
| questionCount | 15 | 5–30 |
| timePerQuestion | 30s | 10–60s |
| maxPlayers | 8 | 4–20 (recommend chẵn) |
| teamAssignment | "auto" | "auto" / "manual" |

**Frontend:**
- Team score comparison bar (A vs B, horizontal bar chart)
- Perfect Round banner animation: "🌟 PERFECT ROUND — Đội A!" (gold flash)
- Team colors: Đội A = blue (#3b82f6), Đội B = red (#ef4444)
- Individual score vẫn hiển thị bên cạnh team score
- Kết thúc: team celebration screen, MVP per team (highest individual score)

---

### 4.4.4 Sudden Death — King of the Hill 👑

> 1v1 thay phiên. Giữ ngôi vương lâu nhất thắng.

**Concept:** Dạng King of the Hill. 1 Champion đấu với 1 Challenger. Ai sai trước thua, người thắng giữ "ngôi vương" đấu người tiếp theo trong queue. Người có chuỗi thắng (winningStreak) dài nhất khi hết queue là nhà vô địch.

**Phù hợp:** 1v1 competitive, 4+ người. Tạo drama và highlight cá nhân.

**Flow:**
```
1. Players join queue theo thứ tự joinedAt
2. Player đầu queue = Champion (ban đầu)
3. Player thứ 2 = Challenger
4. Mỗi round: 1 câu hỏi, cả 2 trả lời
5. Resolve round → winner giữ Champion, loser ra SPECTATOR
6. Challenger tiếp theo từ queue vào
7. Lặp đến khi queue hết

Queue management: Redis comma-separated user IDs
```

**Round resolution:**
```
| Champion | Challenger | Kết quả |
|----------|------------|---------|
| Đúng    | Sai        | Champion giữ, Challenger → SPECTATOR |
| Sai     | Đúng       | Challenger thành Champion mới, old Champion → SPECTATOR |
| Đúng    | Đúng       | So responseMs — nhanh hơn >= 200ms thắng. Chênh < 200ms → CONTINUE (thêm 1 câu) |
| Sai     | Sai        | CONTINUE (thêm 1 câu) |
| Timeout  | Timeout    | CONTINUE (thêm 1 câu) |
| Đúng    | Timeout    | Champion giữ |
| Timeout  | Đúng       | Challenger thành Champion mới |
| Sai     | Timeout    | CONTINUE (cả 2 fail) |
| Timeout  | Sai        | CONTINUE (cả 2 fail) |

CONTINUE: max 3 câu liên tiếp per matchup.
Nếu sau 3 câu vẫn CONTINUE → Champion giữ ngôi (advantage giữ ghế).
```

**Scoring:** Không dùng điểm. Xếp hạng bằng `winningStreak` (số challenger đánh bại liên tiếp).

**Final ranking:**
```
1. Sort by winningStreak descending
2. Nếu cùng streak → player đứng Champion cuối cùng rank cao hơn
```

**Kết thúc game:**
```
- Queue hết người → game kết thúc
- Hoặc đạt maxRounds (questionCount * 2 hoặc 50)
- Champion cuối cùng KHÔNG tự động là rank 1 (có thể streak thấp hơn)
```

**Config:**
| Option | Default | Range |
|--------|---------|-------|
| questionCount | 20 | 10–50 |
| timePerQuestion | 15s | 10–30s |
| maxPlayers | 8 | 4–16 |

**Frontend:**
- Center stage: Champion (left, gold crown 👑) vs Challenger (right)
- Queue: vertical list bên phải, "Hàng chờ: 4 người"
- Match result: "👑 Champion giữ ngôi!" hoặc "🔄 Champion mới!"
- Spectator list: bottom, muted
- WinningStreak display: "🔥 x3" cạnh Champion name
- Kết thúc: ranking by streak, highlight longest streak holder

---

### 4.4.5 So sánh các chế độ

| | Speed Race ⚡ | Battle Royale ❤️ | Team vs Team 👥 | Sudden Death 👑 |
|---|---|---|---|---|
| **Players** | 2–20 | 4–20 | 4–20 (chẵn tốt) | 4–16 |
| **Scoring** | 100-150/câu | Không | 100-150/câu + team bonus | Không (streak) |
| **Elimination** | Không | Sai = loại | Không | Sai = thua match |
| **Tie-break** | Tổng responseMs | Không (last survivor) | Perfect rounds → responseMs → hòa | Champion advantage |
| **Phù hợp** | Casual, mọi người | Competitive, kịch tính | Team building, hội thánh | 1v1 drama |
| **Độ khó chơi** | Thấp | Trung bình | Thấp | Cao |

---

### 4.4.6 Disconnect & Reconnect

**Chung cho tất cả modes:**
```
Player disconnect:
1. Status → DISCONNECTED
2. Grace period: 60 giây để reconnect
3. Trong grace period: câu hỏi mới → auto-skip (không answer)

Reconnect trong grace period:
1. Status → ACTIVE (hoặc trạng thái trước disconnect)
2. Nhận lại current question nếu đang trong round
3. WebSocket: player_reconnected { userId }

Không reconnect sau 60s:
- Speed Race: tiếp tục, player score giữ nguyên nhưng không trả lời thêm → score frozen
- Battle Royale: chuyển ELIMINATED
- Team vs Team: tiếp tục, team mất 1 thành viên
- Sudden Death:
  - Nếu đang là Champion/Challenger → thua round, đối thủ thắng
  - Nếu đang trong queue → bị remove khỏi queue
```

---

### 4.4.7 API endpoints

```
POST /rooms               { mode, roomName?, timePerQuestionSec, questionCount,
                            maxPlayers, difficulty, book?, isPublic, teamAssignment? }
                          → { room, roomCode, shareLink }

GET  /rooms/{id}          → room details + players + config
POST /rooms/{id}/join     → { roomPlayer }
POST /rooms/{id}/leave    → 204
POST /rooms/{id}/start    (host only) → 200
POST /rooms/{id}/kick     { userId } (host only) → 204
GET  /rooms/{id}/leaderboard → rankings

-- Team mode only:
POST /rooms/{id}/swap-team  { userId, targetTeam } (host, LOBBY only)
```

### 4.4.8 WebSocket events

```
Client → Server:
  answer:   { questionId, answerIndex, clientElapsedMs }
  chat:     { message }
  ready:    {}
  leave:    {}

Server → Client (tất cả modes):
  room_state:       { status, players[], currentQuestion?, config }
  question:         { id, content, options, timeLimitSec, order, totalQuestions }
  answer_result:    { userId, isCorrect, score?, responseMs }
  round_end:        { rankings[], correctAnswer, explanation? }
  game_end:         { finalRankings[], mvp?, shareCardUrl }
  player_joined:    { userId, name, avatar }
  player_left:      { userId }
  player_reconnected: { userId }
  error:            { code, message }

Server → Client (Battle Royale specific):
  player_eliminated: { userId, roundNumber, remainingCount }

Server → Client (Team vs Team specific):
  team_scores:      { teamA: number, teamB: number }
  perfect_round:    { team: "A"|"B", bonusPerMember: 50 }

Server → Client (Sudden Death specific):
  champion_set:     { userId, name, streak }
  challenger_set:   { userId, name }
  match_result:     { winnerId, loserId, reason, newChampion }
  queue_update:     { remaining: number, nextChallenger? }
```
