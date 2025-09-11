## Bible Quiz — Thiết kế yêu cầu & kiến trúc

### 1. Tóm tắt chức năng chính
- **Chơi 1 người (Single-player)**: chọn sách/toàn bộ Kinh Thánh/bộ tuỳ chọn, số câu, độ khó (Tất cả/Dễ/Khó), bật/tắt giải thích.
- **Tạo giải nhiều người (Multiplayer/Room)**: chủ phòng tạo phòng, mã phòng/chia sẻ link, thời gian mỗi câu, đồng bộ bắt đầu/kết thúc, bảng xếp hạng sau mỗi vòng.
- **Thư viện câu hỏi**: theo sách (Genesis, Exodus, ...), thẻ chương/đoạn/độ khó, nguồn trích.
- **Đăng ký/Đăng nhập**: Google, Facebook (OAuth2/SSO), tuỳ chọn email/password.
- **Lịch sử chơi**: lưu điểm, thời gian, câu đúng/sai, xem lại đáp án và giải thích.
- **Giải thích đáp án**: ẩn/hiện theo yêu cầu người chơi.
- **Góp ý/Báo lỗi**: form góp ý, báo câu hỏi sai, trạng thái xử lý.
- **Admin panel**: CRUD câu hỏi, import CSV/JSON, duyệt góp ý, analytics (top câu khó/dễ, usage).
- **Khác**: leaderboard toàn cầu, leaderboard phòng, bookmark câu hỏi, luyện theo chương (practice mode).

### 2. Mục tiêu phi chức năng
- **Hiệu năng**: <200ms P95 cho API đọc; phòng 100 người, 10 câu/phút; WebSocket ổn định.
- **Khả dụng**: 99.9%+ cho gameplay; degrade gracefully khi dịch vụ phụ (analytics) lỗi.
- **Bảo mật**: OAuth2 PKCE, JWT ngắn hạn + refresh token, rate limit/recaptcha, RBAC.
- **Khả mở rộng**: module hoá các gói: auth, quiz, room, content, feedback, admin.
- **Khả quốc tế hoá (i18n)**: hỗ trợ nhiều bản dịch câu hỏi/giải thích; UI đa ngôn ngữ.
- **Tuân thủ**: lưu hoạt động theo pháp lý địa phương; xoá dữ liệu tài khoản theo yêu cầu.

### 3. Vai trò người dùng (Personas & Quyền)
- **Guest**: chơi nhanh 1 người (không lưu lịch sử), xem leaderboard global (read-only).
- **User**: như Guest + lưu lịch sử, bookmark, tạo/tham gia phòng, gửi góp ý.
- **Admin**: quản lý câu hỏi, import, duyệt góp ý, xem analytics, quản lý người dùng.

### 4. Mô hình dữ liệu (khái niệm)
- **User**(id, name, email, avatarUrl, provider, role, createdAt)
- **AuthIdentity**(id, userId, provider, providerUserId, createdAt)
- **Question**(id, book, chapter, verseStart, verseEnd, difficulty, type, content, options[], correctAnswer, explanation, tags[], source, language, isActive, createdBy, updatedAt)
- **QuestionSet**(id, name, description, filtersJSON, ownerId, visibility)
- **QuizSession**(id, mode, ownerId, configJSON, status, createdAt)
- **QuizSessionQuestion**(id, sessionId, questionId, order, revealAt, timeLimitSec)
- **Answer**(id, sessionId, questionId, userId, answer, isCorrect, elapsedMs, createdAt)
- **Room**(id, code, hostUserId, status, configJSON, createdAt, startedAt, endedAt)
- **RoomMember**(id, roomId, userId, joinedAt, leftAt, score)
 - **RoomMember**(id, roomId, userId, joinedAt, leftAt, score)
 - **Tournament**(id, roomId, name, status, configJSON, createdAt, startedAt, endedAt)
 - **TournamentParticipant**(id, tournamentId, userId, seed, eliminatedAt)
 - **Match**(id, tournamentId, round, indexInRound, status, bestOf?, createdAt, startedAt, endedAt)
 - **MatchParticipant**(id, matchId, userId, livesRemaining, score, isWinner?)
 - **MatchQuestion**(id, matchId, questionId, order, timeLimitSec)
 - **MatchAnswer**(id, matchId, questionId, userId, answer, isCorrect, elapsedMs, createdAt)
- **Feedback**(id, userId, type [report/question/general], questionId?, content, status, createdAt, handledBy?)
- **Bookmark**(id, userId, questionId, createdAt)
- **LeaderboardDaily/Weekly/AllTime**(id, scope, key, userId, score, rank, periodStart, periodEnd)
- **UserDailyProgress**(id, userId, date, livesRemaining, questionsCounted, pointsCounted, currentBook, currentBookIndex, currentDifficulty, isPostCycle, lastUpdatedAt)
- **RankedSession**(id, userId, sessionId, date, questionsCounted, pointsCounted)  
  Ghi chú: `RankedSession` dùng để tổng hợp theo phiên chơi single-player ở chế độ xếp hạng.
