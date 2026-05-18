# 2026-05-18 — Profile Sprint 1 quick wins

> **Source**: Profile page audit 2026-05-18 (full audit findings, see chat log).
> **Scope**: `apps/web/src/pages/Profile.tsx` + i18n keys — P0 dead buttons + P1/P3 polish.

### Tasks

- PRO-FIX-1 Wire dead buttons/links (P0 audit #1/#2/#3)
  - **Edit Profile** button: disable + tooltip "Coming soon" (no edit page exists yet — defer real impl to Phase 2 BL)
  - **Share** button: `onClick` → `navigator.share()` với fallback `navigator.clipboard.writeText(window.location.href)`
  - **Badge "View All"** link: thay `href="#"` bằng `<Link to="/achievements">`
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Profile.tsx`, `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`

- PRO-FIX-2 Heatmap empty state — gộp 2 message redundant (P1 audit #5)
  - Bỏ `<p>startPlaying</p>` ở line 572, chỉ giữ CTA card dưới khi `!hasData`
  - Status: [x] DONE

- PRO-FIX-3 Prestige labels dynamic (P1 audit #8)
  - Thay hardcoded "🌱 1 → 👑 6" bằng `P{prestigeLevel} → P{prestigeLevel+1}` hoặc dùng `nextPrestigeName` từ API
  - Status: [x] DONE

- PRO-FIX-4 `tierCurrentSub` brittle split (P3 audit #16)
  - Thêm i18n key `profile.tierBadgeName` riêng (chỉ tier name, không dấu `·`)
  - Bỏ `.split('·')[0].trim()` ở line 264
  - Status: [x] DONE

### Common

- **Spec impact**: [x] None (visual + UX polish, không đổi behavior data)
- **Spec strategy**: [x] (c) [no-spec-impact]
- **Test**: Tầng 3 FE regression — pass count không giảm
- **Commit**: gộp 1 commit "fix: Profile Sprint 1 quick wins (dead buttons + UX polish) [no-spec-impact]"
