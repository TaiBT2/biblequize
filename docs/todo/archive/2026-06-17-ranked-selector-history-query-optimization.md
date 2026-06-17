# 2026-06-17 — Ranked selector: gộp history load + bỏ N+1 query

> **Source**: User review cơ chế phát câu hỏi Ranked (chat 2026-06-17) · **Scope**: BE `SmartQuestionSelector` hot-path perf, no behavior change

Mỗi request `/api/ranked/questions/select` hiện chạy `selectIdsWithSmartHistory` 3 lần (easy/medium/hard), mỗi lần lặp lại 2 query aggregate history + 1 query/câu-đã-thấy (N+1) tại [SmartQuestionSelector.java:110](../../../apps/api/src/main/java/com/biblequiz/modules/quiz/service/SmartQuestionSelector.java#L110). Tổng ≈ `9 + 3N` query (N = số câu user đã thấy). Mục tiêu: load history **1 lần** thành map in-memory, phân loại không query → còn `1 + 3` query, độc lập với N.

### Tasks

- RSH-1 Thêm `HistoryMeta` DTO + repository projection `findHistoryMetaByUserId`
  - Status: [x] DONE · Files: `dto/HistoryMeta.java` (new), `repository/UserQuestionHistoryRepository.java` · Test: compile + dùng ở RSH-2
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · build pass · commit

- RSH-2 Refactor `SmartQuestionSelector`: load history 1 lần, truyền map xuống, bỏ N+1
  - Status: [x] DONE — SmartQuestionSelectorTest 8/8; Tầng 3 1066 tests 0 fail (≥ baseline 828); spec-audit no NEW broken · Files: `service/SmartQuestionSelector.java` · Test: `SmartQuestionSelectorTest`
  - **Spec impact**: [x] None — phân loại unseen/review/long-ago/recent giữ nguyên thuật toán
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · update test mocks → `findHistoryMetaByUserId` · Tầng 1+2+3 pass ≥ baseline · `audit.sh` no NEW broken · commit

### Out of scope (defer)
- Gộp 3 query meta (easy/medium/hard) → 1 query in-bucket distribution
- Dependency inversion: truyền `DifficultyDistribution` vào selector thay vì pull module `ranked`
- Ranked semantics (demotion/decay) — cần confirm SPEC_USER
- `selectFromPool` (path khác, chỉ 1 query seenIds, không N+1) — không đụng
