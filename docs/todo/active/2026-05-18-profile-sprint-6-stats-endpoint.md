# 2026-05-18 — Profile Sprint 6: BE `/api/me/stats` endpoint cho lifetime accuracy

> **Source**: User question 2026-05-18 — "tỉ lệ đúng đã có api nào tính chưa". Sau Sprint 5 fix shape, FE vẫn aggregate accuracy từ `/api/me/history` (paginated 20/page) → chỉ tính 20 phiên gần nhất, không phải lifetime. Cần BE endpoint mới.

### Root cause

Không có endpoint BE nào trả overall accuracy lifetime của user:
- `/api/me/weaknesses` → per-book (chỉ sách ≥5 câu), không phải overall
- `/api/me/question-coverage` → coverage % (seen/total), không phải accuracy
- `/api/me/history` → per-session, paginated → FE sum không đầy đủ

Source of truth là `UserQuestionHistory` table (track `timesSeen/timesCorrect/timesWrong` per user × question). Repo có `getAccuracyByBook` nhưng thiếu method SUM overall.

### Task

- PRO-S6-1 BE endpoint mới + FE replace history aggregation
  - **BE**:
    - Add `UserQuestionHistoryRepository.sumOverallAccuracy(userId)` — JPQL SUM của `timesSeen / timesCorrect / timesWrong` (no GROUP BY)
    - Add `UserController.@GetMapping("/stats")` — return `{ totalSeen, totalAnswered, totalCorrect, totalWrong, accuracyPercent, totalSessions }`. totalSessions count completed sessions via existing `quizSessionRepository.countByOwnerIdAndStatus`.
    - `accuracyPercent = totalCorrect / (totalCorrect + totalWrong) * 100` (follow /weaknesses convention).
  - **FE Profile.tsx**:
    - New useQuery `/api/me/stats`
    - Replace `totalSessions/totalQuestions/totalCorrect/correctRate` derivations: từ `historyData.items` aggregate → từ `statsData` direct
    - Keep `historyData` cho heatmap (heatmap chỉ cần session dates, dữ liệu paginated đủ dùng)
  - **Tests**:
    - Mock `/api/me/stats` trong `Profile.test.tsx` (default + error path)
    - BE compile pass (mvnw compile -q -o → EXIT=0)
    - Tầng 3 FE 1167/125 = clean state
  - Status: [x] DONE
  - Files: `UserQuestionHistoryRepository.java` + `UserController.java` + `Profile.tsx` + `Profile.test.tsx`
  - Commit: `feat(api): /api/me/stats lifetime accuracy + wire Profile StatsStrip [no-spec-impact]`

### Common

- **Spec impact**: [x] None — adds endpoint that makes UI display correct, doesn't change spec semantics. SPEC §27.2 list may want updating later but no behavior change.
- **Spec strategy**: [x] (c) [no-spec-impact]
