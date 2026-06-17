# apps/web — Tri thức nghiệp vụ (BibleQuiz Frontend)

> **React 18 + TypeScript + Vite + Zustand + TanStack Query.** Đây là tài liệu **COMPANION** cho domain backend
> canonical ([apps/api/DOMAIN.md](../api/DOMAIN.md)). Chỉ ghi hành vi domain **phía client**: cái gì FE *mirror*
> vs *trust* từ API, presentation invariant (đặt tên C1–C3), xử lý STOMP, optimistic UI, và rủi ro phía client.
> **Business rule thuộc backend — trỏ về apps/api/DOMAIN.md.**
>
> **Nhãn tin cậy:** `[OBS]` quan sát trong code · `[CANDIDATE]` suy luận · `[?]` chưa rõ · `[✔]` đã xác nhận.
> Draft 2026-06-11, branch `feat/liturgical-coverage`. **Git-tracked** (chia sẻ team từ commit 5170ada).
> ⚠️ Số dòng dễ trôi; nav theo **symbol** (Serena project `web`).

---

## 0. Kiến trúc client

- **Env:** `VITE_API_BASE_URL` (rỗng ở prod → same-origin qua nginx; dev → `http://localhost:8080`),
  `VITE_WS_URL`/ws base suy ra (`/ws`). Config ở `src/api/config.ts`.
- **HTTP:** axios ở `src/api/client.ts` — `api` (10s, `withCredentials` cho cookie refresh httpOnly),
  `aiApi` (90s, Gemini). Interceptor 401 → refresh + retry (chưa single-flight, xem F-web-1).
- **Access token:** **chỉ ở memory** (`src/api/tokenStore.ts`, an toàn XSS); refresh token ở **cookie httpOnly**;
  profile user cache localStorage nhưng bản authoritative từ `/api/me` (`src/store/authStore.ts`).
- **Store (Zustand):** `authStore` (user/auth/admin), `onboardingStore` (persist: đã-onboarding, ngôn ngữ). Token store tách riêng (không persist).
- **Realtime:** `src/hooks/useStomp.ts` — connect `/ws`, subscribe `/topic/room/{id}`, send `/app/room/{id}/{action}`; Bearer lúc connect+publish; reconnect 2s, heartbeat 10s. `[✔ fix 2026-06-12]` `beforeConnect` đọc lại token hiện hành **mỗi lần (re)connect** — trước đây `connectHeaders` đóng băng lúc tạo client, token stale làm retry chết mãi tới F5 (triệu chứng: nút "Sẵn sàng" chết). Wrapper typed: `src/hooks/useRoomChannel.ts` (FMR-2).
- **Query:** TanStack Query (`src/main.tsx`), retry 3× backoff, staleTime 5m. Đồng bộ cross-tab qua `initStorageSync()`.
- **i18n:** react-i18next, **hai locale** `src/i18n/vi.json` (chính) + `en.json`.

---

## 1. ⭐ Mirror vs Trust — hợp đồng cốt lõi [OBS]

> Về scoring/state, FE là **bản render thuần của sự thật server**. Nó không tự tính gì authoritative.

- `[OBS]` **Điểm không bao giờ tính ở client.** Điểm authoritative đến từ server (`ANSWER_SUBMITTED`/`ROUND_END`/leaderboard). FE chỉ tính delta cục bộ cho thẻ reveal-stats (cosmetic) (`RoomQuiz.tsx`).
- `[OBS]` **Trạng thái ranked đọc từ `/api/me/ranked-status`** (`useRankedPage`, `useRankedDataSync`): `livesRemaining`, `questionsCounted`, `pointsToday`, `cap`, `resetAt`, `askedQuestionIdsToday`. Cache localStorage (`rankedSnapshot`, key theo ngày), xoá khi sang ngày / login. Sync ngược qua `/api/ranked/sync-progress` trước logout. **FE không tự enforce cap** — server là cổng chặn.
- `[OBS]` **Câu hỏi room không cache** — gửi qua STOMP `QUESTION_START`; rehydrate REST `GET /api/rooms/{id}/current-question` lúc mount **và mỗi lần reconnect** qua `useRoomChannel` (FMR-2) ở cả RoomQuiz + RoomQuizHost + RoomLobby. `[✔]` F-web-4 đã fix 2026-06-12.
- `[OBS]` **Đáp án đúng giữ kín tới lúc reveal** — `correctIndex=null` lúc `QUESTION_START`, set khi `ROUND_END`/`QUESTION_REVEALED`. Cả view player lẫn Quản trò (anti-spoiler là trách nhiệm của payload server).
- `[OBS]` **Định danh player = `userId` server, không phải `username`** — `localStorage.userName` có thể trôi; `PLAYER_ELIMINATED`/`ANSWER_SUBMITTED`/`TEAM_ASSIGNMENT` match theo `userId` (fix d504299b).
  - `[✔ phát hiện quan trọng 2026-06-12]` **`localStorage 'userId'` chưa từng được app ghi** — nguồn id đáng tin duy nhất là `viewerUserId` từ REST. Đã wire: RoomLobby truyền `viewerUserId` qua nav state sang /quiz + /host; RoomQuiz nâng cấp từ `GET /api/rooms/{id}` lúc mount (sống qua F5); `QuizEndScreen` nhận prop `myUserId`, match `playerId` trước, username chỉ là fallback.
  - Residual F-web-2: `RoundScoreboard`/`SdArenaHeader`/`SequentialFinalView` vẫn match "tôi" bằng username nội bộ (đổi prop contract sẽ đụng test — để sprint sau).
