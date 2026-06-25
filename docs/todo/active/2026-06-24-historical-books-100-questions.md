# 2026-06-24 — Soạn 100 câu/sách cho 12 sách Lịch Sử (Haladyna × Bloom)

> **Source**: User prompt — "dùng skill bible-quiz-authoring tạo 100 câu cho mỗi sách: Giô-suê, Các Quan Xét, Ru-tơ, I-II Sa-mu-ên, I-II Các Vua, I-II Sử Ký, E-xơ-ra, Nê-hê-mi, Ê-xơ-tê".
> **Scope**: seed VN `apps/api/src/main/resources/seed/questions/{book}_quiz.json` → mỗi sách +100 câu mới. Skill `.claude/skills/bible-quiz-authoring`. Bản dịch RVV11/BTTHĐ 2011. EN gen sau.
> **Status**: DONE (2026-06-25) — 12 sách × 100 câu = 1200 câu VI đã append + commit (1 commit/sách). Validator 0 ERROR / 0 length-bias / 0 trùng. Bản EN gen sau.

### Quyết định
- Phân bổ mỗi sách: **40 easy / 40 medium / 20 hard** (như Genesis/Exodus/Leviticus).
- Fan-out: 10 subagent/sách, mỗi agent 10 câu (4e/4m/2h) trong 1 lát chương rời nhau → 0 trùng nội bộ. Validator là lưới an toàn.
- 1 sách = 1 commit `feat: +100 câu <Sách> ... [no-spec-impact]`.

### Tasks (HB-1..HB-12, mỗi task = 1 sách = 1 commit)
- HB-1 Giô-suê (Joshua) · HB-2 Các Quan Xét (Judges) · HB-3 Ru-tơ (Ruth)
- HB-4 I Sa-mu-ên (1 Samuel) · HB-5 II Sa-mu-ên (2 Samuel)
- HB-6 I Các Vua (1 Kings) · HB-7 II Các Vua (2 Kings)
- HB-8 I Sử Ký (1 Chronicles) · HB-9 II Sử Ký (2 Chronicles)
- HB-10 E-xơ-ra (Ezra) · HB-11 Nê-hê-mi (Nehemiah) · HB-12 Ê-xơ-tê (Esther)
  - Status mỗi sách: `[ ]` TODO → gen (fan-out) → validate (schema+dedup+length-bias) → append → `[x]`
  - **Spec impact**: `[x]` (c) `[no-spec-impact]` (nội dung seed, không đổi behavior/luật)
  - Checklist/sách: 100 câu = 40e/40m/20h · 0 trùng stem vs file · validator 0 ERROR · append · commit

### Tiến độ
- [x] HB-1 Joshua · [x] HB-2 Judges · [x] HB-3 Ruth · [x] HB-4 1Samuel · [x] HB-5 2Samuel
- [x] HB-6 1Kings · [x] HB-7 2Kings · [x] HB-8 1Chronicles · [x] HB-9 2Chronicles
- [x] HB-10 Ezra · [x] HB-11 Nehemiah · [x] HB-12 Esther

### Ghi chú thực thi
- Fan-out qua Workflow: lần 1 sinh 6 sách đủ + 1 sách dở (session limit), lần 2 retry 55 lát còn lại OK.
- 152 câu dính length-bias → 1 fix-pass (1 agent/sách rebalance độ dài option) → splice → còn 0.
- 12 câu có 5 option (judges 1 lát, 2samuel 1, ezra 1) — hợp lệ schema MCQ, giữ nguyên.
- Phân bổ ~40e/40m/20h mỗi sách (lệch ±1 ở vài sách, chấp nhận).
