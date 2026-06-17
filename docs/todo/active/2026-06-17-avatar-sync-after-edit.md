# 2026-06-17 — Fix avatar không đồng bộ sau khi sửa hồ sơ

> **Source**: User report — sửa avatar ở tab cá nhân (EditProfileModal) không đồng bộ ở header dropdown + sidebar cho tới khi reload.
> **Scope**: apps/web — authStore + EditProfileModal. (Phần upload ảnh riêng → defer, user chọn lưu MySQL BLOB, để sau.)

### Root cause
`EditProfileModal` PATCH `/api/me` chỉ `invalidateQueries(['profile'])` → trang Profile (`HeroCompact`) cập nhật. Nhưng `authStore.user.avatar` (đọc bởi `UserDropdown` + `SidebarUserCard`) không đổi → avatar cũ tới khi `checkAuth` chạy lại (reload).

### Tasks
- ASE-1 Thêm `updateProfile` vào authStore (đồng bộ in-memory `user` + localStorage)
  - Status: [x] DONE · Files: `apps/web/src/store/authStore.ts` · Test: authStore.test.ts (updateProfile cases)
  - **Spec impact**: [x] None — bug fix, không có spec quy định cơ chế cache avatar
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2+3 pass · `audit.sh` no NEW broken · commit
- ASE-2 EditProfileModal gọi `updateProfile` trong onSuccess
  - Status: [x] DONE · Files: `apps/web/src/components/profile/EditProfileModal.tsx` · Test: EditProfileModal.test.tsx
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2+3 pass · commit