- `[OBS]` **Timer neo theo server** — countdown tính lại mỗi ~250ms từ `QUESTION_START.startedAtMs` (không decrement cục bộ) → kháng tab-sleep. Ở `Quiz.tsx` solo, decrement 1s tự submit index `-1` khi về 0.
- `[CANDIDATE]` **Combo streak (banner 5/10) chỉ FE** — cosmetic; không ảnh hưởng điểm server.
- `[CANDIDATE]` **Trạng thái nút trả lời là optimistic** tới `ROUND_END`; submit chưa xác nhận có thể mất khi WS gián đoạn (không retransmit) → F-web-3.

---

## 2. Presentation invariant (C1–C3) [✔ qua i18n]

> Đặt tên canonical nằm ở key i18n, **không hardcode** — tốt. Test assert đúng chuỗi VN.

- `[✔]` **C1 Tên tier** — `src/data/tiers.ts` dùng `nameKey: 'tiers.<key>'`: Tân Tín Hữu / Người Tìm Kiếm / Môn Đồ / Hiền Triết / Tiên Tri / Sứ Đồ (cấp 1–6, mỗi cấp 1 emoji + Material icon). Resolve qua `getTierInfo()`/`getTierByPoints()`. Ngưỡng thuộc BE (apps/api/DOMAIN.md §3.3).
- `[✔]` **C2 Tên mode** — `gameModes.practice="Luyện Tập"`, `gameModes.ranked="Đấu Hạng"`. Không có "Leo Rank"/"Thi Đấu Ranked" ở đâu cả; test verify (`HeroRankedCard.test.tsx`, `BasicQuiz.test.tsx`).
- `[✔]` **C3 Mùa** — key `seasonNames` `phucSinh/nguTuan/camTa/giangSinh`. ⚠️ BE trả enum SCREAMING_SNAKE (`EASTER`...) → FE map sang key lowercase; verify lớp mapping (F-web-6).
- `[OBS]` PoolExhausted dùng tone êm dịu 🌙 (`PoolExhaustedModal`, §7.11.4); modal WeekComplete delay 800ms sau kết quả với mảng câu Kinh Thánh theo mùa (`WeekCompleteModal`, `returnObjects:true`).

---

## 3. Bản đồ trang

**Solo:** `Quiz.tsx` (engine: practice/mystery/speed/ranked, timer, submit kèm `clientElapsedMs`, gauge lives, reveal) · `Ranked.tsx` (hub: energy/cap, đếm ngược mùa, thẻ tier, tuần coverage, pool-exhausted, lên tier) · `RankedQuizResults.tsx` (3 trạng thái: thường/lên-tier/hết-năng-lượng) · `DailyChallenge.tsx` (xem §3.1) · `Leaderboard.tsx` (tab all-time/season/weekly).

### 3.1 Daily Challenge phía client — đào sâu 2026-06-12 [OBS]
> Luật canonical ở BE: apps/api/DOMAIN.md §5.1. Khác mọi mode khác: **điểm daily do CLIENT tính**.
- `[OBS]` 2 trạng thái trang: ready (hero CTA + recap hôm qua từ `/yesterday-summary`) / done (điểm + percentile + badge XP); kèm leaderboard, streak, heatmap 30 ngày (`/history`).
- `[OBS]` Chấm từng câu qua `POST /answer` (server trả isCorrect + explanation — đáp án KHÔNG có sẵn trong payload đề, anti-spoiler; chỉ sau khi complete thì GET mới reveal cho modal "Xem lại").
- `[OBS]` **Điểm = client tính `correctCount × 20`** rồi `POST /complete {score, correctCount}` — server tin con số này (trade-off có chủ ý, biên chặn ở BE; phần thưởng thật là +50 XP cố định khi ≥4/5). FE ưu tiên `apiData.score` nếu server trả về.
- `[OBS]` Idempotent phía UX: vào lại trang khi đã hoàn thành → `alreadyCompleted` → hiện done-state, không cho chơi lại.
- `[CANDIDATE]` Countdown "đề mới sau Xh" dựa `nextResetAt` từ BE — đang lệch 7h (F-api-13, BE); FE không cần sửa, chờ BE.

