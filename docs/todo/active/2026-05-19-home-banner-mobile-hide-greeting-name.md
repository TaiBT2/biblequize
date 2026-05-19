# 2026-05-19 — HomeBanner mobile: ẩn greeting + name (chỉ desktop)

> **Source**: User feedback — "responsive lại để mobile là không cần 'Chào Buổi chiều TAI.BT'"
> **Scope**: `apps/web/src/components/HomeBanner.tsx`. Ẩn 2 dòng "CHÀO BUỔI CHIỀU" và tên user trên mobile để card gọn lại; desktop giữ nguyên.

## Approach

Thêm `hidden md:block` vào `home-greeting-meta` + `home-greeting-name`. Element vẫn render trong DOM (test `findByTestId` + `toHaveTextContent` vẫn pass) — chỉ ẩn visual ở < md breakpoint.

### Tasks

- HB-1 Hide greeting + name divs on mobile
  - Status: [x] DONE
  - Files: `apps/web/src/components/HomeBanner.tsx`
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact] — pure UI density polish

## Checklist

- [x] HB-1 impl (`hidden md:block` thêm vào `home-greeting-meta` + `home-greeting-name`)
- [x] Tầng 1 + Tầng 2 (HomeBanner 6/6 + Home 26/26 = 32/32) pass
- [x] Tầng 3 full regression: 1254 pass (baseline 1212), 56 pre-existing fail (Ranked + ReviewQueue unrelated)
- [ ] Commit `fix(home-banner): hide greeting + name on mobile [no-spec-impact]`
