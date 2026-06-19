# 2026-06-19 — Crawlability fixes (noindex 404 + canonical /leaderboard + VN-first)

> **Source**: User — đánh giá crawlability → fix #1 soft-404 noindex + #2 canonical /leaderboard;
> rồi "trang 2 ngôn ngữ vì sao GG crawl ra tiếng Anh" → #3 VN-first default.
> **Scope**: `apps/web` SEO meta + i18n language detection.

Audit crawlability: tốt (~8.5/10). robots/sitemap/redirect/prerender/internal-link ổn. 2 điểm trừ:
soft-404 (URL không tồn tại trả 200 + NotFound không noindex) và /leaderboard thiếu canonical.

### Tasks

- CRW-1 noindex cho NotFound (chống soft-404 index URL rác)
  - Status: [x] DONE + deployed `20759e92` · Files: `components/PageMeta.tsx` (thêm prop `noindex`),
    `pages/NotFound.tsx` (noindex + sửa title có dấu), `PageMeta.test.tsx` (test noindex)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- CRW-2 canonical /leaderboard
  - Status: [x] DONE + deployed `8df34b08` · Files: `pages/Leaderboard.tsx` (PageMeta canonicalPath="/leaderboard")
  - Resolved tự nhiên: process song song commit `936cf238 (LBF-4)` đã cuốn luôn canonical của tôi (whole-file add).
    Deploy HEAD kèm leaderboard work đã-commit của họ (verified Playwright: canonical=https://forbible.org/leaderboard,
    render sạch, 8 console-error chỉ là 502 API do smoke không có backend — prod API=200 OK).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- CRW-3 VN-first default — vì sao Google crawl ra tiếng Anh
  - Status: [x] DONE + deployed `4ce79477` · Files: `i18n/index.ts` (`detectInitial()` → return 'vi',
    bỏ navigator.language fallback; `detection.order` → `['localStorage']` bỏ 'navigator')
  - **Root cause**: Googlebot crawl với `navigator.language='en'`. Detection cũ (`order:['localStorage','navigator']`)
    → no-localStorage crawler match navigator → render English UI dù keyword target là tiếng Việt → GG index EN.
  - **Fix**: VN-first. Chỉ user pick rõ ràng (localStorage 'quizLanguage') mới override sang 'en'. Crawler + visitor
    chưa chọn ngôn ngữ → luôn 'vi'. Toggle "VI EN" vẫn cho EN user switch (persist localStorage).
  - **Verified**: container = đúng image prod (digest 517ea531). Playwright navigator='en-US' + no-localStorage (= Googlebot):
    htmlLang='vi', h1='Trắc nghiệm Kinh Thánh thú vị mỗi ngày', body toàn tiếng Việt. Prod: `<html lang="vi">`, served HTML VN.
    "English" lúc test trước chỉ là stale `localStorage 'quizLanguage'='en'` sót trong Playwright profile — đã clear, fresh = VN.
  - Test: full suite 1343 pass (≥ baseline). **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - **Follow-up (user action)**: request GSC re-crawl `/` để update cache cũ (GG đang giữ Onboarding content pre-fix).

### Note
- Pre-existing TS warning Leaderboard.tsx: `keepPreviousData: true` (TanStack v5 bỏ — phải `placeholderData: keepPreviousData`).
  Code của process song song, không break build (esbuild không type-check). Để họ fix.
- noindex là client-side → Googlebot (JS-render) thấy; non-JS crawler thấy shell (Google tự soft-404-detect anyway).