**Multiplayer:** `CreateRoom.tsx` (form 4 mode, gửi `language`) · `JoinRoom.tsx` (QR `?code=` auto-join) · `RoomLobby.tsx` (ROOM_STATE, toggle ready, đổi đội, chat) · `RoomQuiz.tsx` (composition point ~470 LOC sau FMR-4: `roomQuizCore` reducer + per-mode hooks `room/hooks/*` + `RoomQuizShell` + views `room/views/*`) · `room/RoomQuizHost.tsx` (Quản trò, redesign TV 2026-06-12: 2 cột, đáp án C5, timer đổi màu, controls pill mờ; wrap-up = podium "Chúc mừng nhà vô địch!" + nút "Tiếp tục" trong overlay pause) · `Multiplayer.tsx` (duyệt phòng, poll 10s; card hiện "Vào lại" cho host/player rejoin) · `multiplayer/QuickMatchConfigModal.tsx` + `QuickMatchEntryCard.tsx`.

`[✔]` SPEED_RACE full flow (tạo Quản trò → ready → chơi → wrap-up TV) user test OK trên dev 2026-06-12.

---

## 4. STOMP event → state (phía client) [OBS]

- `[OBS]` Core: `QUESTION_START`→set câu/timer/clear answer · `ROUND_END`→set correctIndex + re-sort + sound/haptic · `QUESTION_REVEALED`→reveal (sequential) · `SCORE_UPDATE`/`LEADERBOARD_UPDATE`→re-sort điểm · `SEQUENTIAL_PROGRESS`→thanh answered/total · `QUIZ_END`→podium · `ROOM_ENDED`→điều hướng đi (reason).
- `[OBS]` Theo mode (`RoomQuiz.tsx`): `PLAYER_ELIMINATED` (match userId→màn elimination) · `BATTLE_ROYALE_UPDATE` (active/total) · `TEAM_ASSIGNMENT`/`TEAM_SCORE_UPDATE`/`PERFECT_ROUND` · `MATCH_START`/`MATCH_END` (sudden death, định danh theo id) · `CHAT_MESSAGE`/`REACTION`.
- `[OBS]` Echo host: `GAME_PAUSED`/`GAME_RESUMED`/`QUESTION_SKIPPED`/`HOST_BROADCAST` xác nhận `/api/rooms/{id}/host/{action}`.
- `[OBS]` Lobby: `PLAYER_JOINED/LEFT/KICKED`, `PLAYER_READY/UNREADY`, `HOST_CHANGED`, `GAME_STARTING` (countdown).

## 5. UI các mode

- `[OBS]` `src/pages/create-room/modeMeta.ts` `MODE_LIST` = 4 chọn được: SPEED_RACE, BATTLE_ROYALE, TEAM_VS_TEAM, SUDDEN_DEATH (mỗi cái có Q/time/maxPlayers mặc định, icon, màu). `GROUP_LIVE_SEQUENTIAL` chỉ **backend-spawn** (không có entry MODE_META; FE rẽ nhánh theo `isSequential` → `SequentialLobbyView`/`SequentialFinalView`) → F-web-5.
- `[OBS]` Quickmatch: `QuickMatchEntryCard` đọc `/api/me/multiplayer-stats.quickMatchRemainingToday` (cap 3, disable khi 0); `QuickMatchConfigModal` (mode + bookScope + count + time + source DATABASE/AI + ngôn ngữ); source AI bị UI-gate theo `userTier ≥ 4`. Submit → `POST /api/rooms/quick-match`.
- `[OBS]` Role: Quản trò = `isHost && !hostPlaysGame` → mount `RoomQuizHost`; quickmatch = soft-host (bất kỳ ≥2 ready là start được).

