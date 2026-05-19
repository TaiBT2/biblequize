# 2026-05-18 — Fix: FeaturedDailyCard CTA + countdown label wrap xấu ở mobile 360px

> **Source**: User bug report 2026-05-18 (screenshot Samsung Galaxy S8+ 360×740 — button "Vào chơi ngay" wrap 2 dòng, label "Còn lại trong ngày" cũng wrap)
> **Scope**: `apps/web/src/components/FeaturedDailyCard.tsx` — fix responsive layout column phải (countdown + CTA) khi width hẹp

## Root cause

Component dùng grid `grid-cols-1 md:grid-cols-[1fr_auto]`: ở mobile chỉ có 1 column dồn dọc, **nhưng bên trong cột phải lại flex-row** (`flex md:flex-col`) chứa cả label countdown + timer + button. Ở 360px, 3 phần tử này cùng tranh space:

1. Label "Còn lại trong ngày" (uppercase tracking-[0.14em]) wrap "CÒN LẠI TRONG" / "NGÀY"
2. Button "Vào chơi ngay" + icon arrow không có `whitespace-nowrap` → wrap "Vào chơi" / "ngay"
3. `justify-between` đẩy 2 element xa nhau → button bị bóp.

Fix: thêm `whitespace-nowrap` cho cả button text + countdown label; thêm `flex-shrink-0` cho button để giữ kích thước; có thể giảm tracking label trên mobile.

### Tasks

- DAILY-CARD-RESP-1 Sửa wrap text ở mobile 360px
  - Status: [x] DONE
  - Files: `apps/web/src/components/FeaturedDailyCard.tsx`
  - Test: Tầng 1 FeaturedDailyCard 7/7 pass (re-verified 2026-05-19); Tầng 3 FE 1167 pass / 125 fail (khớp baseline clean state, 0 regression); tsc no new errors trên file.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact] (responsive CSS fix, không đổi behavior/copy)
  - Checklist: ✅ impl · ✅ Tầng 3 no regression · ✅ user-reported regression 2026-05-19 S21 Ultra confirm fix chưa deploy (bug ở production = chưa commit, không phải fix sai) · ✅ commit
