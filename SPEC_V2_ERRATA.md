# SPEC-v2 — Errata & Amendments
> Created: 2026-04-02
> Applies to: SPEC-v2.md
> Status: Pending review

---

## Mục lục

1. [FIX-001] Java version — 21 vs 17
2. [FIX-002] Energy system — abandoned session exploit
3. [FIX-003] Tournament — bye/seeding rules
4. [FIX-004] Sudden Death — tie cases
5. [FIX-005] Friend System — spec vs code gap
6. [FIX-006] Share Card — rendering architecture
7. [FIX-007] Offline mode — không khả thi với web app
8. [FIX-008] Question types — availability per version
9. [FIX-009] Multi-language — strategy thiếu
10. [FIX-010] Daily Challenge — timezone conflict
11. [FIX-011] WebSocket — rate limit thiếu
12. [FIX-012] Group Quiz Set — lifecycle thiếu

---

## Phải fix ngay (ảnh hưởng code hiện tại)

### [FIX-001] Java version mâu thuẫn

**Vấn đề:** Spec mục 10.1 ghi "Spring Boot (Java 21)" nhưng codebase thực tế dùng Java 17.

**Sửa spec mục 10.1:**
```
- Backend | Spring Boot (Java 21) + Spring Security + Spring Data JPA
+ Backend | Spring Boot 3.3 (Java 17) + Spring Security + Spring Data JPA
```

**Lý do:** Java 17 là LTS, Spring Boot 3.3 hoàn toàn support. Migrate lên 21 là optional improvement, không phải requirement. Nếu muốn upgrade → tạo task riêng trong roadmap, không block current development.

---

### [FIX-002] Energy system — abandoned session exploit

**Vấn đề:** User có thể đóng app khi gặp câu khó, không submit answer → không mất energy. Spec không define behavior cho abandoned sessions.

**Bổ sung vào mục 3.2 (Hệ thống năng lượng), sau "Energy tự phục hồi 20/giờ":**

```markdown
**Abandoned session rules:**
- Mỗi câu có timeout riêng (timeLimitSec từ config)
- Hết thời gian không trả lời → server auto-submit "no_answer" → tính như sai → -5 energy
- User thoát giữa session (disconnect/close app):
  - Ranked mode: session chuyển sang status "abandoned" sau 2 phút không có activity
  - Abandoned session: tất cả câu chưa trả lời → tính sai → trừ energy tương ứng
  - Điểm các câu đã trả lời đúng VẪN được tính (không phạt retroactive)
- Practice mode: abandoned session không ảnh hưởng gì (không có energy)
- Daily Challenge: abandoned → chỉ tính câu đã trả lời, câu còn lại = sai
- Multiplayer/Tournament: disconnect → xem mục reconnect (9.4)
```

**Data model bổ sung:**
```sql
-- Thêm vào QuizSession
ALTER TABLE QuizSession ADD COLUMN abandonedAt TIMESTAMP NULL;
-- Session status: active → completed | abandoned
```

---

## Nên fix sớm (ảnh hưởng khi build tiếp)

### [FIX-003] Tournament — bye/seeding rules

**Vấn đề:** Spec mention "edge case số lẻ → bye" trong testing nhưng không define rules trong mục 4.5.

**Bổ sung vào mục 4.5 (Tournament), sau "Bracket elimination: thua → out":**

```markdown
**Seeding & Bye rules:**

Seeding algorithm:
- Nếu tournament trong Church Group → seed theo group leaderboard rank (cao → seed 1)
- Nếu tournament public → seed theo all-time tier points (cao → seed 1)
- Nếu cùng rank → random

Bracket sizing:
- Bracket luôn là power of 2: 4, 8, 16, 32
- Nếu số người < bracket size → dùng bracket nhỏ hơn gần nhất nếu đủ
- Bảng chọn:
  | Số người đăng ký | Bracket size | Số bye |
  |---|---|---|
  | 2–4 | 4 | 4 - N |
  | 5–8 | 8 | 8 - N |
  | 9–16 | 16 | 16 - N |
  | 17–32 | 32 | 32 - N |

Bye distribution:
- Bye chỉ xảy ra ở Round 1
- Seed cao nhất được bye trước (seed 1 bye đầu tiên, seed 2 thứ hai, ...)
- Ví dụ: 6 người trong bracket 8 → seed 1 và seed 2 được bye → vào thẳng Round 2

Minimum players:
- Tournament cần tối thiểu 4 người để start
- Nếu < 4 sau 30 phút lobby → host được thông báo, có thể hủy
```

