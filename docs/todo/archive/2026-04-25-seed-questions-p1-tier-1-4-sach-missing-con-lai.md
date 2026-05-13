# 2026-04-25 — Seed questions P1 Tier 1 (4 sách missing còn lại) [DONE]

> Theo `book-todo.md` — 4 sách thuộc P1 Tier 1 còn thiếu sau khi Obadiah đã done. Mỗi sách 20 câu × 2 file (VI + EN, 1:1 mapping). Phân bổ: ~10 easy / 6 medium / 4 hard, ~17 single + 3 multi, correctAnswer index đều 0/1/2/3.

### Task SEED-P1T1-1: Philemon (25 câu trong 1 chương)
- Status: [x] DONE — 21 câu VI + 21 câu EN, validation pass (10 easy / 7 medium / 4 hard, 18 single + 3 multi, idx 5/4/5/4)
- File(s): `apps/api/src/main/resources/seed/questions/philemon_quiz.json` + `philemon_quiz_en.json`
- Nội dung: Phao-lô gửi Phi-lê-môn xin tha Ô-nê-sim (nô lệ bỏ trốn đã được cứu). Themes: tha thứ, phục hồi, tình yêu trong Christ, lời cầu xin của Phao-lô.
- Checklist:
  - [ ] 20 câu VI (RVV11) + 20 câu EN (ESV), 1:1 mapping
  - [ ] Mix difficulty ~ 10 easy / 6 medium / 4 hard
  - [ ] correctAnswer index distribution đều 0/1/2/3
  - [ ] Restart api container verify seeder log `inserted=20` cho mỗi file
  - [ ] Commit: `feat(seed): Philemon question pair (VI + EN, 20 each)`

### Task SEED-P1T1-2: 2 John (13 câu trong 1 chương)
- Status: [x] DONE — 20 câu VI + 20 câu EN, validation pass (10/7/3 easy/medium/hard, 17 single + 3 multi, idx 5/4/4/4)
- File(s): `2john_quiz.json` + `2john_quiz_en.json`
- Nội dung: Gửi "bà được chọn". Themes: đi trong lẽ thật, yêu thương nhau, cảnh báo chống kẻ địch lại Christ (antichrist), không tiếp đón giáo sư giả.
- Commit: `feat(seed): 2 John question pair (VI + EN, 20 each)`

### Task SEED-P1T1-3: 3 John (14 câu trong 1 chương)
- Status: [x] DONE — 20 câu VI + 20 câu EN, validation pass (10/7/3, 17 single + 3 multi, idx 5/4/4/4)
- File(s): `3john_quiz.json` + `3john_quiz_en.json`
- Nội dung: Gửi Gai-út. Themes: đi trong lẽ thật, lòng hiếu khách với anh em giảng đạo, lên án Đi-ô-trép kiêu ngạo, khen ngợi Đê-mê-triu.
- Commit: `feat(seed): 3 John question pair (VI + EN, 20 each)`

### Task SEED-P1T1-4: Jude (25 câu trong 1 chương)
- Status: [x] DONE — 20 câu VI + 20 câu EN, validation pass (10/7/3, 17 single + 3 multi, idx 5/4/4/4)
- File(s): `jude_quiz.json` + `jude_quiz_en.json`
- Nội dung: Cảnh báo chống giáo sư giả đổi ân điển ra buông tuồng. References: thiên sứ không giữ phận mình, Sô-đôm Gô-mô-rơ, Mi-chen tranh luận với ma quỷ, Ca-in/Ba-la-am/Cô-rê, lời tiên tri Hê-nóc, doxology cuối.
- Commit: `feat(seed): Jude question pair (VI + EN, 20 each)`
