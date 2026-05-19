# 2026-05-19 — Home mobile: variety + group cards 1-col → 2-col

> **Source**: User feedback — "các card này hiện responsive mobile là 1 hàng 1 card tôi nghĩ 1 hàng 2 card đẹp hơn"
> **Scope**: 2 grid trong `apps/web/src/pages/Home.tsx`. Mobile chỉ. sm+ giữ 3-col.

## Tasks

- HM-1 `home-variety-grid` (`grid-cols-1` → `grid-cols-2`)
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Home.tsx:333`

- HM-2 `home-group-grid` (`grid-cols-1` → `grid-cols-2`)
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Home.tsx:361`
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]

## Checklist

- [x] HM-1 + HM-2 impl
- [x] Home + GameModeGrid: 55/55 pass
- [x] Tầng 3 full regression: 1254 pass (baseline 1212), 56 pre-existing fail unrelated
- [ ] Commit `fix(home): 2-col grid on mobile for variety + group cards [no-spec-impact]`
