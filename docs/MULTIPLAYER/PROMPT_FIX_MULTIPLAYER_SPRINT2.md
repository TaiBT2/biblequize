# PROMPT: Multiplayer Sprint 2 — Restore the Ceremony

> **Mục tiêu:** Multiplayer hiện tại "khô khốc" (race condition đã fix ở Sprint 1, nhưng vẫn thiếu sound, haptic, animation, combo banner, sync timer giữa player). Sprint 2 đưa multiplayer lên ngang Kahoot/Quizizz về cảm xúc.
>
> **Reference:**
> - `MULTIPLAYER_AUDIT_REPORT.md` — audit gốc
> - `MOCKUP_GAME_START_CEREMONY.html` — mobile mockup cinematic countdown
> - `MOCKUP_QUIZ_GAMEPLAY_RESULTS.html` — mobile mockup reveal + end
> - `MOCKUP_DESKTOP_MULTIPLAYER.html` — desktop mockup 3-column layout
> - SPEC_USER_v3.md §5.4 (multiplayer modes), §8 (sound + haptics list)
>
> **Prereq:** Sprint 1 (`PROMPT_FIX_MULTIPLAYER_SPRINT1.md`) đã DONE. Đặc biệt task #1 (xóa ROOM_STARTING redundant) — Sprint 2 phụ thuộc vào single source of truth `GAME_STARTING`.

---

## Verification Protocol (BẮT BUỘC trước mỗi task)

Trước khi sửa file nào:

1. **Grep tên function/variable** mà audit/mockup nhắc → confirm vẫn tồn tại
2. **Read current state ±10 lines** quanh chỗ sửa
3. **Nếu line numbers shift** vs audit — adjust, không assume
4. **Nếu component đã refactor** sau Sprint 1 — note rõ trong commit message
5. **Tests pre-existing fail** (theo memory) — KHÔNG treat là blocker, chỉ note

Nếu task nào discover ra fact mới (vd: tìm thấy logic mới sau Sprint 1) — STOP và confirm với Bui trước khi tiếp tục.

---

## Commit hygiene

- **Mỗi task = 1 commit riêng.** Không gộp.
- Format: `feat(multiplayer): [task title]` hoặc `fix(multiplayer): ...`
- Sau mỗi commit: STOP, chạy test relevant, báo cáo cho Bui → đợi confirm.
- KHÔNG chạy 9 tasks liên tiếp một lèo.

---

## Constraint rules (embed cho mọi task)

### Font rules (xuất phát từ rendering bug đã fix trong mockup)
- **Be Vietnam Pro** cho TẤT CẢ Vietnamese display headings (kể cả "BẮT ĐẦU!", "Vinh quang!", "Hạng 2", "ĐÚNG!", "SAI")
- **Sora** chỉ dùng cho: số (timer, score, points), EN labels không dấu
- Test mọi heading với "Đ", "Ắ", "Ầ", "Ề", "Ổ", "Ự" — nếu Sora bị clip dấu thanh → đổi sang Be Vietnam Pro 800/900

### Emoji rules
- KHÔNG dùng emoji medal/badge `🥈🥉🏅` cho UI quan trọng — render khác nhau giữa OS, đôi khi tích hợp số "2" gây overlap
- Replace bằng SVG icon (ví dụ silver medal trong `MOCKUP_QUIZ_GAMEPLAY_RESULTS.html`)
- Emoji chỉ dùng cho decorative: 🎉, 🔥, ✨, 👑, 🏆 (luôn tách `<span>` riêng khỏi heading text)

### Color + style rules
- Hardcoded hex: `#e8a832` (gold), `#11131e` (navy), `rgba(50,52,64,0.55)` (glass card), `#ff7a59 / #4ea8de / #e8a832 / #86b8a0` (Coral/Sky/Gold/Sage cho options A/B/C/D)
- KHÔNG dùng CSS variables (gây white-background bug — note trong memory)
- Glass card: `rgba(50,52,64,0.55) + backdrop-blur(12px) + border 1px rgba(255,255,255,0.06)`

### Animation rules (rút từ bug stuck animation trong mockup)
- KHÔNG dùng `display:none` + CSS animation với keyframe `opacity:0` ở 0% — animation sẽ stuck
- Trong React component:
  - Sau khi state đổi → mount panel → useEffect re-trigger animation classes:
    ```typescript
    useEffect(() => {
      if (visible) {
        const els = ref.current?.querySelectorAll('.fade-in, .pulse, .slam');
        els?.forEach(el => {
          el.classList.remove(/* class */);
          void el.offsetWidth;
          el.classList.add(/* class */);
        });
      }
    }, [visible]);
    ```
- Hoặc dùng framer-motion / react-spring cho component mới

---

## Phase 1: Foundation (3 tasks, ~1 day)

---

### Task S2-1 — Sound Manager + Haptic utility infrastructure 🟡