- **ImportBatch**(id, createdBy, format, status, statsJSON, createdAt)
- **AuditLog**(id, actorUserId, action, entity, entityId, metaJSON, createdAt)
 - **AIGenerationJob**(id, createdBy, provider, modelId, status, prompt, scriptureRefJSON, optionsJSON, costUSD, createdAt, completedAt)
 - **AIGeneratedQuestionDraft**(id, jobId, draftJSON, validationStatus, validationErrorsJSON, approvedBy?, approvedAt?)

Ghi chú:
- `type` câu hỏi: multiple_choice_single, multiple_choice_multi, true_false, fill_in_blank.
- `difficulty`: easy, medium, hard (UI có thể nhóm Dễ/Khó = easy|hard; Tất cả = all).
- Lưu `language` để đa ngôn ngữ câu hỏi/giải thích. Với đa bản dịch: tách bảng `QuestionLocale(questionId, language, content, options, explanation)`.

### 5. Lược đồ cơ sở dữ liệu (đề xuất Postgres)
- Khóa chính UUID v7.
- Chỉ mục: `Question(book, chapter)`, `Answer(sessionId, userId)`, `Room(code unique)`, `Feedback(status)`, `Bookmark(userId)`, `Leaderboard(scope,key,periodStart)`.
- Ràng buộc: `Answer` unique `(sessionId, questionId, userId)`; `RoomMember` unique `(roomId, userId)`.
  - `UserDailyProgress` unique `(userId, date)`; index `(userId)`.
  - `TournamentParticipant` unique `(tournamentId, userId)`; `MatchParticipant` unique `(matchId, userId)`.
  - `MatchAnswer` unique `(matchId, questionId, userId)`.

### 6. Quy tắc chọn câu & chấm điểm
- **Chọn câu**: theo filter (books[], chapters[], difficulty[], tags[]), ngôn ngữ, exclude đã làm (tuỳ chọn), random seed cho công bằng.
- **Điểm**: mặc định 10 điểm/câu đúng + bonus theo tốc độ: `floor(max(0, timeLimitSec*1000 - elapsedMs)/500)`.
- **Đúng/Sai**: so sánh theo `type` (MCQ: set bằng nhau; true/false: bool; fill: chuẩn hoá lowercase, trim, alias/regex).
- **Leaderboard phòng**: tổng điểm trong `Room`; global: cộng dồn theo phiên/chu kỳ.

