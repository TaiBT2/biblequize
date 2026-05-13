# 2026-04-26 — V2 Go-Live: Hard-only priority (5 sách core) [DONE]

> Theo `PROMPT_GENERATE_QUESTIONS_V2_GO_LIVE.md` section 10.1 Priority 1.
> Mục tiêu: nâng pool Hard từ 13% → 25% cho 5 sách core (Genesis, Matthew, John, Romans, Psalms).
> Chỉ sinh **Hard** trong phase này — ratio E/M/H tổng sách sẽ tự kéo về gần 25% Hard.
> Mỗi câu PHẢI thuộc 1 trong 4 kiểu Hard hợp lệ (section 3): cross-ref / distinguish / hiểu sâu / verse precision.
> Distractor phải near-miss (section 4), length tolerance Hard ≤ 2×.

### Task V2H-1: Genesis +20 Hard
- Status: [x] DONE — 100→120 (E47 M34 H39, Hard 32.5%); seeder log `inserted=20` each file, total 4228→4268
- File(s): `apps/api/src/main/resources/seed/questions/genesis_quiz.json` + `genesis_quiz_en.json` + `scripts/append_genesis_hard_v2.py`
- Strategy: 4 kiểu Hard mix đều 5 câu/kiểu; 17 single + 3 multi (85/15); single idx 4/4/5/4
- Chapters covered: 1, 3, 4, 6, 7, 9, 11, 15, 17, 18, 22, 25, 29, 32, 35, 37, 50

### Task V2H-2: Matthew +30 Hard
- Status: [x] DONE — 104→134 (E47 M46 H41, Hard 30.6%); seeder log `inserted=30` each file, total 4268→4328
- File(s): `matthew_quiz.json` + `matthew_quiz_en.json` + `scripts/append_matthew_hard_v2.py`
- Strategy: 4 kiểu Hard mix 7-8 câu/kiểu; 25 single + 5 multi (83/17); single idx 7/7/6/5
- Chapters covered: 1, 2, 3, 5, 6, 7, 9, 10, 11, 12, 13, 15, 16, 18, 22, 25, 26, 27, 28

### Task V2H-3: John +30 Hard
- Status: [x] DONE — 101→131 (E42 M48 H41, Hard 31.3%); seeder log `inserted=30` each file, total 4328→4388
- File(s): `john_quiz.json` + `john_quiz_en.json` + `scripts/append_john_hard_v2.py`
- Strategy: 4 kiểu Hard 8/8/7/7; 26 single + 4 multi (87/13); single idx 7/7/7/5
- Chapters covered: 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20

### Task V2H-4: Romans +25 Hard
- Status: [x] DONE — 60→85 (E24 M29 H32, Hard 37.6%); seeder log `inserted=25` each file, total 4388→4438
- File(s): `romans_quiz.json` + `romans_quiz_en.json` + `scripts/append_romans_hard_v2.py`
- Strategy: 4 kiểu Hard 6/6/7/6; 21 single + 4 multi (84/16); single idx 5/6/5/5
- Chapters covered: 1, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15

### Task V2H-5: Psalms +35 Hard
- Status: [x] DONE — 106→141 (E59 M38 H44, Hard 31.2%); seeder log `inserted=35` each file, total 4438→4508
- File(s): `psalms_quiz.json` + `psalms_quiz_en.json` + `scripts/append_psalms_hard_v2.py`
- Strategy: 4 kiểu Hard 8/9/9/9; 29 single + 6 multi (83/17); single idx 7/8/7/7
- Psalms covered: 1, 2, 13, 16, 19, 23, 24, 27, 32, 46, 51, 72, 73, 80, 90, 95, 103, 104, 110, 119, 120, 121, 137, 139, 146

### Task V2H-6: Verify total + audit [x] DONE
- **Final per-file distribution** (VI + EN identical):
  - Genesis: 120 (E47 M34 H39, Hard 32.5%, 117 single + 3 multi)
  - Matthew: 134 (E47 M46 H41, Hard 30.6%, 129 single + 5 multi)
  - John: 131 (E42 M48 H41, Hard 31.3%, 127 single + 4 multi)
  - Romans: 85 (E24 M29 H32, Hard 37.6%, 81 single + 4 multi)
  - Psalms: 141 (E59 M38 H44, Hard 31.2%, 135 single + 6 multi)
- **Aggregate (5 books × 2 lang)**: 1,222 questions; E438/M390/H394 (32.2% Hard); 1,178 single + 44 multi
- **Total pool**: 4228 → 4508 (+280 = 140 VI + 140 EN)
- **Idempotency verified**: 2nd restart shows `inserted=0` all 5 files, total 4508, invalid=0
- **Index distribution per batch (single only)**: Genesis 4/4/5/4, Matthew 7/7/6/5, John 7/7/7/5, Romans 5/6/5/5, Psalms 7/8/7/7 — all balanced 20-30% per index
- **Spec compliance**: each batch ratio E/M/H slightly above 25% Hard target (because adding only Hard); will rebalance when Phase 2 (Easy/Medium) runs

---
