# Room Game Modes — Audit Report
> Generated: 2026-04-02

## Mode 1: Speed Race

- **Engine class**: `modules/room/service/SpeedRaceScoringService.java` (21 LOC)
- **Mô tả**: Tất cả players cùng trả lời, điểm tính theo tốc độ. Ai tổng điểm cao nhất thắng.
- **Scoring**: `đúng → 100 + floor((timeLimit - responseMs) / timeLimit * 50)`. Sai/timeout → 0. Range: 0–150/câu.
- **Win condition**: Tổng điểm cao nhất sau hết câu hỏi
- **Elimination**: Không — tất cả chơi đến hết
- **Timer**: `timePerQuestion` từ Room config (default 30s)
- **Config options**: questionCount, timePerQuestion, maxPlayers
- **Frontend display**: Leaderboard sidebar realtime, score update sau mỗi câu
- **Tests**: `SpeedRaceScoringServiceTest.java` — 7 tests ✅

## Mode 2: Battle Royale

- **Engine class**: `modules/room/service/BattleRoyaleEngine.java` (106 LOC)
- **Mô tả**: Trả lời sai = bị loại. Người cuối cùng sống sót thắng.
- **Scoring**: Không tính điểm per-câu cho ranking. Dùng thứ tự bị loại để xếp hạng.
- **Win condition**: Người cuối cùng có status ACTIVE
- **Elimination**: Có — sai/không trả lời = ELIMINATED. **Ngoại lệ: nếu TẤT CẢ active players đều sai → không ai bị loại** (DECISIONS.md)
- **Timer**: `timePerQuestion` từ Room config
- **Config options**: questionCount (thực tế chơi cho đến khi còn 1 người), timePerQuestion, maxPlayers
- **Frontend display**: Active player count, elimination toast, spectator mode cho người bị loại, podium khi kết thúc
- **Final rank**: Survivors sort by score (assignFinalRanks), eliminated players get rank = survivorsCount + 1
- **Tests**: **KHÔNG CÓ TEST** ❌

## Mode 3: Team vs Team

- **Engine class**: `modules/room/service/TeamScoringService.java` (104 LOC)
- **Mô tả**: Chia 2 đội A/B, điểm cộng theo đội. Đội có tổng điểm cao hơn thắng.
- **Scoring**: Tổng điểm cá nhân cộng lại per đội. **Perfect Round bonus: +50 mỗi member nếu CẢ ĐỘI đúng hết 1 câu**
- **Win condition**: Đội có tổng điểm cao hơn. "TIE" nếu bằng nhau.
- **Elimination**: Không — tất cả chơi đến hết
- **Timer**: `timePerQuestion` từ Room config
- **Config options**: questionCount, timePerQuestion, maxPlayers (chia đều 2 đội)
- **Frontend display**: Team score comparison, perfect round banner animation, team win/lose screen
- **Tie handling**: Trả về "TIE" string — **KHÔNG CÓ tie-break logic** ⚠️
- **Tests**: **KHÔNG CÓ TEST** ❌

## Mode 4: Sudden Death (King of the Hill)

- **Engine class**: `modules/room/service/SuddenDeathMatchService.java` (227 LOC)
- **Mô tả**: 1v1 thay phiên. Champion giữ ghế, challenger từ hàng chờ. Sai = thua, người thắng giữ champion.
- **Scoring**: Không dùng điểm — dùng winningStreak để xếp hạng cuối
- **Win condition**: Người có winningStreak cao nhất khi queue hết
- **Elimination**: Có — loser bị chuyển sang SPECTATOR (không bị out hẳn, vẫn xem)
- **Timer**: `timePerQuestion` từ Room config
- **Config options**: questionCount (dùng cho max rounds), timePerQuestion, maxPlayers
- **Queue**: Redis comma-separated user IDs (`RoomStateService`). Sort theo joinedAt.
- **Tie case (round)**: Cả 2 đúng HOẶC cả 2 sai → CONTINUE (thêm câu). **KHÔNG có logic so elapsedMs khi cả 2 đúng** ⚠️ (FIX-004 trong SPEC_V2_ERRATA.md)
- **Final rank**: Sort by winningStreak descending (assignFinalRanks)
- **Frontend display**: Champion vs Challenger display, spectator list, queue remaining count, match result overlay
- **Tests**: **KHÔNG CÓ TEST** ❌

## Shared Services

### RoomService.java
- Room CRUD, join/leave, start game
- Tests: `RoomServiceTest.java` — 11 tests ✅

### RoomStateService.java
- Redis-based state: current question, round ID, SD queue/champion/challenger
- Key pattern: `room:state:{type}:{roomId}`, TTL 2 hours
- Tests: **KHÔNG CÓ TEST** ❌

### RoomQuizService.java
- Question delivery to room, round management
- Tests: **KHÔNG CÓ TEST** ❌

## Entities

| Entity | Fields | Usage |
|--------|--------|-------|
| `Room` | id, roomCode, roomName, maxPlayers, currentPlayers, questionCount, timePerQuestion, status (LOBBY/IN_PROGRESS/ENDED/CANCELLED), mode (SPEED_RACE/BATTLE_ROYALE/TEAM_VS_TEAM/SUDDEN_DEATH), isPublic, host, startedAt, endedAt | Room config & lifecycle |
| `RoomPlayer` | id, room, user, username, score, team (A/B/null), playerStatus (ACTIVE/ELIMINATED/SPECTATOR/DISCONNECTED), finalRank, winningStreak, joinedAt | Player state per room |
| `RoomRound` | id, room, roundNumber, questionId, startedAt, endedAt | Round tracking |
| `RoomAnswer` | id, round, userId, answerIndex, isCorrect, responseMs | Answer per player per round |