#### 6.1 Chế độ xếp hạng Single-player (Ranked)
- **Mục tiêu**: xếp hạng người chơi single-player theo điểm trong ngày/tuần/tổng.
- **Giới hạn câu hỏi tính hạng**: tối đa 50 câu/ngày/người. Vẫn có thể chơi tiếp (practice) nhưng điểm/câu vượt quá 50 không được tính vào leaderboard trong ngày.
- **Mạng (lives)**: mỗi ngày 10 mạng/người. Trả lời sai 1 câu → trừ 1 mạng. Khi hết mạng, người chơi vẫn có thể luyện tập nhưng điểm không cộng vào leaderboard cho đến khi reset ngày.
- **Điểm tính hạng**: chỉ cộng khi: (a) `livesRemaining > 0` tại thời điểm chấm câu, và (b) `questionsCounted < 50` trong ngày. Khi đạt trần 50 câu hoặc hết mạng, các câu tiếp theo không cộng điểm.
- **Reset**: reset theo mốc ngày UTC (hoặc theo `user.timezone` nếu hỗ trợ). Reset đồng thời: `livesRemaining=10`, `questionsCounted=0`, `pointsCounted=0`.
- **Gian lận & tính nhất quán**: cập nhật điểm, mạng, số câu trong 1 giao dịch; idempotent theo `(sessionId, questionId, userId)`; không cho phép nộp lại để hoàn điểm.
 - **Luật sách (book progression)**:
   - Ranking Mode không cho phép chọn sách. Thứ tự sách cố định: từ Sáng Thế Ký (Genesis) → ... → Khải Huyền (Revelation).
   - Server duy trì con trỏ sách hiện tại theo ngày trong `UserDailyProgress.currentBook` và `currentBookIndex`.
   - Khi người chơi đã trả lời hết pool câu hỏi được phục vụ của sách hiện tại trong phiên ranked, hệ thống tự động chuyển sang sách kế tiếp trong thứ tự trên và tiếp tục phục vụ câu hỏi.
   - Khi đến cuối danh sách (Khải Huyền): chuyển sang giai đoạn "hậu chu kỳ" (`isPostCycle=true`) và tăng độ khó (`currentDifficulty`), sau đó câu hỏi sẽ được lấy ngẫu nhiên từ bất kỳ sách nào theo độ khó hiện tại (ưu tiên hard, rồi medium nếu thiếu, cuối cùng easy nếu vẫn thiếu), cho đến khi đạt trần 50 câu/ngày hoặc hết mạng.

  - **Độ khó sau khi hoàn tất chu kỳ (escalation)**:
    - Trước khi hoàn tất chu kỳ sách: độ khó mặc định là hỗn hợp (all). Server có thể phục vụ câu hỏi với phân phối cân bằng theo kho câu hỏi.
    - Sau khi hoàn tất Khải Huyền lần đầu trong ngày: đặt `currentDifficulty = 'hard'`.
    - Nếu kho hard không đủ (theo tiêu chí chưa phục vụ trong ngày): fallback lần lượt `medium` → `easy` theo cấu hình.
    - `currentDifficulty` giữ nguyên ở 'hard' trong suốt hậu chu kỳ. Chỉ fallback tạm thời cho từng lượt chọn khi thiếu nguồn.
    - Không reset về 'all' cho đến khi ngày mới (reset daily) hoặc admin thay đổi cấu hình.

  - **Thuật toán chọn câu (post-cycle)**:
    1) Xác định `targetDifficulties = [hard, medium, easy]` (có thể cấu hình). Bắt đầu từ đầu danh sách.
    2) Với mỗi độ khó trong `targetDifficulties`, truy vấn tập câu hỏi chưa phục vụ trong ngày cho user (exclude set theo `Answer`/bộ nhớ cache daily) với `difficulty` tương ứng, từ bất kỳ sách nào.
    3) Lấy mẫu ngẫu nhiên có trọng số theo sách để tránh dồn một sách (ví dụ: trọng số nghịch với số câu đã phục vụ theo sách trong ngày: `w(book) = 1 / (1 + servedCount(book))`).
    4) Nếu vẫn không đủ, cho phép lấy lại câu đã phục vụ trong ngày nhưng ưu tiên những câu cách xa thời gian gần nhất (LRU) — chỉ áp dụng khi người chơi chưa đạt trần 50 câu và còn mạng.
    5) Mọi lựa chọn đều sử dụng seed theo ngày + userId để đảm bảo công bằng/ngẫu nhiên ổn định.

### 7. API thiết kế (REST + Realtime)

#### 7.1 Xác thực & phiên
- **POST** `/auth/oauth/start` body: `{ provider }` → redirect URL (web) hoặc bắt đầu PKCE (mobile).
- **POST** `/auth/oauth/callback` body: `{ provider, code, codeVerifier }` → `{ accessToken, refreshToken, user }`.
- **POST** `/auth/login` `{ email, password }` → tokens.
- **POST** `/auth/refresh` `{ refreshToken }` → tokens.
- **POST** `/auth/logout` → 204.

Headers: `Authorization: Bearer <accessToken>`. AccessToken TTL 15m, Refresh 30d, rotate refresh.

#### 7.2 Người dùng
- **GET** `/me` → hồ sơ, thống kê nhanh.
- **PATCH** `/me` → cập nhật tên/avatar/ngôn ngữ.

#### 7.3 Câu hỏi & thư viện
- **GET** `/books` → danh sách sách.
- **GET** `/questions` query: `book, chapter, difficulty, tags, q, limit, cursor, language`.
- **GET** `/questions/{id}` → chi tiết + giải thích (nếu `?include=explanation` hoặc role admin/owner).
- **POST** `/admin/questions` (ADMIN) → tạo câu.
- **PUT** `/admin/questions/{id}` (ADMIN) → cập nhật.
- **DELETE** `/admin/questions/{id}` (ADMIN) → xoá/ẩn.
- **POST** `/admin/import` file CSV/JSON + `dryRun` → `ImportBatch`.
- **GET** `/admin/import/{id}` → trạng thái, thống kê.

#### 7.3.1 Admin AI Question Generator
- **POST** `/admin/ai/generate` body: `{ scripture: { book, chapter, verseStart, verseEnd, text? }, prompt?, modelId?, count?, difficulty?, language?, type? }` → tạo `AIGenerationJob` (status=pending) và enqueue. Trả về `{ jobId }`.
- **GET** `/admin/ai/jobs/{jobId}` → trạng thái job, danh sách draft (nếu có).
- **POST** `/admin/ai/drafts/{draftId}/approve` → chuyển draft thành `Question` (lưu DB), trả về `questionId`.
- **PUT** `/admin/ai/drafts/{draftId}` → cập nhật nội dung draft trước khi approve.
- **DELETE** `/admin/ai/drafts/{draftId}` → loại bỏ draft không dùng.