---

### [FIX-004] Sudden Death — tie cases

**Vấn đề:** Spec chỉ nói "1 câu, ai đúng trước thắng" nhưng không cover: cả 2 đều đúng, cả 2 đều sai, hoặc cả 2 đều timeout.

**Sửa mục 4.5, phần "Tie-break":**

```markdown
**Tie-break: Sudden Death**

Trigger: khi cả 2 player cùng hết match (đã trả lời hết câu) mà lives bằng nhau.

Rules:
- Server gửi 1 câu sudden death (difficulty = hard, random book)
- Thời gian: 10 giây (ngắn hơn bình thường để tạo áp lực)
- Kịch bản:
  | Player 1 | Player 2 | Kết quả |
  |---|---|---|
  | Đúng | Sai | P1 thắng |
  | Sai | Đúng | P2 thắng |
  | Đúng | Đúng | So elapsedMs → nhanh hơn thắng. Nếu chênh < 200ms → thêm 1 câu mới |
  | Sai | Sai | Thêm 1 câu sudden death mới |
  | Timeout | Timeout | Thêm 1 câu sudden death mới |
  | Đúng | Timeout | P1 thắng |
  | Timeout | Đúng | P2 thắng |

- Maximum 5 câu sudden death. Nếu sau 5 câu vẫn hòa → player có elapsedMs tổng thấp hơn thắng.
- Nếu vẫn hòa (cực kỳ hiếm) → random winner + cả 2 nhận badge "Kình Địch 🤝"

WebSocket events bổ sung:
  sudden_death_start: { matchId, message: "Sudden Death!" }
  sudden_death_question: { matchId, questionId, content, options, timeLimitSec: 10 }
  sudden_death_result: { matchId, p1Answer, p2Answer, p1ElapsedMs, p2ElapsedMs, winnerId? }
```

---

### [FIX-005] Friend System — spec vs code gap

**Vấn đề:** Spec mục 5.1 define Friend System chi tiết nhưng codebase không có module/entity/API nào cho friends.

**Quyết định: Chuyển Friend System sang v2.5 backlog, remove khỏi scope hiện tại.**

**Sửa spec:**

1. Mục 5.1 — thêm banner đầu section:
```markdown
### 5.1 Friend System (v2.5 — Chưa implement)
> ⚠️ Feature này nằm trong roadmap v2.5. Chưa có trong codebase hiện tại.
> Khi implement, cần thêm: Friend entity, FriendRequest entity, FriendController, 
> notification integration, friend leaderboard tab.
```

2. Mục 14 Roadmap — move vào v2.5:
```markdown
### v2.5 — Learning depth + Social (4-6 tuần)
- Spaced Repetition System (SRS)
- **Friend System: add friend, feed, friend leaderboard, thách đấu 1v1**  ← moved from v1.5
- Lộ trình học theo chủ đề
- Context note: bản đồ địa lý, bối cảnh lịch sử
```

3. Mục 8.3 API — đánh dấu friend endpoints:
```markdown
-- Friend (v2.5 — chưa implement)
GET    /me/friends            → list friends
POST   /me/friends/add        { username }
DELETE /me/friends/{userId}
```

4. Mục 5.4 Push Notification — sửa:
```markdown
- "Bạn của bạn vừa vượt qua điểm số của bạn! 😤"  → (v2.5, cần Friend System)
```

---

### [FIX-006] Share Card — rendering architecture clarification

**Vấn đề:** Spec ghi Puppeteer/Canvas nhưng chưa rõ frontend vs backend responsibility.

**Bổ sung vào mục 5.2, sau "API tạo share card":**

```markdown
**Rendering Architecture:**

Phase 1 (hiện tại — web app):
- Frontend: ShareCard.tsx = preview component, render trong React cho user xem trước
- Backend: ShareCardController → generate share URL + metadata (Open Graph tags)
- Share flow: user click "Chia sẻ" → copy URL → người nhận mở URL → server trả HTML 
  với OG tags (title, description, image URL) → social platform render preview
- Image: Frontend render canvas → toBlob() → upload to S3 via backend API
- Không cần Puppeteer container ở Phase 1

Phase 2 (khi scale):
- Backend Puppeteer container render PNG server-side (cho consistency across devices)
- CDN cache share card images
- share-renderer.Dockerfile từ scaffold

Quyết định: Dùng Phase 1 approach. Puppeteer container là premature optimization cho current scale.
```

