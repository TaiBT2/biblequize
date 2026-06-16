# 2026-06-16 — Chất lượng distractor: chặn length-bias tại nguồn (QQA)

> **Source**: User phát hiện seed data bias nặng — đáp án đúng dài/dễ đoán, distractor sai lộ liễu. · **Scope**: AI generation prompt + import linter (KHÔNG backfill 7.320 câu cũ — defer).

## Bằng chứng (đo 2026-06-16, 7.320 câu MCQ-4 active)
- Đáp án đúng là **dài nhất: 80.3%** · dài hơn hẳn mọi distractor: **76.5%**.
- Độ dài TB đúng/sai: **52.6 / 21.9 ký tự (~2.4×)**.
- Lệch vị trí A/B/C/D: 31/22/25/22% (nhẹ, nghiêng A).
- → Chọn đáp án dài nhất = đúng ~76-80% mà không cần kiến thức.

### Tasks

- **QQA-1 Thêm luật distractor vào AI generation prompt** ✅
  - Status: [x] DONE (2026-06-16) · Files: `AIGenerationService.java` (`buildPrompt` — block luật cho MCQ, ví dụ `correctAnswer:2`) · Test: `AIGenerationPromptTest` (3)
  - **Spec impact**: [x] SPEC_ADMIN §7.1 (updated inline)
  - **Spec strategy**: [x] (a)
  - Checklist: [x] impl · [x] Tầng 1 (3/3) · [x] adminai module test · [x] spec · [ ] commit

- **QQA-2 Linter length-bias ở import (+ checker tái dùng)**
  - Status: [ ] TODO · Files: `modules/quiz/service/QuestionQualityChecker.java` (mới) + `AdminQuestionController.importQuestions` (IMP-7 warning) · Test: `QuestionQualityCheckerTest`
  - `checkLengthBias(options, correctAnswer)` → {correctIsLongest, ratio = len(correct)/avg(distractor)}. Import: nếu correctIsLongest && ratio ≥ 1.5 → warning "đáp án đúng dài hơn distractor (dễ đoán)". Non-blocking (vẫn vào PENDING để review thấy cảnh báo).
  - **Spec impact**: [ ] SPEC_ADMIN §7 import (IMP rules)
  - **Spec strategy**: [ ] (a) update inline
  - Checklist: impl · Tầng 1+3 · spec · commit

### Out of scope (defer)
- Backfill 7.320 câu cũ: tool AI rewrite distractor (ưu tiên ratio >2× + pool Ranked active). Tốn quota 200/ngày.
- Flag length-bias ở `POST /questions` (create) + ở AI-draft FE trước khi lưu.
- Position-bias (nghiêng A): nhẹ, theo dõi sau.