#### 7.4 Single-player & Practice
- **POST** `/sessions` body: `{ mode: "single"|"practice", ranked?: boolean, config }` → `QuizSession` + danh sách `QuizSessionQuestion` (ẩn đáp án).  
  - Nếu `ranked=true`: server kiểm tra trạng thái ngày của user; trả về thêm `{ rankedStatus }`.
- **POST** `/sessions/{id}/answer` body: `{ questionId, answer, clientElapsedMs }` → `{ isCorrect, correctAnswer, scoreDelta, explanation?, rankedApplied, livesRemaining, questionsCounted, pointsCounted }`.
- **GET** `/sessions/{id}` → trạng thái, điểm, tiến độ.
- **GET** `/sessions/{id}/review` → lịch sử đáp án + giải thích.

#### 7.4.1 Ranked status (Single-player)
- **GET** `/me/ranked-status` → `{ date, livesRemaining, questionsCounted, pointsToday, cap: 50, dailyLives: 10, currentBook, currentBookIndex, isPostCycle, currentDifficulty, nextBook?, resetAt }`.
- **POST** `/me/ranked-reset` (ADMIN/support hoặc chạy bởi scheduler) cho mục đích đặc biệt.

Ghi chú API: Khi `ranked=true`, trường `config.books` (nếu client gửi) bị bỏ qua; server tự chọn sách theo `currentBookIndex`.

#### 7.4.2 Practice Mode (Tự luyện)
- **Mục tiêu**: luyện tập không giới hạn, không ảnh hưởng leaderboard, lưu lịch sử cá nhân.
- **Quy tắc**:
  - Không giới hạn số câu; không có mạng.
  - Điểm trong phiên được hiển thị để phản hồi tức thời nhưng không ghi vào leaderboard.
  - Lưu lịch sử câu đã làm để người chơi xem lại và học.
- **Tuỳ chọn cấu hình** (`config`):
  - `books`: mảng sách hoặc bộ (ví dụ: ["Genesis"], ["Matthew"], ["NewTestament"], hoặc `all`).
  - `difficulty`: `easy|medium|hard|all`.
  - `questionCount`: số câu muốn chơi (ví dụ 10, 20, 50, hoặc `unlimited` nếu hỗ trợ paging/stream).
  - `showExplanationOnSubmit`: boolean (bật/tắt giải thích ngay sau mỗi câu).
- **API phụ trợ**:
  - **POST** `/sessions` với `mode="practice"` và `config` như trên.
  - **POST** `/sessions/{id}/retry` → tạo lại một phiên practice mới với cùng `config` và (tuỳ chọn) cùng nguồn chọn câu (seed). Trả về `newSessionId`.
  - Hoặc **POST** `/sessions/practice/retry-last` → dựa trên `lastPracticeConfig` của user nếu chưa có `sessionId`.
  - Đảm bảo không cộng bất kỳ điểm nào từ practice vào bất kỳ leaderboard nào.

#### 7.5 Multiplayer Room (REST)
- **POST** `/rooms` body: `{ timePerQuestionSec, maxPlayers, filters, visibility }` → `Room { code }`.
- **POST** `/rooms/{id}/join` → tham gia.
- **POST** `/rooms/{id}/start` (host) → phát đề (server seed, danh sách câu, thời lượng).
- **POST** `/rooms/{id}/kick` (host) `{ userId }`.
- **GET** `/rooms/{id}` → thông tin phòng, bảng điểm tạm thời.

#### 7.6 Multiplayer Realtime (WebSocket)
Kênh: `wss://api.example.com/rooms/{roomId}`
- Client → Server:
  - `join`: `{ accessToken }`
  - `ready`: `{}`
  - `answer`: `{ questionId, answer, clientElapsedMs }`
  - `leave`: `{}`
- Server → Client:
  - `state`: `{ status: lobby|in_progress|ended, players[], currentQuestion?, remainingMs }`
  - `question`: `{ id, content, options, timeLimitSec, order }`
  - `answer_result`: `{ userId, isCorrect, scoreDelta }`
  - `scoreboard`: `{ rankings: [{ userId, score }], questionOrder }`
  - `ended`: `{ finalRankings }`
  - `error`: `{ code, message }`

#### 7.6.1 Tournament Mode (Realtime 1v1)
- Sự kiện mở rộng trong cùng kênh phòng tournament hoặc kênh con `.../tournament/{tournamentId}`:
  - Client → Server:
    - `tournament_join`: `{ accessToken }`
    - `tournament_ready`: `{}`
    - `match_answer`: `{ matchId, questionId, answer, clientElapsedMs }`
  - Server → Client:
    - `tournament_state`: `{ status: lobby|seeding|in_progress|completed, participants[], bracket? }`
    - `match_start`: `{ matchId, round, p1: { userId, lives: 3 }, p2: { userId, lives: 3 }, timePerQuestionSec }`
    - `match_question`: `{ matchId, id, content, options, timeLimitSec, order }`
    - `match_update`: `{ matchId, p1Lives, p2Lives, lastAnswer: { userId, isCorrect } }`
    - `match_end`: `{ matchId, winnerUserId, reason: 'lives_out'|'time'|'forfeit'|'tiebreak' }`
    - `bracket_update`: `{ round, matches: [...] }`

