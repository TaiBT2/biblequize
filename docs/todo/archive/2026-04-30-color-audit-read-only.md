# 2026-04-30 — Color Audit (read-only) [DONE — chờ commit]

> Source: `docs/prompts/PROMPT_COLOR_AUDIT.md` (đã sửa 2026-04-30).
> Output: `docs/COLOR_AUDIT.md` (350+ lines, 10 sections).

### Tasks CA-1 → CA-10
- Status: [x] DONE 2026-04-30 — toàn bộ 10 tasks hoàn thành trong 1 pass.
- Key findings:
  - 332 hardcoded hex (web), 37 (mobile)
  - **Tier colors web↔mobile: 6/6 mismatch** (tier 2 hue khác — green vs blue)
  - 5 :root blocks chồng nhau trong global.css (HP, Cyberpunk, Royal Gold, Warm-card)
  - 4 đáp án Quiz dùng IDENTICAL màu — không có per-position color
  - Mobile dead tokens: 6 tier names cũ (Spark/Dawn/Lamp/Flame/Star/Glory)
  - WCAG: pass tất cả states trừ RoomQuiz disabled (~3.8:1, fail AA)
- Commit: `docs: add color audit report` (chờ user confirm)

---
