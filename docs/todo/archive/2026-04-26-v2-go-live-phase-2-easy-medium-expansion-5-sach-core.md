# 2026-04-26 — V2 Go-Live Phase 2: Easy/Medium expansion (5 sách core) [DONE]

> Theo `PROMPT_GENERATE_QUESTIONS_V2_GO_LIVE.md` section 10.1 Priority 2.
> Mục tiêu: nâng pool 5 sách core đạt target tổng (150-180 câu/sách) với ratio 30/45/25.
> Phase 1 đã thêm 140 Hard. Phase 2 thêm Easy/Medium để cân bằng ratio + đạt target.
> Tổng cộng 169 VI + 169 EN = 338 câu output.

### Task V2M-1: Genesis +30 Medium [x] DONE
- 120→150 (E47 M64 H39, ratio 31.3/42.7/26.0% — gần 30/45/25 ±3%)
- Seeder log `inserted=30` each file, total 4508→4568, invalid=0
- 27 single + 3 multi (90/10); idx 7/7/7/6
- File(s): `genesis_quiz.json` + `genesis_quiz_en.json` + `scripts/append_genesis_medium_v2.py`
- 4 types 8/8/7/7 covering 20 previously-uncovered Medium chapters (14, 15, 16, 19, 21, 24, 26, 28, 31, 33, 34, 35, 38, 43, 45, 46, 47, 48, 49, 50)

### Task V2M-2: Matthew +26 (1E + 25M) [x] DONE
- 134→160 (E48 M71 H41, ratio 30.0/44.4/25.6% — gần như khớp 30/45/25)
- Seeder log `inserted=26` each file, total 4568→4620, invalid=0
- 24 single + 2 multi (92/8); idx 7/6/6/5
- File(s): `matthew_quiz.json` + `matthew_quiz_en.json` + `scripts/append_matthew_medium_v2.py`
- Cover 3 chapters trước đó 0 Medium (16, 22, 23) + 12 sparse chapters

### Task V2M-3: John +29 (6E + 23M) [x] DONE
- 131→160 (E48 M71 H41, ratio 30.0/44.4/25.6% — khớp V2 target)
- Seeder log `inserted=29` each file, total 4620→4678, invalid=0
- 27 single + 2 multi (93/7); idx 8/6/7/6
- File(s): `john_quiz.json` + `john_quiz_en.json` + `scripts/append_john_em_v2.py`
- Coverage: Ch 16 (0 Medium trước đó) + sparse 8/9/11/21

### Task V2M-4: Romans +45 (15E + 30M) [x] DONE
- 85→130 (E39 M59 H32, ratio 30.0/45.4/24.6% — khớp V2 target)
- Seeder log `inserted=45` each file, total 4678→4768, invalid=0
- 42 single + 3 multi (93/7); idx 10/12/11/9
- File(s): `romans_quiz.json` + `romans_quiz_en.json` + `scripts/append_romans_em_v2.py`

### Task V2M-5: Psalms +39 Medium [x] DONE
- 141→180 (E59 M77 H44, ratio 32.8/42.8/24.4% — gần V2 target)
- Seeder log `inserted=39` each file, total 4768→4846, invalid=0
- 35 single + 4 multi (90/10); idx 8/9/9/9
- File(s): `psalms_quiz.json` + `psalms_quiz_en.json` + `scripts/append_psalms_medium_v2.py`
- Coverage: 39 previously-uncovered psalms (6, 7, 9, 10, 11, 15, 17, 20, 26, 29, 31, 36, 38, 41, 45, 47, 48, 49, 52, 57, 60, 61, 65, 69, 71, 78, 81, 88, 94, 99, 101, 102, 105, 106, 124, 125, 132, 144, 96/98/100)

### Task V2M-6: Verify final Phase 2 audit [x] DONE
- **Final per-file distribution** (VI + EN identical):
  - Genesis: 150 (47/64/39, 31.3/42.7/26.0%)
  - Matthew: 160 (48/71/41, 30.0/44.4/25.6%)
  - John: 160 (48/71/41, 30.0/44.4/25.6%)
  - Romans: 130 (39/59/32, 30.0/45.4/24.6%)
  - Psalms: 180 (59/77/44, 32.8/42.8/24.4%)
- **Aggregate (10 files)**: 1,560 questions — E482 / M684 / H394 → **30.9% / 43.8% / 25.3%** (khớp V2 target 30/45/25 trong ±3%)
- **Total pool**: 4768 → 4846 (+78 từ V2M-5; combined V2 P1+P2: 4228 → 4846 = +618 questions = 309 VI + 309 EN)
- **Idempotency verified**: 2nd restart `inserted=0` all files, total 4846, invalid=0
- **All commits**: V2M-1 dbf87eb, V2M-2 d0f5bce, V2M-3 a757405, V2M-4 a883c74, V2M-5 092cd97

---