#### 7.7 Lịch sử, bookmark, góp ý
- **GET** `/me/history` query: `limit, cursor` → danh sách `QuizSession` rút gọn.
- **GET** `/me/history/{sessionId}` → chi tiết.
- **POST** `/me/bookmarks` `{ questionId }` / **DELETE** `/me/bookmarks/{questionId}`.
- **GET** `/me/bookmarks`.
- **POST** `/feedback` `{ type, questionId?, content }`.
- **GET** `/admin/feedback` (ADMIN) filter/trạng thái; **PATCH** `/admin/feedback/{id}` cập nhật trạng thái.

#### 7.8 Leaderboard
- **GET** `/leaderboard/global` query: `period=daily|weekly|all, limit=100`.
- **GET** `/rooms/{id}/leaderboard`.
 - **GET** `/leaderboard/single` query: `period=daily|weekly|all, limit=100`  
   - `scope=single_global`, xếp theo `pointsCounted` trong period. Chỉ tính điểm hợp lệ theo luật Ranked.

### 7.9 Tournament Mode (REST)
- **POST** `/tournaments` body: `{ roomId, name?, maxPlayers?, timePerQuestionSec, books?, difficulty?, questionsPerMatch?, seeding?: 'random'|'by_score' }` → `Tournament` (status=lobby).
- **POST** `/tournaments/{id}/join` → tham gia tournament (trước khi bắt đầu).
- **POST** `/tournaments/{id}/start` (host/admin) → khoá danh sách, tạo bracket, tạo `Match` vòng 1 (chia cặp; nếu lẻ người: cấp bye).
- **GET** `/tournaments/{id}` → trạng thái, bracket, matches.
- **GET** `/tournaments/{id}/matches/{matchId}` → chi tiết trận.
- **POST** `/tournaments/{id}/matches/{matchId}/forfeit` → bỏ cuộc.

Ghi chú: Mỗi trận là 1v1, mỗi người 3 mạng; sai 1 câu trừ 1 mạng. Hết mạng → thua trận. Nếu hết câu mà chưa phân thắng bại: tie-break bằng câu nhanh (sudden death) hoặc so điểm/tốc độ.

### 8. Mã lỗi & quy ước HTTP
- 200 OK, 201 Created, 204 No Content.
- 400 ValidationError, 401 Unauthorized, 403 Forbidden, 404 NotFound.
- 409 Conflict (join phòng đã đầy), 422 Unprocessable (đáp án không hợp lệ), 429 Too Many Requests.
- 5xx Internal/Upstream.
Body lỗi chuẩn: `{ code, message, details? }`.

### 9. Định dạng câu hỏi (ví dụ)

#### 9.1 JSON (import/export)
```json
{
  "id": "uuid-v7",
  "book": "Genesis",
  "chapter": 1,
  "verseStart": 1,
  "verseEnd": 3,
  "difficulty": "easy",
  "type": "multiple_choice_single",
  "language": "vi",
  "content": "Trong Sáng Thế Ký 1:1, Đức Chúa Trời đã làm gì?",
  "options": [
    "Dựng nên trời và đất",
    "Dựng nên con người",
    "Phán xét thế gian",
    "Lập giao ước với Áp-ra-ham"
  ],
  "correctAnswer": 0,
  "explanation": "Sáng Thế Ký 1:1: Ban đầu Đức Chúa Trời dựng nên trời và đất.",
  "tags": ["st1", "sangkheky"],
  "source": "Kinh Thánh"
}
```

#### 9.2 CSV (import)
```csv
book,chapter,verseStart,verseEnd,difficulty,type,language,content,options,correctAnswer,explanation,tags
Genesis,1,1,1,easy,multiple_choice_single,vi,"Trong Sáng Thế Ký 1:1, Đức Chúa Trời đã làm gì?","[\"Dựng nên trời và đất\",\"Dựng nên con người\",\"Phán xét thế gian\",\"Lập giao ước với Áp-ra-ham\"]",0,"Sáng Thế Ký 1:1: Ban đầu Đức Chúa Trời dựng nên trời và đất.","[\"st1\",\"sangkheky\"]"
```

Quy tắc import: validate bắt buộc trường, ràng buộc `options` theo `type`, tự map `difficulty`, chuẩn hoá `book` theo danh mục.

### 10. Flow UI chính

