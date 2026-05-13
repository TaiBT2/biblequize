# 2026-04-19 — Actionable locked card UX [DONE]

### Task LOCK-1: Show XP gap + CTA navigate to Practice (GameModeGrid)
- Status: [x] DONE
- Vấn đề: locked Ranked/Tournament cards chỉ show tier name ("Đạt Người Tìm Kiếm"), user không biết cần bao nhiêu điểm hay làm gì để earn
- Fix:
  - Hint text giờ show **XP gap cụ thể**: "Cần thêm 1,000 điểm để đạt Người Tìm Kiếm" (thay vì chỉ "Đạt Người Tìm Kiếm để mở khóa")
  - Thêm **progress bar** dưới hint — visual feedback tiến độ
  - CTA button giờ **navigate to /practice** (onboarding path kiếm XP) thay vì dead click
  - CTA text đổi thành "Luyện tập để kiếm điểm" — actionable
  - Button style: accent gold thay vì muted grey (rõ là có thể click)
- i18n: thêm `unlockAtWithPoints` + `unlockCtaEarnXp` keys (vi + en)
- Tests: +3 case (progress bar present, CTA navigates /practice, XP gap shown in text)
- Commit: "feat(home): actionable locked card UX (XP gap + progress + CTA to Practice)"