### 5.1 Sinh tồn (BATTLE_ROYALE) phía client — đào sâu 2026-06-12 [OBS]
> `[✔]` User test OK trên dev 2026-06-12 (cùng ngày với Speed Race).
> Luật canonical ở BE: apps/api/DOMAIN.md §4.3.1. FE chỉ render — không tự suy luận loại ai.
- `[OBS]` State sống trong `room/hooks/useBattleRoyale.ts`: `activeCount/totalCount` (từ `BATTLE_ROYALE_UPDATE`), `isEliminated/myRank/showEliminationScreen` (từ `PLAYER_ELIMINATED` khi `d.userId === myUserId` — match **userId**, không username, fix d504299b), toast loại người khác (tự ẩn 3.5s), `isSpectator` + `spectate()`.
- `[OBS]` Bị loại → `EliminationScreen` full-screen (skull + "Bạn đã bị loại!" + hạng + đáp án đúng câu vừa rồi + nút spectate "Xem tiếp"); spectator tiếp tục nhận mọi broadcast, chỉ mất quyền trả lời (BE gate ELIMINATED/SPECTATOR, FE không cần tự khóa).
- `[OBS]` `BattleRoyaleView` (views/) render đếm ACTIVE/total cho người đang sống.
- `[OBS]` Form Tạo Phòng: label "Sinh tồn" (`room.modes.battle_royale`), mô tả "Sai là bị loại, người còn lại cuối cùng thắng"; defaults modeMeta 20Q × 20s × max 8.

---

## 6. Findings / Risks (client)

- **F-web-1 🟡 Refresh 401 chưa single-flight** — nhiều 401 song song có thể mỗi cái retry với token có thể đã cũ; không có promise refresh dùng chung (`src/api/client.ts`). (Đã giảm tác hại: STOMP tự refresh header mỗi reconnect.)
- **F-web-2 🟡→⚪ Key định danh** — ĐÃ FIX phần lớn 2026-06-12 (viewerUserId xuyên suốt lobby→quiz→end screen, QuizEndScreen match playerId). Residual: `RoundScoreboard`/`SdArenaHeader`/`SequentialFinalView` còn match username nội bộ.
- **F-web-3 🟡 Submit optimistic mất khi WS gián đoạn** — `send()` trả false được surface ở lobby (cảnh báo activity) nhưng chưa có ack/retransmit; câu trả lời trong quiz vẫn có thể rơi khi blackout.
- **F-web-4 ✔ FIXED 2026-06-12** — `useRoomChannel` rehydrate `current-question` trên mọi reconnect, áp cho cả 3 trang.
- **F-web-5 ✔ FIXED 2026-06-12** — `GROUP_LIVE_SEQUENTIAL` đã vào MODE_META với cờ `createdViaApi: true`.
- **F-web-6 🟡 Mapping enum mùa↔key** — BE SCREAMING_SNAKE vs FE key i18n lowercase; verify map phủ đủ cả 4 (nếu thiếu key thì fallback im lặng).
- **F-web-7 🔴 Host controls chỉ gate phía client** — hiển thị thanh điều khiển là `isHost && !hostPlaysGame`; **phải tin BE** authorize `/api/rooms/{id}/host/*` (server mới là cổng thật — đã xác nhận enforce trong `HostControlService`, apps/api/DOMAIN.md §4.2). Đánh đỏ vì gate-chỉ-client *sẽ* là lỗ hổng *nếu* BE không check.
- **F-web-8 ⚪ Countdown không có lối thoát** — nếu `GAME_STARTING` không bao giờ tới, lobby có thể kẹt ở `countdown!==null`; không có nút hủy/reset.
- **F-web-9 ⚪ Thiếu key i18n** `quiz.showExplanationAgain` — fallback về chuỗi VN hardcode (Quiz + DailyChallenge); thêm vào en.json.

## 7. Open Questions [?]

1. FE hiển thị block cap-ngày chủ động hay chỉ sau response server? (không có counter cap phía client)
2. Reconnect: client có replay submit STOMP thất bại không, hay bỏ luôn? (F-web-3)
3. `quickMatchRemainingToday` reset — UTC hay theo tz người dùng? (BE reset lúc nửa đêm UTC — xem apps/api/DOMAIN.md §4.4)
4. `viewerUserId` có persist qua back/reload trình duyệt không — phát hiện role có thể vỡ.
5. Hàng đợi sudden-death — có UX hiển thị vị trí chờ cho người chơi không?
6. ~~Auth WS có sống sót qua token hết hạn giữa connection?~~ `[✔ trả lời 2026-06-12]` Connection đang sống không bị validate lại; điểm chết là **reconnect với token đóng băng** — đã fix bằng `beforeConnect` refresh header.

---

> **Liên kết:** backend canonical [apps/api/DOMAIN.md](../api/DOMAIN.md) · spec ý đồ [docs/spec/](../../docs/spec/) · [DECISIONS.md](../../DECISIONS.md).