#### 10.1 Single-player/Practice
1) Trang chọn chế độ → chọn sách/bộ câu → số câu → độ khó → bật/ tắt giải thích → bật/tắt Xếp hạng (Ranked) → Bắt đầu.  
   - Khi bật Ranked: UI khoá lựa chọn sách và hiển thị "Sách hiện tại: <currentBook> (tự động chuyển sách kế tiếp khi hoàn tất)".
2) Màn chơi: hiển thị câu hỏi, đồng hồ đếm ngược, chọn đáp án, nộp.
3) Phản hồi: đúng/sai, điểm cộng; hiển thị số mạng còn lại, bộ đếm câu đã tính (x/50), sách hiện tại; nút xem giải thích (nếu bật).
4) Kết thúc: tổng kết điểm, danh sách câu, xem lại đáp án/giải thích, CTA luyện tiếp; nếu Ranked đạt trần 50 câu hoặc hết mạng, hiển thị thông báo và đường dẫn leaderboard.

#### 10.2 Multiplayer Room
1) Chủ phòng tạo phòng → nhận mã/code/link.
2) Thành viên nhập mã → vào sảnh, thấy danh sách người chơi, chờ host bắt đầu.
3) Khi bắt đầu: server phát từng câu, đồng hồ chung. Sau mỗi câu: bảng xếp hạng tạm.
4) Kết thúc: bảng xếp hạng cuối, chia sẻ kết quả, mời chơi lại.

#### 10.4 Tournament Mode (loại trực tiếp 1v1)
1) Người chơi vào phòng tournament (ví dụ tối đa 10 người) → nhấn sẵn sàng.
2) Khi đủ người/host bắt đầu: hệ thống seeding và tạo bracket.
3) Mỗi cặp đấu 1v1: mỗi người có 3 mạng; mỗi câu sai trừ 1 mạng. Khi một bên hết 3 mạng → đối thủ thắng trận.
4) Sau trận: cập nhật bracket, người thắng đi tiếp vòng sau; lặp lại cho đến chung kết.
5) Với số người lẻ: cấp bye (vào thẳng vòng sau). Hiển thị bracket cập nhật theo thời gian thực.

#### 10.3 Admin
- CRUD câu hỏi, import tệp (preview, dry-run, commit), duyệt góp ý, dashboard analytics.
 - **AI Question Generator**: trang nhập Scripture + Prompt → Generate → duyệt/sửa JSON draft → Lưu câu hỏi.
   1) Form nhập: book, chapter, verse range, trích dẫn text (tuỳ chọn fetch tự động), difficulty, type, language, số lượng.
   2) Prompt: hiển thị prompt mặc định (có biến {scriptureText}, {book}, {chapter}, {verses}, {difficulty}, {language}, {type}, {count}); cho phép chỉnh.
   3) Nút Generate: gửi `/admin/ai/generate` → hiển thị trạng thái job và tiến trình.
   4) Kết quả: bảng draft JSON; chọn 1 draft để xem chi tiết, sửa nội dung (content/options/explanation/tags/source/difficulty).
   5) Validate: chạy validator client-side (schema JSON) và server-side; hiển thị lỗi.
   6) Approve: lưu thành `Question`; có tuỳ chọn "Auto-approve if valid".
   7) Nhật ký: hiển thị chi phí ước tính, model, prompt đã dùng (mask thông tin nhạy cảm), audit log.

### 11. Đề xuất tech stack
- **Frontend Web**: React + Next.js (App Router) hoặc Vite SPA, TypeScript, TailwindCSS, Zustand/Redux, i18next.
- **Mobile (tuỳ chọn)**: React Native/Expo, chia sẻ logic với web (monorepo).

- **Backend (Java - khuyến nghị theo yêu cầu)**: Spring Boot (Web, Security, OAuth2 Client/Resource Server, WebSocket), Spring Data JPA (Hibernate), MapStruct, Jakarta Validation.
- **Database**: MySQL (AWS RDS). Duy trì các chỉ mục/unique như mô hình ở trên.
- **Realtime**: Spring WebSocket (STOMP hoặc native WS); Redis Pub/Sub (AWS ElastiCache) cho fanout/scale-out.
- **Auth**: Spring Security + JWT (access/refresh), OAuth2 (Google/Facebook) qua Spring Authorization Server hoặc tài khoản xã hội trực tiếp.
- **Queue/Jobs**: AWS SQS (Spring Cloud AWS) cho import/analytics/AI generate.
- **Cache**: Redis (ElastiCache) cho session/room state/leaderboard cache.
- **File storage**: S3 (import tệp, log, assets).
- **AI**: AWS Bedrock (Java SDK) gọi qua backend; prompt templates lưu ở server.