**Audit ref:** SPEC §8 sound list (15 sounds), Phase 4 finding line 225, MULTIPLAYER_AUDIT_REPORT comparison table với Kahoot/Quizizz.

**TODO.md ref:** Tasks SF-1 và SF-2 trong section "Sound Effects + Animations" hiện đang [ ] TODO. Sprint 2 task này MERGE với 2 tasks đó — sau khi xong, mark cả SF-1 và SF-2 là DONE.

**Goal:** Tạo infrastructure cho sound + haptic dùng được ở mọi nơi (multiplayer, solo quiz, daily challenge).

**Files:**
- `apps/web/src/services/soundManager.ts` (new)
- `apps/web/src/utils/haptics.ts` (new)
- `apps/web/public/sounds/` (new directory) — copy hoặc generate sound files
- `apps/web/src/services/__tests__/soundManager.test.ts` (new)

**Steps:**

1. **Sound files** — bắt đầu với 8 sounds cần cho Sprint 2:
   - `correct.mp3` — đúng (light, ~0.3s)
   - `wrong.mp3` — sai (descending, ~0.4s)
   - `combo5.mp3` — combo 5 (ascending fanfare, ~0.6s)
   - `combo10.mp3` — combo 10 (bigger fanfare, ~0.8s)
   - `tick.mp3` — countdown tick (sharp, ~0.15s)
   - `tickHigh.mp3` — countdown last tick (sharper, ~0.2s)
   - `gameStart.mp3` — BẮT ĐẦU! moment (whoosh + chord, ~1s)
   - `victory.mp3` — quiz end winner (~2s)
   - `complete.mp3` — quiz end normal (~1.5s)
   - `playerJoin.mp3` — ai đó join lobby (subtle ding, ~0.3s)

   File source: có thể dùng [Freesound](https://freesound.org) (CC0), generate bằng `tone.js` (đã có trong artifacts), hoặc tự ghi. Mỗi file <50KB MP3.

2. **SoundManager class** — `apps/web/src/services/soundManager.ts`:
   ```typescript
   class SoundManager {
     private cache = new Map<string, HTMLAudioElement>();
     private enabled = true;
     private volume = 0.7;
     
     constructor() {
       // Read from localStorage
       this.enabled = localStorage.getItem('soundEnabled') !== 'false';
       this.volume = parseFloat(localStorage.getItem('soundVolume') || '0.7');
     }
     
     async play(soundName: SoundName, opts?: { volume?: number }) {
       if (!this.enabled) return;
       const audio = await this.load(soundName);
       audio.volume = (opts?.volume ?? this.volume);
       audio.currentTime = 0;
       audio.play().catch(() => { /* user hasn't interacted yet */ });
     }
     
     private async load(name: SoundName): Promise<HTMLAudioElement> {
       if (!this.cache.has(name)) {
         const audio = new Audio(`/sounds/${name}.mp3`);
         audio.preload = 'auto';
         this.cache.set(name, audio);
       }
       return this.cache.get(name)!;
     }
     
     setEnabled(v: boolean) { this.enabled = v; localStorage.setItem('soundEnabled', String(v)); }
     setVolume(v: number) { this.volume = v; localStorage.setItem('soundVolume', String(v)); }
     getEnabled() { return this.enabled; }
     getVolume() { return this.volume; }
   }
   
   export const soundManager = new SoundManager();
   export type SoundName = 'correct' | 'wrong' | 'combo5' | 'combo10' | 'tick' | 'tickHigh' | 'gameStart' | 'victory' | 'complete' | 'playerJoin';
   ```

3. **Haptic utility** — `apps/web/src/utils/haptics.ts`:
   ```typescript
   export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';
   
   const PATTERNS: Record<HapticPattern, number | number[]> = {
     light: 10,
     medium: 20,
     heavy: 40,
     selection: 5,
     success: [10, 50, 10],
     warning: [20, 100, 20],
     error: [40, 80, 40, 80, 40],
   };
   
   let enabled = localStorage.getItem('hapticEnabled') !== 'false';
   
   export function haptic(pattern: HapticPattern) {
     if (!enabled) return;
     if (typeof navigator !== 'undefined' && navigator.vibrate) {
       navigator.vibrate(PATTERNS[pattern]);
     }
     // Future: hook up Capacitor Haptics for mobile native
   }
   
   export function setHapticEnabled(v: boolean) { enabled = v; localStorage.setItem('hapticEnabled', String(v)); }
   export function getHapticEnabled() { return enabled; }
   ```

4. **Tests** — basic smoke tests for both, mock `Audio` and `navigator.vibrate`.

**Test:**
- Unit: enabled/volume persistence to localStorage, mute does not throw, haptic patterns map correctly
- Manual: import `soundManager` in any component, call `play('correct')` after user click → âm thanh phát

**Commit:** `feat(sound): SoundManager + haptic utility infrastructure (closes TODO SF-1, SF-2)`

---

### Task S2-2 — Backend Server-authoritative timer (startedAtMs + 5s countdown) 🔴

**Audit ref:** Phase 5 finding line 247–248 (timer fairness bug), Quick Win #6, MOCKUP_GAME_START_CEREMONY backend changes section.

**Root cause:** `RoomQuiz.tsx:127` dùng `Date.now()` client-side cho timer — player mạng chậm load Q1 sau 2s vẫn được full 30s timer → bất công Speed Race scoring.

**Fix:** Server gửi `startedAtMs = System.currentTimeMillis()` trong `QuestionStartData`. FE compute timer từ server time.

**Files:**
- `apps/api/src/main/java/com/biblequiz/api/websocket/WebSocketMessage.java`
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomQuizService.java`

**Steps:**

1. **WebSocketMessage.java** — thêm field vào `QuestionStartData`:
   ```java
   public static class QuestionStartData {
     // existing fields...
     private Long startedAtMs;  // System.currentTimeMillis() at moment of broadcast
     // getters + setters
   }
   ```

2. **RoomQuizService.java** — set field khi broadcast (line ~98 nơi broadcast QUESTION_START):
   ```java
   QuestionStartData data = new QuestionStartData();
   // ... existing setters
   data.setStartedAtMs(System.currentTimeMillis());
   // broadcast
   ```

3. **Increase countdown** — line ~57 đổi `GAME_STARTING_COUNTDOWN_S = 3` → `5`:
   ```java
   private static final int GAME_STARTING_COUNTDOWN_S = 5;
   ```
   Note: Sprint 1 task #1 đã xóa redundant `ROOM_STARTING` send → giờ countdown 5s sẽ play đúng cho mọi user.

4. **Test:** unit test `RoomQuizServiceTest` — verify `QuestionStartData.startedAtMs` được set ≈ `System.currentTimeMillis()` (within 100ms tolerance).

**Test:**
- Backend test pass
- Manual: in dev console, log WS frames → confirm `startedAtMs` field present trong `QUESTION_START`

**Commit:** `feat(multiplayer): server-authoritative timer + 5s countdown ceremony`

---

### Task S2-3 — Backend ROOM_STATE event push (replace fetchRoom polling) 🟡

**Audit ref:** Phase 3 finding 3.8 line 189–190 (race-y per-event fetchRoom), Quick Win #10.

**Root cause:** Mỗi `PLAYER_JOINED|LEFT|READY|UNREADY|KICKED` event → FE call `fetchRoom()` REST → 4 join cùng lúc = 4 round-trips, flicker player list.

**Fix:** BE thêm `ROOM_STATE` event chứa toàn bộ snapshot phòng. Broadcast 1 lần sau mỗi membership/ready change. FE replace fetchRoom calls bằng handler.

**Files:**
- `apps/api/src/main/java/com/biblequiz/api/websocket/WebSocketMessage.java` (thêm `RoomStateData` DTO)
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomService.java` (call broadcast từ join/leave/ready)
- `apps/api/src/main/java/com/biblequiz/api/RoomController.java` (kick endpoint)
- `apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java` (helper)

**Steps:**

1. **WebSocketMessage.java** — thêm:
   ```java
   public static class RoomStateData {
     private String roomId;
     private List<PlayerInfo> players;
     private RoomStatus status;
     private RoomConfig config;
     private String hostId;
     // getters + setters
   }
   public static final String ROOM_STATE = "ROOM_STATE";
   ```

2. **RoomWebSocketController** — thêm helper:
   ```java
   public void broadcastRoomState(String roomId) {
     Room room = roomService.findById(roomId);
     RoomStateData data = mapper.toRoomStateData(room);
     messagingTemplate.convertAndSend("/topic/room/" + roomId,
       new WebSocketMessage(MessageTypes.ROOM_STATE, data));
   }
   ```

3. **Trigger points** — gọi `broadcastRoomState(roomId)` sau:
   - `RoomService.joinRoom` (sau khi addPlayerToRoom commit)
   - `RoomService.leaveRoom` (sau khi delete)
   - `RoomService.toggleReady` 
   - `RoomService.kickPlayer` (Sprint 1 đã add PLAYER_KICKED broadcast — giữ cả 2)

4. **Frontend follow-up** — note: FE handler sẽ làm trong Task S2-7. Task này chỉ BE.

**Test:**
- Backend: test broadcast được gọi sau mỗi mutation
- Manual: log WS frames → confirm ROOM_STATE arrive sau mỗi PLAYER_JOINED

**Commit:** `feat(multiplayer): backend ROOM_STATE event push for atomic lobby sync`

---

## Phase 2: Cinematic moments (2 tasks, ~1 day)

---

### Task S2-4 — Frontend Cinematic countdown overlay 🔴

**Audit ref:** Phase 4 finding line 224–229, MOCKUP_GAME_START_CEREMONY (mobile + desktop), Sprint 2 ceremony goal.

**Goal:** Khi `GAME_STARTING` event arrive → full-screen overlay 5s với gold pulse + countdown number + sound + haptic + transition smooth sang Q1.

**Files:**
- `apps/web/src/components/multiplayer/CountdownOverlay.tsx` (new)
- `apps/web/src/pages/RoomLobby.tsx` (integrate)
- `apps/web/src/pages/room/RoomQuiz.tsx` (integrate cho late-join scenario)
- `apps/web/src/components/multiplayer/__tests__/CountdownOverlay.test.tsx` (new)

**Steps:**

1. **CountdownOverlay component:**

   ```typescript
   interface Props {
     countdown: number; // initial seconds (5)
     onComplete: () => void;
   }
   
   export function CountdownOverlay({ countdown: initial, onComplete }: Props) {
     const [count, setCount] = useState(initial);
     const [showGo, setShowGo] = useState(false);
     
     useEffect(() => {
       if (count > 0) {
         soundManager.play(count === 1 ? 'tickHigh' : 'tick');
         haptic('light');
         const t = setTimeout(() => setCount(c => c - 1), 1000);
         return () => clearTimeout(t);
       }
       // count === 0 → show GO!
       setShowGo(true);
       soundManager.play('gameStart');
       haptic('success');
       const t = setTimeout(onComplete, 800); // 800ms BẮT ĐẦU! visible
       return () => clearTimeout(t);
     }, [count]);
     
     // ... render JSX matching mockup
   }
   ```

2. **Match mockup styles exactly:**
   - Full-screen overlay với z-index high
   - Gold pulsing glow ring around number
   - Number font: `Sora` (digits OK with Sora)
   - Number size: mobile `text-[10rem]` / desktop `text-[12rem]` (responsive)
   - "BẮT ĐẦU!" text: **Be Vietnam Pro 900** (NOT Sora — diacritics issue), `text-6xl` mobile / `text-[10rem]` desktop
   - Confetti spawn on "BẮT ĐẦU!" moment
   - Glass-strong card behind number
   - Player avatars row at bottom showing X người chơi sẵn sàng

3. **RoomLobby integration** — replace existing GAME_STARTING handler:
   ```typescript
   // OLD: showCountdown(data.countdown) then navigate
   // NEW:
   const [countdownActive, setCountdownActive] = useState(false);
   // ...in onMessage handler:
   case 'GAME_STARTING':
     setCountdownActive(true);
     break;
   // ...in JSX:
   {countdownActive && (
     <CountdownOverlay 
       countdown={5}
       onComplete={() => navigate(`/room/${roomId}/quiz`)}
     />
   )}
   ```

4. **RoomQuiz late-join integration** — nếu user reconnect sau khi countdown đã start, server có thể skip countdown. Check `room.status === IN_PROGRESS` → skip overlay, navigate thẳng.

5. **Tests:** mock soundManager, mock setTimeout, verify count decrements 5→4→3→2→1→GO→onComplete.

**Test:**
- Unit: countdown sequence + sound calls + onComplete called after 5 seconds
- Manual: tạo phòng 2 người, host bấm Start → cả 2 thấy 5-4-3-2-1-BẮT ĐẦU! cùng lúc với sound

**Commit:** `feat(multiplayer): cinematic 5s countdown overlay with sound + haptic`

---

### Task S2-5 — Frontend server-authoritative timer in RoomQuiz 🔴

**Audit ref:** Phase 5 finding line 247–248, Quick Win #6, depends on Task S2-2.

**Fix:** Replace `Date.now()` client-side timer với server timestamp.

**Files:**
- `apps/web/src/pages/room/RoomQuiz.tsx`
- `apps/web/src/api/types.ts` (if QuestionStartData type exists)

**Steps:**

1. Update type for `QuestionStartData` — add `startedAtMs: number`.

2. Replace timer logic ~line 127 (verify after Sprint 1 changes):
   ```typescript
   // OLD:
   questionStartedAt.current = Date.now();
   setTimeLeft(data.timeLimit);
   
   // NEW:
   questionStartedAtMs.current = data.startedAtMs ?? Date.now();
   const elapsedMs = Date.now() - questionStartedAtMs.current;
   const remainingSec = Math.max(0, data.timeLimit - elapsedMs / 1000);
   setTimeLeft(remainingSec);
   ```

3. Update interval logic — recompute từ server time mỗi tick:
   ```typescript
   const interval = setInterval(() => {
     const elapsedMs = Date.now() - questionStartedAtMs.current;
     const remaining = Math.max(0, data.timeLimit - elapsedMs / 1000);
     setTimeLeft(remaining);
     if (remaining <= 0) clearInterval(interval);
   }, 100); // update mỗi 100ms cho smooth
   ```

4. **Edge case:** late-join player (reconnect after question started). Server gửi state với `startedAtMs` cũ → FE compute remaining đúng (có thể chỉ còn 5s thay vì full 30s).

5. **Sound integration:** khi `timeLeft <= 5` → play `tick` mỗi giây; khi `timeLeft <= 3` → play `tickHigh`.

**Test:**
- Unit: timer compute correctly với mock startedAtMs
- Manual: 2 player, 1 device throttle network → compare timers visually, phải sync ±200ms

**Commit:** `feat(multiplayer): server-authoritative timer for fair Speed Race scoring`

---

## Phase 3: Gameplay reveal (2 tasks, ~1.5 days)

---

### Task S2-6 — Frontend reveal states (correct/wrong) with explanation 🔴

**Audit ref:** SPEC §4.5 (wrong answer explanations), MOCKUP_QUIZ_GAMEPLAY_RESULTS states ② và ④.

**Goal:** Sau khi user trả lời + server gửi `ROUND_END`, hiện reveal state với:
- Correct: green flash, score float-up, sound, haptic
- Wrong: red flash, screen shake, **explanation panel slide-up** (BTTHĐ verse + giải thích), sound, haptic, button "Đánh dấu ôn lại"

**Files:**
- `apps/web/src/pages/room/RoomQuiz.tsx` (major refactor)
- `apps/web/src/components/multiplayer/AnswerReveal.tsx` (new — extract reveal logic)
- `apps/web/src/components/multiplayer/ExplanationPanel.tsx` (new)
- `apps/web/src/components/multiplayer/__tests__/AnswerReveal.test.tsx` (new)

**Steps:**

1. **Match mockup states ② (Correct) và ④ (Wrong)** từ `MOCKUP_QUIZ_GAMEPLAY_RESULTS.html` — tham chiếu HTML đã có cho:
   - Selected option border + check/X icon
   - Correct answer green glow (pulse-glow class)
   - User wrong answer red border + X
   - Score float-up animation từ option
   - Stats card "Thời gian · Tốc độ · Hạng" (correct only)
   - Auto-advance progress bar bottom

2. **ExplanationPanel** — slide-up từ bottom (panel-slide animation):
   - 📖 scriptureRef header (bold, gold)
   - 💡 explanation text (max 150 words, scrollable nếu dài)
   - [🔖 Đánh dấu ôn lại] button (calls bookmark API)
   - [Tiếp tục →] button (force close panel)
   - Auto-dismiss progress bar (4s) — chỉ là UX, không skip server
   
   **Decision needed (Bui đã có 4 câu hỏi cuối session trước):**
   - Wrong panel auto-dismiss: **default 4s minimum, đợi server `QUESTION_START` mới đóng** (hybrid approach — đáp ứng SPEC + không conflict server timing)

3. **Sound + haptic per state:**
   - Correct: `soundManager.play('correct')`, `haptic('light')`
   - Wrong: `soundManager.play('wrong')`, `haptic('heavy')`

4. **Animation rules** — apply `restartAnimations()` pattern (xem constraint section) khi switch state để tránh stuck.

5. **Bookmark integration** — call existing `POST /api/me/bookmarks` với `questionId`. Toast "Đã đánh dấu" + small ✓ icon thay button.

**Test:**
- Unit: reveal correct → green flash + correct option highlighted; reveal wrong → red flash + correct + user wrong both highlighted + explanation panel renders
- Manual: 2 người, 1 trả đúng 1 trả sai → mỗi người thấy reveal khác nhau với sound/haptic phù hợp

**Commit:** `feat(multiplayer): answer reveal states with explanation panel (correct/wrong)`

---

### Task S2-7 — Combo banner system (5/10 streak detection) 🟡

**Audit ref:** SPEC §4.3 (combo multipliers), MOCKUP_QUIZ_GAMEPLAY_RESULTS state ③.

**Goal:** Track streak liên tiếp đúng. Hit 5 → show combo banner orange-gold + ×1.2 multiplier. Hit 10 → bigger banner + ×1.5. Reset on wrong.

**Files:**
- `apps/api/src/main/java/com/biblequiz/modules/room/service/RoomQuizService.java` (compute multiplier server-side)
- `apps/web/src/components/multiplayer/ComboBanner.tsx` (new)
- `apps/web/src/pages/room/RoomQuiz.tsx` (integrate)

**Steps:**

1. **Backend** — track `consecutiveCorrect` per player per session:
   - Khi tính score sau mỗi answer:
     - If correct: `consecutive++`, multiplier = 1.0 / 1.2 / 1.5 dựa vào count
     - If wrong: `consecutive = 0`
   - Gửi `comboMultiplier` và `comboCount` trong `ROUND_END` payload per player
   - **Alternative simpler:** FE tự track local từ ANSWER_RESULT events, BE chỉ apply multiplier (mock memory: scoring system đã có ScoringService — extend nó)

2. **ComboBanner component** — match mockup state ③:
   - Slide-down từ top với combo-slide animation (2.4s total)
   - Orange-gold gradient `#ff7a59 → #e8a832`
   - Big emoji 🔥 + "COMBO ×5!" / "COMBO ×10!"
   - Subtitle "5 câu đúng liên tiếp · điểm ×1.2"
   - Score "+22" right side
   - Self-dismiss after 2.4s

3. **Integration in RoomQuiz:**
   ```typescript
   useEffect(() => {
     if (lastAnswerData?.isCorrect) {
       const newCombo = comboCount + 1;
       setComboCount(newCombo);
       if (newCombo === 5) {
         setShowCombo({ count: 5, multiplier: 1.2 });
         soundManager.play('combo5');
         haptic('medium');
       } else if (newCombo === 10) {
         setShowCombo({ count: 10, multiplier: 1.5 });
         soundManager.play('combo10');
         haptic('success');
       }
     } else if (lastAnswerData?.isCorrect === false) {
       setComboCount(0); // reset
     }
   }, [lastAnswerData]);
   ```

4. **Sound:** `combo5.mp3` ascending fanfare, `combo10.mp3` bigger fanfare.

**Test:**
- Unit: combo state increments correctly, banner shows at 5 và 10, resets on wrong
- Manual: cùng 1 user trả lời đúng 5 câu liên tiếp → combo banner hiện ở câu 5

**Commit:** `feat(multiplayer): combo banner system with 5x and 10x streak detection`

---

## Phase 4: Lobby polish (3 tasks, ~1 day)

---

### Task S2-8 — Frontend ROOM_STATE handler (replace fetchRoom polling) 🟡

**Audit ref:** Depends on Task S2-3 (BE). Phase 3 finding 3.8.

**Files:**
- `apps/web/src/pages/RoomLobby.tsx`
- `apps/web/src/api/types.ts` (RoomStateData type)

**Steps:**

1. **Add types** for `RoomStateData` matching BE DTO.

2. **Replace WS handlers** ~line 130–172 (verify after Sprint 1):
   ```typescript
   // OLD:
   case 'PLAYER_JOINED':
   case 'PLAYER_LEFT':
   case 'PLAYER_READY':
   case 'PLAYER_UNREADY':
   case 'PLAYER_KICKED':
     fetchRoom(); // ❌ REST round-trip
     break;
   
   // NEW:
   case 'ROOM_STATE':
     setRoom(data); // ✅ atomic state update
     break;
   case 'PLAYER_JOINED':
     // Just trigger UI side-effects (sound, toast — see Task S2-9)
     // ROOM_STATE event arriving right after will update player list
     soundManager.play('playerJoin');
     toast.success(`${data.playerName} đã tham gia`);
     break;
   ```

3. **Keep PLAYER_KICKED handler** for kicked user notification (Sprint 1 added):
   ```typescript
   case 'PLAYER_KICKED':
     if (data.userId === currentUser.id) {
       toast.error('Bạn đã bị host kick');
       navigate('/multiplayer');
     }
     break;
   ```

4. **Remove fetchRoom calls** trong các handlers — chỉ giữ initial load.

**Test:**
- Manual: 4 người join cùng lúc → player list update mượt, không flicker
- Unit: ROOM_STATE handler updates room state correctly

**Commit:** `feat(multiplayer): replace per-event fetchRoom with ROOM_STATE handler`

---

### Task S2-9 — Chat system messages + player join feedback 🟡

**Audit ref:** Phase 3 finding 3.6 line 176, Phase 3 finding 3.2 line 146.

**Goal:**
- Auto-generate system messages trong chat khi player join/leave/kick
- Toast notification + sound khi player join (currently silent)

**Files:**
- `apps/api/src/main/java/com/biblequiz/api/websocket/RoomWebSocketController.java` (broadcast system message)
- `apps/api/src/main/java/com/biblequiz/api/RoomController.java` (REST trigger từ join/leave/kick — Sprint 1 đã add PLAYER_KICKED, expand)
- `apps/web/src/pages/RoomLobby.tsx` (render system messages, toast)

**Steps:**

1. **Backend** — sau khi broadcast `ROOM_STATE` ở Task S2-3, cũng broadcast system chat message:
   ```java
   public void broadcastSystemMessage(String roomId, String text) {
     ChatMessage msg = ChatMessage.builder()
       .text(text)
       .isSystem(true)
       .timestamp(Instant.now())
       .build();
     messagingTemplate.convertAndSend("/topic/room/" + roomId,
       new WebSocketMessage(MessageTypes.CHAT_MESSAGE, msg));
   }
   ```
   Trigger:
   - Join: "An đã tham gia 👋"
   - Leave: "An đã rời phòng"
   - Kick: "Chi đã bị host kick"

2. **Frontend** — RoomLobby chat already supports `isSystem` rendering (line 1020–1034 per audit). Just ensure CHAT_MESSAGE handler routes system messages correctly.

3. **Player join sound + toast** — đã làm trong Task S2-8 với `soundManager.play('playerJoin')` + `toast.success`.

4. **Tests:** unit test system messages render correctly.

**Test:**
- Manual: 1 user join lobby → người trong lobby nghe "ding" + toast "An đã tham gia" + chat thấy system message

**Commit:** `feat(multiplayer): chat system messages + player join sound feedback`

---

### Task S2-10 — Ready button 2-state label + minor UX 🟢

**Audit ref:** Phase 3 finding 3.3 line 157, Quick Win #21.

**Files:**
- `apps/web/src/pages/RoomLobby.tsx` ~line 680

**Steps:**

1. Find ready button render logic.
2. Replace static "Sẵn sàng" label với conditional:
   ```typescript
   <button onClick={handleToggleReady}>
     {isReady ? '✓ Sẵn sàng' : 'Sẵn sàng'}
     {/* hoặc: */}
     {isReady ? 'Hủy sẵn sàng' : 'Sẵn sàng'}
   </button>
   ```
3. **Bui quyết định wording:** option A (Sẵn sàng / ✓ Sẵn sàng) preserves visual continuity, option B (Sẵn sàng / Hủy sẵn sàng) communicates state clearer. Mặc định B.

4. **Minor UX kèm theo (cùng commit OK):**
   - Throttle 600ms vẫn giữ
   - Add subtle haptic feedback `haptic('selection')` khi tap

**Test:**
- Manual: tap ready → label đổi rõ ràng

**Commit:** `fix(multiplayer): ready button shows clear state (Sẵn sàng / Hủy sẵn sàng)`

---

## Phase 5: End game (1 task, ~1 day)

---

### Task S2-11 — Quiz end screens (host vs player) 🔴

**Audit ref:** MOCKUP_QUIZ_GAMEPLAY_RESULTS states ⑤ và ⑥, MOCKUP_DESKTOP_MULTIPLAYER states ⑤ và ⑥.

**Goal:** Replace existing end screen với cinematic podium + role-aware actions (host vs player).

**Files:**
- `apps/web/src/components/multiplayer/QuizEndScreen.tsx` (new — cùng component, isHost prop)
- `apps/web/src/components/multiplayer/Podium.tsx` (new — reusable)
- `apps/web/src/pages/room/RoomQuiz.tsx` (replace existing PodiumScreen)
- `apps/web/src/components/multiplayer/__tests__/QuizEndScreen.test.tsx` (new)

**Steps:**

1. **Podium component** (reusable):
   - 3-cấp podium với heights mobile 45-90px, desktop 95-200px
   - 1st: gold gradient + crown emoji 👑 + pulse glow
   - 2nd: silver gradient
   - 3rd: bronze gradient
   - Avatars + names + scores above each podium block
   - Confetti spawn on mount (40 pieces host, 25 pieces player)
   - **Crown emoji absolute position** — không đẩy avatar xuống (memory rule)

2. **QuizEndScreen** — main component với `isHost` prop:
   ```typescript
   interface Props {
     rankings: PlayerResult[];
     stats: { totalQuestions, totalDuration, playerCount };
     isHost: boolean;
     myRank: number;
     myStats: { correct, accuracy, maxCombo, points };
     onReplay?: () => void;     // host only
     onClose?: () => void;       // host only
     onShare?: () => void;       // player primary
     onNewRoom?: () => void;
     onHome: () => void;
   }
   ```

3. **Host view** (matches mockup ⑤):
   - Title "🏆 Vinh quang!" với emoji tách `<span>` (Be Vietnam Pro 900)
   - Match stats summary (Câu hỏi · Thời gian · Người chơi · Tổng điểm)
   - Right panel: Actions với label "👑 Lựa chọn của Host"
     - Primary: 🔄 Chơi lại với phòng này (gold gradient)
     - 📊 Phân tích chi tiết
     - 📤 Xuất CSV (nếu BE support)
     - 🚪 Đóng phòng (red destructive)
   - Quick rankings list bên dưới actions

4. **Player view** (matches mockup ⑥):
   - **Personal hero card top** — avatar 80px (desktop) / 56px (mobile) với:
     - Rank badge bottom-right (`w-9 h-9` desktop / `w-6 h-6` mobile, border-2 dark)
     - "Hạng X" trong Be Vietnam Pro 900
     - 3 stats: Đúng · Chính xác · Combo cao
     - **SVG silver/bronze medal** (NOT emoji 🥈 — theo memory rule)
   - Mini podium dưới
   - Right panel: Actions
     - Primary: 📤 Chia sẻ kết quả (gold gradient — viral hook)
     - ⚔️ Phòng mới
     - 🏠 Trang chủ
   - "Trạng thái phòng" hint card: "Host có thể bắt đầu trận mới · đang chờ..."

5. **Sound:** mount → `soundManager.play(myRank === 1 ? 'victory' : 'complete')`

6. **Replay flow (host action):**
   - Call `POST /api/rooms/{id}/replay` (BE creates new session same players, same config)
   - Or simpler: navigate back to lobby, let players manually ready up again
   - Discuss với Bui scope nếu BE chưa có endpoint

**Test:**
- Unit: render with isHost=true → 4 host buttons; isHost=false → 3 player buttons + hero card
- Manual: chơi xong 1 trận → screen end hiện đẹp, host thấy controls khác player

**Commit:** `feat(multiplayer): quiz end screens with role-aware actions (host vs player)`

---

## Final regression (sau khi 9 tasks DONE)

1. **Backend tests:** `cd apps/api && ./mvnw test` — note baseline, expect ≥ baseline
2. **Frontend tests:** `cd apps/web && npx vitest run`
3. **Sound files load test:** in dev console run:
   ```javascript
   ['correct','wrong','combo5','combo10','tick','tickHigh','gameStart','victory','complete','playerJoin']
     .forEach(s => new Audio(`/sounds/${s}.mp3`).load());
   ```
   → no 404 errors trong network tab
4. **Manual smoke test:**
   - [ ] 2 người tạo phòng + join lobby → join feedback (sound + toast + chat system msg)
   - [ ] Host bấm Start → cinematic countdown 5-4-3-2-1-BẮT ĐẦU! với sound mỗi tick
   - [ ] Cả 2 thấy Q1 cùng lúc với timer sync
   - [ ] User trả đúng → green flash + correct sound + score float
   - [ ] User trả sai → red flash + wrong sound + explanation panel
   - [ ] Trả đúng 5 câu liên tiếp → combo banner ×1.2
   - [ ] Cuối trận → host thấy "Chơi lại / Đóng phòng" buttons; player thấy "Chia sẻ / Phòng mới" buttons
   - [ ] Host kick player → người bị kick auto-redirect, lobby update real-time (Sprint 1 + Task S2-8)
5. **Update TODO.md:** Thêm section "Multiplayer Sprint 2 [DONE]" với 9 tasks. Mark SF-1 và SF-2 là DONE.

---

## Rules cho Claude Code

1. **Verification-first:** Read trước khi sửa. Audit line numbers có thể đã shift sau Sprint 1.
2. **Separate commits:** 9 tasks = 9 commits (hoặc nhiều hơn nếu task split). Không gộp.
3. **Stop sau mỗi commit:** chạy test, báo cáo, đợi confirm.
4. **Embed constraint rules:** font / emoji / color / animation rules ở section trên — apply cho mọi component mới.
5. **Reference mockup files:** mỗi task UI có link tới mockup state cụ thể — match pixel-perfect khi có thể.
6. **Nếu fix yêu cầu thay đổi >100 lines** trong 1 file — STOP và hỏi Bui (có thể cần split task).
7. **Sound files:** nếu chưa có, tạo placeholder bằng Web Audio API generate tones. Bui sẽ replace với production sounds sau.
8. **Test naming:** match pattern existing (vd `XxxTest.java` cho BE, `__tests__/Xxx.test.tsx` cho FE).

---

## Out of scope (KHÔNG làm trong Sprint 2)

Để tránh scope creep, KHÔNG đụng vào trong sprint này (Sprint 3 hoặc defer):

- Tier gating Battle Royale tier 3 / Sudden Death tier 5 (Sprint 3)
- 60s reconnect grace UI countdown (Sprint 3)
- Host promote on disconnect (Sprint 3)
- Spectate mode implementation (Sprint 3 hoặc defer)
- Atomic addPlayerToRoom race fix (Sprint 3)
- Chat rate-limit error frame (Sprint 3)
- TV Host Mode — pattern Kahoot (v1.5 milestone, riêng biệt)
- Sound volume slider trong Settings UI (làm sau khi soundManager stable)
- Player join animation card "fly-in" (nice-to-have, defer)
- Background lobby music (chưa cần thiết)
- Sequential mode polish (đã defer Q-B trong SPEC_GROUP)

Nếu trong lúc sửa, gặp 1 trong các điểm trên cản trở — STOP và confirm với Bui có nên đẩy lên Sprint 2 không.

---

## Effort estimate

| Phase | Tasks | Effort |
|---|---|---|
| Phase 1: Foundation | S2-1, S2-2, S2-3 | 1 day |
| Phase 2: Cinematic | S2-4, S2-5 | 1 day |
| Phase 3: Reveal | S2-6, S2-7 | 1.5 days |
| Phase 4: Lobby polish | S2-8, S2-9, S2-10 | 1 day |
| Phase 5: End game | S2-11 | 1 day |
| **Total** | **9 tasks** | **~5.5 days** |

Total LOC change estimate: ~1500-2000 lines (mostly new components, extending existing).

---

**Bắt đầu bằng Phase 1 (S2-1 → S2-2 → S2-3). Stop sau mỗi commit. Confirm với Bui trước khi sang phase tiếp theo.**
