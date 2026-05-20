# 2026-05-18 — Fix seed questions VN: thay từ "text" tiếng Anh sang Kinh Thánh/đoạn

> **Source**: User screenshot CâuHỏi 10/10 (Genesis 26:7-11) hiển thị "Trường hợp nào CÓ trong text?" — từ "text" tiếng Anh trong câu tiếng Việt không rõ nghĩa với độc giả Tin Lành VN.
>
> **Scope**: Seed data VN only (`apps/api/src/main/resources/seed/questions/*.json`). Tổng 21 chỗ rải rác qua 7 file VN. KHÔNG sửa `*_en.json` (tiếng Anh dùng "text" đúng nghĩa). KHÔNG sửa logic code.

### Tasks

- TXT-1 Fix `genesis_quiz.json` (7 chỗ: 2699, 2733, 2789, 2813, 3152, 3348, 3457)
  - Status: [x] DONE
  - Files: `apps/api/src/main/resources/seed/questions/genesis_quiz.json`
  - Test: file JSON parse hợp lệ; grep `\btext\b` không còn match trong VN file
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: edit → JSON validate → commit

- TXT-2 Fix `matthew_quiz.json` (5 chỗ: 3219, 3300, 3463, 3627, 4142)
  - Status: [x] DONE
  - Files: `apps/api/src/main/resources/seed/questions/matthew_quiz.json`
  - Test: file JSON parse hợp lệ; grep `\btext\b` không còn match
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: edit → JSON validate → commit

- TXT-3 Fix `psalms_quiz.json` (5 chỗ: 3172, 3173, 3309, 3310, 4503)
  - Status: [x] DONE
  - Files: `apps/api/src/main/resources/seed/questions/psalms_quiz.json`
  - Test: file JSON parse hợp lệ; grep `\btext\b` không còn match
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: edit → JSON validate → commit

- TXT-4 Fix `john_quiz.json` + `romans_quiz.json` (4 chỗ: john 3029, 4247; romans 1825, 3213)
  - Status: [x] DONE
  - Files: `apps/api/src/main/resources/seed/questions/john_quiz.json`, `apps/api/src/main/resources/seed/questions/romans_quiz.json`
  - Test: file JSON parse hợp lệ; grep `\btext\b` không còn match
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: edit → JSON validate → commit

- TXT-5 Verify: grep `\btext\b` toàn folder seed VN → 0 match
  - Status: [x] DONE
  - Test: 0 match trong VN files (giữ nguyên trong *_en.json)