- **Infrastructure (AWS)**: RDS MySQL, ElastiCache Redis, S3, CloudFront (FE), ACM (TLS), ALB + ECS Fargate (hoặc Elastic Beanstalk/EKS), API Gateway (tuỳ chọn), CloudWatch + X-Ray.
- **CI/CD**: GitHub Actions → ECR → ECS/EKS/EB. IaC: Terraform hoặc AWS CDK.
- **Observability**: OpenTelemetry (javaagent) → CloudWatch/OTel collector; Sentry/Datadog (tuỳ chọn).

### 12. Kiến trúc & module hoá
- `auth-service`: OAuth, JWT, refresh, RBAC.
- `quiz-service`: câu hỏi, chọn câu, chấm điểm, lịch sử, bookmark.
- `room-service`: tạo phòng, đồng bộ câu, thu đáp án, bảng điểm realtime.
- `content-service`: import/CRUD câu hỏi, i18n, duyệt góp ý.
- `analytics-service`: tổng hợp leaderboard, top câu hỏi, khó/dễ, retention.

Giao tiếp: REST nội bộ + hàng đợi (BullMQ) cho job (import, analytics), Redis cho pub/sub phòng.

### 13. Trạng thái phòng (state machine)
- `lobby` → `in_progress` → `ended`.
- Sự kiện: `host_start`, `question_timeout`, `all_answered`, `host_end`.
- Bảo đảm: mỗi câu có `timeLimitSec`; khi hết giờ phát `scoreboard`.

#### 13.1 Trạng thái Tournament & Match
- Tournament: `lobby` → `seeding` → `in_progress` (vòng 1..n) → `completed`.
- Match: `pending` → `in_progress` → `ended`.
- Sự kiện trận: `match_start`, `match_question_timeout`, `match_answer_submitted`, `match_player_out_of_lives`, `match_end`.
- Logic mạng: khởi tạo `lives=3`/người/trận; cập nhật trong giao dịch khi chấm câu; broadcast `match_update`.

### 14. Bảo mật & chống gian lận
- Tính điểm ở server; client chỉ hiển thị.
- Ký payload câu hỏi bằng server seed để chống đoán trước.
- Debounce nộp đáp án, chặn thay đổi nhiều lần; lưu `clientElapsedMs` + đo server timestamp.
- Rate limit: IP/user, đặc biệt `/auth`, `/rooms/*/answer`.
- reCAPTCHA v3 cho góp ý/đăng ký email.

### 15. Analytics & leaderboard
- Sự kiện: session_started, question_answered, session_ended, room_created, room_started, feedback_sent.  
  - Ranked: ranked_status_viewed, ranked_answer_counted, ranked_life_lost, ranked_cap_reached, ranked_reset.
  - Tournament: tournament_created, tournament_started, match_started, match_answered, match_life_lost, match_finished, tournament_completed.
- Leaderboard tính batch định kỳ (daily/weekly) + cập nhật gần thời gian thực bằng Redis ZSET.

### 16. Cấu hình & biến môi trường
- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `OAUTH_GOOGLE_*`, `OAUTH_FACEBOOK_*`, `WEBSOCKET_ORIGIN`, `FILE_STORAGE_S3_*`.
 - `DAILY_QUESTION_CAP=50`, `DAILY_LIVES=10`, `RANKED_RESET_CRON=0 0 * * *` (UTC) hoặc theo múi giờ.
 - `TOURNAMENT_LIVES_PER_PLAYER=3`, `TOURNAMENT_DEFAULT_TIME_PER_QUESTION=15`, `TOURNAMENT_MAX_PLAYERS=64`.
 - AI: `BEDROCK_REGION`, `BEDROCK_MODEL_ID`, `BEDROCK_ACCESS_KEY_ID`, `BEDROCK_SECRET_ACCESS_KEY`, `AI_MAX_GENERATE_COUNT`, `AI_DEFAULT_LANGUAGE`.

### 17. Cấu trúc thư mục (đề xuất monorepo)
```
apps/
  web/            # Next.js UI
  api/            # NestJS REST + WS
packages/
  types/          # DTO/shared types
  ui/             # UI kit
  utils/          # shared libs
infra/
  docker/         # Dockerfiles, compose
  prisma/         # schema.prisma, migrations
```

### 18. Hợp đồng DTO (ví dụ rút gọn)
```ts
// QuestionDTO
type QuestionDTO = {
  id: string;
  book: string;
  chapter?: number;
  verseStart?: number;
  verseEnd?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple_choice_single' | 'multiple_choice_multi' | 'true_false' | 'fill_in_blank';
  language: string;
  content: string;
  options?: string[];
};

// AnswerRequest
type AnswerRequest = {
  questionId: string;
  answer: number | number[] | boolean | string;
  clientElapsedMs: number;
};
```

