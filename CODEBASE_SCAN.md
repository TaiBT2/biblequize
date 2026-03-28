# Codebase Scan — Stubs, Dead Code, Placeholders
> Scanned: 2026-03-28

## 1. Placeholder methods (trả giá trị hardcode, chưa implement thật)

### ChurchGroupService.getLeaderboard() — score luôn = 0
- **File**: `apps/api/src/main/java/com/biblequiz/modules/group/service/ChurchGroupService.java`
- **Line**: 158-160
- **Vấn đề**: Trả `score: 0, questionsAnswered: 0` hardcode cho mọi member
- **Cần làm**: Query `UserDailyProgress` theo userId + period để tính score thật

### ChurchGroupService.getAnalytics() — activeToday luôn = 0
- **File**: `apps/api/src/main/java/com/biblequiz/modules/group/service/ChurchGroupService.java`
- **Line**: 177-178
- **Vấn đề**: Trả `activeToday: 0` hardcode
- **Cần làm**: Count members có `UserDailyProgress` record ngày hôm nay

### ShareCardService — imageUrl trỏ endpoint không tồn tại
- **File**: `apps/api/src/main/java/com/biblequiz/modules/share/service/ShareCardService.java`
- **Line**: 33, 48
- **Vấn đề**: `imageUrl` = `/api/share/images/session/{id}` nhưng endpoint đó không tồn tại. Trả JSON metadata, chưa render PNG thật.
- **Cần làm**: Implement server-side image generation (Puppeteer/Canvas) hoặc trả redirect đến image service

---

## 2. Dead infrastructure code (không ai import/sử dụng)

| Class | File | Lines | Sử dụng? |
|-------|------|-------|----------|
| `CircuitBreakerService` | `infrastructure/circuit/CircuitBreakerService.java` | 152 | Không — 0 references |
| `DistributedTransactionManager` | `infrastructure/consistency/DistributedTransactionManager.java` | ~100 | Không — 0 references |
| `EventSourcingService` | `infrastructure/consistency/EventSourcingService.java` | ~100 | Không — 0 references |
| `InterServiceCommunicationService` | `infrastructure/service/InterServiceCommunicationService.java` | ~100 | Không — 0 references |
| `PerformanceMonitoringService` | `infrastructure/service/PerformanceMonitoringService.java` | ~80 | Không — 0 references |
| `BusinessRulesEngine` | `modules/business/BusinessRulesEngine.java` | ~100 | Không — 0 references |

### ServiceRegistry — hoạt động nhưng vô nghĩa
- **File**: `infrastructure/discovery/ServiceRegistry.java` (152 lines)
- **Sử dụng bởi**: `HealthCheckController` — show `serviceRegistry: {totalServices: 0, status: DOWN}`
- **Vấn đề**: Luôn trả 0 services vì không ai gọi `registerService()`. Health endpoint trả `status: DOWN` gây nhầm lẫn.
- **Đề xuất**: Xóa hoặc remove khỏi health response

**Tổng dead code: ~6 classes, ~700 lines** — an toàn để xóa.

---

## 3. AIGenerationService — KHÔNG phải stub

- **File**: `modules/adminai/AIGenerationService.java` (385 lines)
- **Status**: Hoạt động thật
- `generate()` — gọi **Gemini API** (parallel requests), parse JSON, trả list questions
- `generateWithClaude()` — gọi **Anthropic Claude API**, auto-select model theo difficulty
- `buildPrompt()` — prompt có cấu trúc, hỗ trợ 4 question types, multi-language
- **Điều kiện**: Cần `gemini.api-key` hoặc `anthropic.api-key` trong `.env`
- Các `return null` (line 111/123/204/212/220) là error handling hợp lệ — request fail → skip → filter nulls

---

## 4. Return null hợp lệ (KHÔNG phải stub)

| File | Method | Lý do null |
|------|--------|------------|
| `BookProgressionService.java:41,60` | `getNextBook()`, `getPreviousBook()` | Cuối/đầu Bible → null = không có sách kế |
| `RankedSessionService.java:51` | `get()` | Session không tồn tại trong Redis |
| `QuestionService.java:54,70` | `getRandomQuestions()` | Empty list khi không có questions match filter |
| `QuestionService.java:140` | `getRandomQuestion()` | Không có question nào active |
| `SuddenDeathMatchService.java:62,70` | `getNextChallenger()` | Queue rỗng → null |
| `AuthCodeService.java:50,53` | `getAndRemove()` | Auth code không tồn tại/đã expire |
| `DailyChallengeService.java:53` | `getDailyQuestions()` | Không có questions trong DB → empty list |

---

## 5. Tóm tắt

| Loại | Count | Action |
|------|-------|--------|
| Placeholder methods (hardcode values) | 3 methods | Fix — implement logic thật |
| Dead infrastructure classes | 6 classes (~700 lines) | Xóa |
| ServiceRegistry (misleading health) | 1 class | Xóa hoặc fix health response |
| AI Generation Service | Hoạt động thật | Không cần fix |
| Return null hợp lệ | ~10 locations | Không cần fix |
| TODO/FIXME/HACK comments | 0 | Clean |
