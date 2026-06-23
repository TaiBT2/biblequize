# 2026-06-24 — Quiz: badge độ khó theo từng câu (TẤT CẢ chế độ)

> **Source**: User — player phải thấy tag độ khó của câu ở MỌI chế độ: Luyện Tập, Daily Challenge, Đấu Hạng, Multiplayer…
> **Scope**: BE room module (`RoomQuizService.buildQuestionDto`) + FE shared component dùng chung cho 4 màn.
> **Phát hiện**: difficulty đã có sẵn ở — Daily BE (DailyChallengeController:59), Quiz `Question.difficulty` (Practice/Ranked/variety). Chỉ Multiplayer thiếu trong payload → DTAG-1.

### Tasks

- DTAG-1 BE: thêm `difficulty` vào question DTO của QUESTION_START (multiplayer)
  - Status: [x] DONE · Files: `RoomQuizService.java` (buildQuestionDto) · Test: BE Tầng 3 room suite
  - **Spec impact**: [x] SPEC_MULTIPLAYER · **Spec strategy**: [x] (a) inline note

- DTAG-2 FE: shared `<DifficultyBadge>` + wire vào 4 màn
  - Status: [x] DONE · Files: `components/DifficultyBadge.tsx` (mới), `types/room.ts`, `pages/room/RoomQuizShell.tsx`, `pages/Quiz.tsx` (Practice/Ranked/variety), `pages/DailyChallenge.tsx` (+interface field) · Test: `components/__tests__/DifficultyBadge.test.tsx`
  - **Spec impact**: [x] (cover ở DTAG-1) · **Spec strategy**: [x] (c) [no-spec-impact] (FE render)
  - Checklist: impl · reuse `.badge-easy/medium/hard` + i18n `practice.*` (không key mới) · Tầng 3 FE pass · commit

### Notes
- BE enum `Question.Difficulty = easy/medium/hard` (lowercase) → gửi `.name()`.
- Reuse CSS có sẵn: `.badge-easy/.badge-medium/.badge-hard` (global.css). KHÔNG tạo CSS mới.
- Label dùng i18n có sẵn: `practice.easy/medium/hard` (Dễ/Trung bình/Khó). Không thêm key mới.
- Câu AI/custom có thể null difficulty → ẩn badge (graceful).
- Sequential (group) render qua SequentialView riêng — scope này làm card non-sequential (4/5 modes gồm Speed Race). Sequential = follow-up nếu cần.