## So sánh

| Feature | Speed Race | Battle Royale | Team vs Team | Sudden Death |
|---------|-----------|---------------|-------------|-------------|
| **Scoring** | 100-150/câu (speed bonus) | Không (rank by survival) | Sum per team + perfect bonus | Không (rank by streak) |
| **Elimination** | Không | Sai = loại (trừ all-wrong) | Không | Sai = thua match |
| **Timer** | Room config | Room config | Room config | Room config |
| **Max players** | Room config (default 4) | Room config | Room config (chia 2 đội) | Room config |
| **Tie handling** | Score comparison | Last survivor | "TIE" string (no tiebreak) | CONTINUE (cả 2 đúng/sai) |
| **Win condition** | Highest total score | Last active player | Higher team score | Highest winningStreak |
| **State storage** | DB only | DB only | DB only | DB + Redis (queue) |
| **Tests** | ✅ 7 tests | ❌ None | ❌ None | ❌ None |
| **Phù hợp** | Casual, mọi nhóm | Competitive, 4+ người | Nhóm bạn bè, hội thánh | 1v1 competitive |

## Vấn đề phát hiện

### 1. Thiếu test nghiêm trọng ❌
- **BattleRoyaleEngine**: 0 tests — logic elimination + all-wrong exception chưa verify
- **TeamScoringService**: 0 tests — perfect round bonus + tie detection chưa verify
- **SuddenDeathMatchService**: 0 tests — queue management + match flow chưa verify
- **RoomStateService**: 0 tests — Redis state management chưa verify
- **RoomQuizService**: 0 tests — question delivery chưa verify
- **Chỉ có SpeedRaceScoringService (7 tests) và RoomService (11 tests) được test**

### 2. Team vs Team tie không có tiebreak ⚠️
- `determineWinner()` trả về "TIE" nhưng frontend không handle case này rõ ràng
- SPEC không define tie-break cho Team mode
- Đề xuất: so sánh số perfect rounds, hoặc tổng responseMs thấp hơn

### 3. Sudden Death thiếu tie-break khi cả 2 cùng đúng ⚠️
- Hiện tại: cả 2 đúng → CONTINUE (thêm câu mới vô thời hạn)
- SPEC_V2_ERRATA FIX-004 define: so elapsedMs nếu chênh > 200ms, max 5 câu sudden death
- **Chưa implement** — cần thêm elapsedMs comparison logic

### 4. Battle Royale all-wrong edge case ⚠️
- Nếu liên tiếp nhiều round all-wrong → game không kết thúc
- Cần define max rounds hoặc fallback condition
- DECISIONS.md ghi: "Giữ game tiếp tục cho đến khi ít nhất 1 người trả lời đúng" — OK nhưng cần max rounds limit

### 5. Frontend mode-specific logic tập trung trong 1 file lớn ⚠️
- `RoomQuiz.tsx` — 948+ LOC, xử lý tất cả 4 modes trong cùng component
- CLAUDE.md rule: "Component không quá 300 LOC"
- Đề xuất: tách thành sub-components per mode (SpeedRaceView, BattleRoyaleView, etc.)

### 6. RoomStateService dùng comma-separated string cho SD queue
- DECISIONS.md ghi: "Đơn giản, human-readable" — chấp nhận cho < 32 players
- Nhưng không có validation khi queue string corrupt/empty

### 7. Scoring inconsistency giữa modes
- Speed Race: cá nhân 0-150/câu → tổng điểm
- Battle Royale: assignFinalRanks sort by score — nhưng score không được tính ở đâu trong engine (chỉ dùng elimination order)
- Sudden Death: assignFinalRanks sort by winningStreak — OK
- Team: sum individual scores — nhưng cá nhân score tính bằng gì? (Speed Race scoring hay flat?)

### 8. Missing reconnect handling
- SPEC mục 9.4 mention reconnect nhưng RoomPlayer có status DISCONNECTED mà không có logic reconnect trong engines
- Nếu player disconnect giữa Battle Royale → họ có bị auto-eliminate không?

## Đề xuất hành động

### Ưu tiên cao
1. **Viết tests** cho BattleRoyaleEngine, TeamScoringService, SuddenDeathMatchService (≥ 5 tests mỗi engine)
2. **Viết tests** cho RoomStateService, RoomQuizService
3. **Implement FIX-004**: Sudden Death elapsedMs comparison khi cả 2 đúng

### Ưu tiên trung bình
4. **Add tie-break cho Team vs Team**: so sánh perfect round count hoặc total responseMs
5. **Add max rounds** cho Battle Royale (prevent infinite game)
6. **Tách RoomQuiz.tsx** thành sub-components per mode (< 300 LOC each)

### Ưu tiên thấp
7. **Clarify scoring** cho Battle Royale — hiện assignFinalRanks sort by score nhưng score chưa rõ nguồn
8. **Add reconnect logic** cho disconnected players
9. **Validate SD queue** Redis string to prevent corruption