---

### [FIX-010] Daily Challenge — timezone

**Vấn đề:** "Giống nhau cho tất cả user" mâu thuẫn với timezone khác nhau.

**Bổ sung vào mục 4.3 (Daily Challenge):**

```markdown
**Timezone handling:**

- Daily challenge seed dựa trên **UTC date** — tất cả user toàn cầu cùng 1 bộ câu trong cùng 1 UTC day
- Hiển thị cho user: "Daily Challenge — [date theo user timezone]"
- Countdown "Challenge mới sau": tính đến 00:00 UTC (hiển thị theo local time của user)
- Lý do chọn UTC: đơn giản, consistent, tránh edge case khi user đổi timezone
- Trade-off: user ở UTC+12 (New Zealand) sẽ nhận challenge mới lúc 12:00 trưa local time
  → chấp nhận được, vì target audience chính là Việt Nam (UTC+7 → challenge mới lúc 7:00 sáng)

Nếu sau này expand global → xem xét regional daily challenges (seed per timezone group)
```

---

### [FIX-011] WebSocket — rate limit

**Vấn đề:** Mục 11.3 chỉ có rate limit cho REST, không có cho WebSocket.

**Bổ sung vào mục 11.3 (Rate limiting), thêm bảng:**

```markdown
**WebSocket rate limits:**

| Event | Limit | Action khi vượt |
|---|---|---|
| `answer` (room/match) | 1/câu/2s per user | Ignore duplicate, log warning |
| `chat` (room) | 10 msg/phút per user | Throttle, gửi error event |
| `join` | 5/phút per user | Reject, gửi error event |
| `ready` | 3/phút per user | Ignore duplicate |
| Tổng events | 60/phút per connection | Disconnect + ban 5 phút |

Implementation: Spring WebSocket interceptor + Redis sliding window counter.
```

---

## Fix khi đến feature đó

### [FIX-007] Offline mode — không khả thi hiện tại

**Vấn đề:** Premium feature "Offline mode" nhưng app là web app, chưa có PWA/mobile.

**Sửa mục 12.1 Premium:**

```markdown
**Premium (BibleQuiz Pro):**
- ...existing features...
- ~~Offline mode (pre-cache câu hỏi)~~ → **Deferred to v3.0 (Mobile app)**
  - Lý do: cần React Native hoặc PWA với Service Worker
  - Khi implement: pre-cache 50 câu random per book, sync khi online
  - Current web app: hiện toast "Cần kết nối internet" khi offline
```

---

### [FIX-008] Question types — availability per version

**Vấn đề:** 6 loại câu hỏi nhưng không rõ loại nào available khi nào.

**Sửa mục 6.1, thêm cột "Version":**

```markdown
| Type | Mô tả | Version | UI Component |
|---|---|---|---|
| `multiple_choice_single` | 4 lựa chọn, 1 đúng | v1.0 ✅ | 4 answer buttons |
| `multiple_choice_multi` | 4–6 lựa chọn, ≥2 đúng | v1.0 ✅ | Checkbox buttons, submit khi chọn xong |
| `true_false` | Đúng / Sai | v1.0 ✅ | 2 large buttons |
| `fill_in_blank` | Điền từ còn thiếu | v2.0 | Text input + submit |
| `ordering` | Sắp xếp đúng thứ tự | v2.5 | Drag-and-drop list |
| `matching` | Ghép cặp | v2.5 | Drag lines hoặc tap-to-pair |

**Implementation note:**
- v1.0: Quiz.tsx chỉ cần handle 3 types đầu (buttons-based)
- v2.0: thêm text input component
- v2.5: thêm drag-and-drop library (cần hỏi trước khi add dependency)
- Backend Question entity đã support tất cả types qua `options JSON` + `correctAnswer JSON`
- AI Generator: v1.0 chỉ generate MCQ + true/false, v2.5 thêm ordering/matching
```

---

### [FIX-009] Multi-language — strategy

**Vấn đề:** Data model có QuestionLocale nhưng thiếu UX strategy.

