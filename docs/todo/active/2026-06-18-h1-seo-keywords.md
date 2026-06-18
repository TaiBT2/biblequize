# 2026-06-18 — h1 SEO keyword tightening (Landing + Daily)

> **Source**: User hỏi "h1 đang SEO keyword gì" → chọn cách C (sửa cả 2)
> **Scope**: `apps/web` copy/markup. Landing h1 exact-match + Daily thêm h1.

### Tasks

- HSE-1 LandingPage h1 → exact-match "trắc nghiệm Kinh Thánh" / "Bible quizzes"
  - Status: [x] DONE · Files: `i18n/vi.json`, `i18n/en.json` (heroTitle1/heroHighlight/heroTitle2), `LandingPage.test.tsx` (assert)
  - VN: "Trắc nghiệm **Kinh Thánh** thú vị mỗi ngày" · EN: "Fun **Bible quizzes** every day"
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- HSE-2 DailyChallenge: thêm h1 (trang prerender thiếu h1, chỉ có h2)
  - Status: [x] DONE · Files: `daily/PageHeader.tsx` (h2→h1, bỏ whitespace-nowrap), `i18n/{vi,en}.json` (key mới `daily.heading`)
  - VN: "Thử Thách Kinh Thánh Hàng Ngày" · EN: "Daily Bible Challenge" (giữ `daily.title` cũ cho view quiz)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

### Note
- Highlight (gold) rơi vào "Kinh Thánh"/"Bible quizzes" để tránh giá trị i18n rỗng (test parity cấm empty).
- Deploy lại FE image (worktree sạch) sau khi xong.
