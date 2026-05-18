# 2026-05-18 — Fix: MobileTopBar broken avatar shows alt text overflow

> **Source**: User bug report 2026-05-18 (mobile screenshot — "TAI THANH" text wrap 2 dòng tràn ra ngoài viền avatar nút top-right)
> **Scope**: `apps/web/src/layouts/components/UserDropdown.tsx` — handle `<img>` onError → fallback initial circle

## Root cause

`UserDropdown.tsx` 2 chỗ render `<img src={user.avatar} alt={displayName} />` (line 124 card mode + line 149 compact mode) không có `onError` handler. Khi Google OAuth avatar URL fail load (429/403/CORS — phổ biến trên mobile), browser hiển thị alt text "TAI THANH" — không tôn trọng `w-10 h-10` của parent button → text wrap "TAI"/"THANH" tràn ra ngoài header.

Fix: track error state qua `useState`, swap về initial fallback gold circle khi img fail (giống behavior khi không có avatar).

### Tasks

- AVATAR-FIX-1 onError fallback cho `<img>` trong UserDropdown
  - Status: [x] DONE
  - Files: `apps/web/src/layouts/components/UserDropdown.tsx`
  - Test: Tầng 3 FE — 1167 pass / 125 fail (giống hệt clean state, 0 regression). AppLayout test 18/18 pass. tsc no new errors.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact] (visual bugfix, không đổi behavior)
  - Checklist: ✅ impl · ✅ Tầng 3 no regression · ⏳ commit (user-driven)
