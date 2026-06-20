# 2026-06-19 — Guest practice play (no-session local mode)

> **Source**: User — "đào sâu + fix bug guest practice (#1)". Trang chủ quảng cáo "Không cần
> đăng ký chơi thử" nhưng bấm Bắt Đầu Luyện Tập → `POST /api/sessions` trả **401**.
> **Scope**: `apps/web` — chỉ `pages/Practice.tsx` + test. KHÔNG đụng backend / SecurityConfig.

## Diagnosis (đã khảo sát)

- **Bug**: `Practice.startQuiz()` LUÔN `POST /api/sessions` (auth-required, `.anyRequest().authenticated()`
  trong SecurityConfig) → guest nhận 401 "Unauthorized access".
- **Spec canonical**: `SPEC_USER_v3.2.md` §5.1 dòng 267 — Practice `Auth: mixed (guest có thể chơi,
  không lưu tier)`; dòng 76 guest role = onboarding try-quiz. → Code phải catch up, copy landing ĐÚNG.
- **Mấu chốt**: `Quiz.tsx` + `QuizResults.tsx` + `Review.tsx` **ĐÃ hỗ trợ no-session/client-state**:
  - [Quiz.tsx:460-470] có sessionId → POST answer; KHÔNG có → chấm client-side (`correctAnswer[0]`).
  - [Quiz.tsx:616] complete POST chỉ khi có sessionId; lifeline `enabled: !!sessionId`.
  - [QuizResults.tsx] `sessionId` chỉ khai báo trong props, KHÔNG dùng trong body → an toàn `undefined`.
  - [Review.tsx:14-34] đọc 100% từ `location.state.stats` (client), không gọi server cho phần xem lại.
  - `GET /api/questions` (permitAll) trả `List<Question>` entity — shape khớp Quiz `Question`
    interface (id/book/chapter/verseStart/verseEnd/difficulty/type/content/options/**correctAnswer**/explanation),
    không `@JsonIgnore`. Hỗ trợ đủ filter book/difficulty/language/chapter/verse/limit.
- → Chỉ entry-point `Practice.tsx` bị hardwire vào `POST /api/sessions`. Fix = FE-only.

### Tasks

- GP-1 Guest branch trong Practice.startQuiz + gate logged-in-only queries
  - Status: [x] DONE + deployed `af67d2da` · Files: `pages/Practice.tsx`, `pages/__tests__/Practice.test.tsx`
  - **Verified prod (Playwright, guest no-localStorage)**: /practice load sạch (hết banner "Unauthorized");
    Bắt Đầu → /quiz render câu thật "Sô-phô-ni 2:3" (4 đáp án, 1/10); trả lời → "Chính xác! +52 Điểm"
    (chấm client-side); **0 console errors** (hết 401 storm); network chỉ `GET /api/books` + `GET /api/questions`
    (200), KHÔNG có `POST /api/sessions`. Backend `/api/questions` guest = HTTP 200, shape khớp Quiz interface.
  - Impl: đọc `isAuthenticated` (authStore). Khi guest → `GET /api/questions` với filter hiện tại →
    `navigate('/quiz', { state: { questions, mode:'practice', ...settings } })` (KHÔNG sessionId);
    empty → errorMsg. Khi authed → giữ nguyên `POST /api/sessions`. Gate `practice/recent` +
    `wrong-questions/count` queries `enabled: isAuthenticated` (dẹp 401 noise cho guest).
  - Test: mock authStore; authed→POST /api/sessions (giữ test cũ); guest→GET /api/questions + navigate
    no-session; guest không gọi practice/recent.
  - **Spec impact**: [x] SPEC_USER §5.1 — ĐÃ specify "guest có thể chơi"; code catch up, KHÔNG cần sửa spec
  - **Spec strategy**: [x] code-compliance (spec đã canonical) — commit `fix:` ref §5.1
  - Checklist: impl · Tầng 1+2+3 pass · `audit.sh` no NEW broken · build+deploy+Playwright verify guest chơi xong 1 quiz · commit

### Verify (E2E thật sau deploy)
- Playwright (no localStorage = guest): /practice → Bắt Đầu → /quiz render câu hỏi → trả lời nhận
  feedback → hoàn thành → QuizResults hiện điểm. KHÔNG còn "Unauthorized access".

### Out of scope (defer)
- Review "Retry" button cho guest (cần sessionId) — no-op hiện tại, không phá; để sau nếu cần.
- "50,000 người" claim ở Landing CTA (vấn đề #2, marketing honesty) — chờ user quyết.
