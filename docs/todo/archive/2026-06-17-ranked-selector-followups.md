# 2026-06-17 — Ranked selector follow-ups: meta-query merge + dependency inversion

> **Source**: User review cơ chế Ranked (chat 2026-06-17), defer list của [RSH](../archive/2026-06-17-ranked-selector-history-query-optimization.md) · **Scope**: BE `SmartQuestionSelector` perf + module boundary, no behavior change

### Tasks

- RSO-1 Gộp 3 query meta (easy/medium/hard) → 1 query, partition difficulty in-memory
  - Status: [x] DONE (commit 254fbe5) — SmartQuestionSelectorTest 8/8; Tầng 3 1066 0-fail · Files: `service/SmartQuestionSelector.java` · Test: `SmartQuestionSelectorTest`
  - Tier path hiện load meta 3 lần (1 query/difficulty) + 1 fallback. Đổi: load all-difficulty meta 1 lần, chia easy/medium/hard in-memory, fallback dùng lại list. Thuật toán bucket giữ nguyên.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

- RSO-2 Dependency inversion: `quiz` không còn import `ranked`
  - Status: [x] DONE — 3 class affected 39/39; Tầng 3 1066 0-fail; Spring context wire RankedTierDifficultyProvider OK · Files: `dto/DifficultyDistribution.java` (move), `service/TierDifficultyProvider.java` (new, quiz), `ranked/service/RankedTierDifficultyProvider.java` (new impl), `SmartQuestionSelector.java`, `ranked/service/TierDifficultyConfig.java` · Test: `SmartQuestionSelectorTest`, `TierConfigTest`, `TierDifficultyConfigTest`
  - Vi phạm CLAUDE.md: module `quiz` (`SmartQuestionSelector`) import `ranked` (`UserTierService`, `TierDifficultyConfig`). Đảo chiều: interface `TierDifficultyProvider` định nghĩa trong `quiz`, `ranked` implement. Giữ nguyên signature `selectQuestions(userId,...)` → 0 caller bên ngoài đổi. Move record `DifficultyDistribution` → `quiz/dto` (neutral type).
  - **Spec impact**: [x] None (refactor) · **Spec strategy**: [x] (c) `[no-spec-impact]`

### Findings (item 3 — demotion/decay)
- **KHÔNG sửa.** SPEC_USER_v3.2 §3.1: *"Tier all-time chỉ tăng, không giảm."* Progression-only là canonical intent (không phải competitive ladder). Code hiện (`UserTierService.getTierLevel` từ tổng điểm, monotonic) **khớp spec**. Build demotion = vi phạm spec. No BL needed.

### Out of scope
- Calibrate độ khó từ `timesCorrect/timesWrong` thực tế (data-driven difficulty) — feature lớn, cần spec confirm riêng.