**Bổ sung section mới 6.6:**

```markdown
### 6.6 Multi-language Strategy (v3.0)

> ⚠️ Chưa implement. Spec để sẵn data model cho future.

**Scope:**
- Phase 1 (current): Chỉ tiếng Việt (vi). UI và questions đều tiếng Việt.
- Phase 2 (v3.0): Thêm English (en), Korean (ko), Chinese (zh)

**Khi implement:**

App UI i18n:
- Dùng react-i18next hoặc tương đương
- User chọn language trong Profile settings → lưu `User.language`
- Fallback: vi → en → key

Question content:
- Question table = bản gốc (tiếng Việt)
- QuestionLocale table = bản dịch
- Khi fetch questions: JOIN với QuestionLocale WHERE language = user.language
- Fallback: nếu không có locale → hiện bản gốc tiếng Việt
- AI Generator: support prompt template per language

Leaderboard:
- Global leaderboard: tất cả ngôn ngữ chung
- Không tách leaderboard theo ngôn ngữ (user base nhỏ sẽ trống)

Daily Challenge:
- Cùng 5 câu cho tất cả, nhưng content hiển thị theo user language
- Nếu câu chưa có translation → hiện bản gốc
```

---

### [FIX-012] Group Quiz Set — lifecycle

**Vấn đề:** Thiếu rules cho quiz set do leader tạo.

**Bổ sung vào mục 5.3, sau "Group quiz: leader tạo bộ câu riêng":**

```markdown
**Group Quiz Set lifecycle:**

Tạo quiz set:
- Leader/mod chọn câu từ: toàn bộ question pool (filtered by book/chapter/difficulty)
- KHÔNG giới hạn chỉ câu đã bookmark — leader cần access full pool
- Tối đa: 50 câu/set, tối đa 20 sets/group
- Leader đặt tên set (ví dụ: "Bài học Chúa Nhật 30/03")

Chơi quiz set:
- Member vào Group → tab "Quiz nhóm" → chọn set → chơi
- Mode: giống Practice (không ảnh hưởng ranked leaderboard)
- Nhưng CÓ group leaderboard riêng cho mỗi quiz set
- Mỗi member chơi tối đa 3 lần/set (lấy score cao nhất)

Lifecycle:
- Active: member có thể chơi
- Archived: leader archive sau khi hết buổi học → vẫn xem kết quả, không chơi thêm
- Deleted: leader xóa → xóa mềm, giữ data 30 ngày rồi hard delete
- Không có expire tự động — leader quyết định

API bổ sung:
  PATCH /groups/{id}/quiz-sets/{setId}        { status: 'archived' }  (leader)
  DELETE /groups/{id}/quiz-sets/{setId}        (leader)
  GET /groups/{id}/quiz-sets/{setId}/leaderboard
  POST /groups/{id}/quiz-sets/{setId}/play     → { sessionId }
```

---

## Tổng kết thay đổi

| # | Fix | Mức độ | Ảnh hưởng |
|---|-----|--------|-----------|
| 001 | Java 21 → 17 | Phải fix ngay | Spec text only |
| 002 | Energy abandoned session | Phải fix ngay | Backend logic + DB |
| 003 | Tournament bye/seeding | Nên fix sớm | Backend logic |
| 004 | Sudden Death ties | Nên fix sớm | Backend + WebSocket + Frontend |
| 005 | Friend System → v2.5 | Phải fix ngay | Spec scope clarification |
| 006 | Share Card architecture | Nên fix sớm | Architecture decision |
| 007 | Offline mode → v3.0 | Khi đến | Spec text only |
| 008 | Question types per version | Khi đến | Spec text + Frontend |
| 009 | Multi-language strategy | Khi đến | Spec text only |
| 010 | Daily Challenge timezone | Nên fix sớm | Backend logic |
| 011 | WebSocket rate limit | Nên fix sớm | Backend infra |
| 012 | Group Quiz Set lifecycle | Khi đến | Backend + Frontend |

---

## Cách apply

1. Review document này
2. Approve/reject từng FIX
3. Với những FIX approved → cập nhật trực tiếp vào SPEC-v2.md
4. Ghi vào DECISIONS.md: "2026-04-02 — Applied SPEC-v2 Errata [FIX-001, FIX-002, ...]"
5. Với FIX cần code change → tạo task trong TODO.md