### 19. Quy trình import CSV/JSON
1) Upload tệp → tạo `ImportBatch(status=pending)`.
2) Worker đọc, validate, tạo preview (kết quả, lỗi, map sách/độ khó), `status=ready`.
3) Admin bấm commit → ghi chính thức, cập nhật `statsJSON` (số tạo, cập nhật, bỏ qua), audit log.

### 20. Kiểm thử & chất lượng
- Unit test: chọn câu, chấm điểm, tính điểm tốc độ, regex fill-in.
- Integration: OAuth callback, flow phòng, race condition WS.
  - Ranked: kiểm tra trừ mạng khi sai, không cộng điểm khi hết mạng, dừng cộng điểm sau 50 câu, idempotency nộp đáp án.
  - Tournament: bracket với số người lẻ (bye), trừ mạng đúng khi sai câu, kết thúc trận khi hết mạng, sudden death khi hoà, đồng bộ realtime 2 người trong trận và spectator.
- Load test: 100 người/phòng, 10 phòng song song.
- E2E: luồng Single-player, tạo/thi phòng, review lịch sử.
 - Admin AI: mock Bedrock, kiểm thử validator schema draft, approve tạo Question, kiểm soát chi phí (limit count), phân quyền endpoint.

### 21. Roadmap gợi ý
- v1: Single-player, OAuth, thư viện câu, lịch sử, góp ý, admin CRUD/import, WS phòng cơ bản.
- v1.1: Leaderboard global, bookmark, practice theo chương.
- v1.2: Mobile app, đa ngôn ngữ câu hỏi, analytics nâng cao.

### 22. Ghi chú triển khai nhanh
- Với Java Spring + MySQL trên AWS:
  - Dựng Spring Boot project (Gradle/Maven) với modules: auth, quiz, room, ranked, tournament, admin-ai.
  - RDS MySQL + Flyway/Liquibase migrations (UUID, chỉ mục, unique constraints theo README).
  - Redis ElastiCache cho session/WS pubsub; S3 cho import; SQS cho jobs.
  - OAuth Google/Facebook qua Spring Security OAuth2 Client; JWT Resource Server.
  - WebSocket endpoint `/ws` (STOMP), phân kênh room/tournament.
  - Triển khai ECS Fargate + ALB; FE React build đẩy lên S3 + CloudFront.

### 23. Scaffold đề xuất (khung dự án)

```
apps/
  web/
    src/
      app/                       # Next.js hoặc Vite + React Router
        (marketing)/
        admin/
          ai-generator/          # Trang AI generate
          questions/             # CRUD câu hỏi
        player/
          ranked/
          practice/
          room/
        api/                     # fetchers (axios ky)
      components/
      hooks/
      store/
      styles/
    package.json
    vite.config.ts | next.config.js

  api/
    src/
      main/java/com/biblequiz/
        config/
        auth/
        quiz/
        ranked/
        room/
        tournament/
        adminai/
        common/
      main/resources/
        application.yml
        db/migration/            # Flyway scripts
    build.gradle | pom.xml

infra/
  terraform/                     # (tuỳ chọn) RDS, ElastiCache, S3, ECS, ALB
  docker/
    api.Dockerfile
    web.Dockerfile
  compose.yml                    # local dev: mysql, redis, api, web

.github/workflows/
  ci.yml                         # build & test
  cd.yml                         # deploy ECS/CloudFront
```

Endpoints v1 cần có (skeleton):
- Auth: `/auth/oauth/*`, `/auth/refresh`, `/auth/logout`, `/me`.
- Quiz: `/books`, `/questions`, `/questions/{id}`.
- Sessions: `/sessions`, `/sessions/{id}/answer`, `/me/ranked-status`.
- Rooms: `/rooms`, `/rooms/{id}/join|start` (WS kênh `/ws/rooms/{id}`).
- Tournament: `/tournaments/*` + kênh `/ws/tournament/{id}`.
- Admin AI: `/admin/ai/generate`, `/admin/ai/jobs/{id}`, `/admin/ai/drafts/*`.

Env mẫu (API):
```
SPRING_PROFILES_ACTIVE=dev
DB_URL=jdbc:mysql://localhost:3306/biblequiz
DB_USER=root
DB_PASS=pass
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=change_me
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
S3_BUCKET=biblequiz-dev
AWS_REGION=ap-southeast-1
SQS_QUEUE_URL=...
BEDROCK_REGION=...
BEDROCK_MODEL_ID=...
```

Lệnh khởi động local:
```
# Backend
./mvnw spring-boot:run  # hoặc ./gradlew bootRun

# Frontend (Vite)
npm i && npm run dev

# Compose dev services
docker compose up -d  # mysql, redis
```

---
Tài liệu này nhằm giúp bạn có thể bắt tay xây dựng ngay với lõi Single-player, sau đó mở rộng Multiplayer, Admin và Analytics theo module.

