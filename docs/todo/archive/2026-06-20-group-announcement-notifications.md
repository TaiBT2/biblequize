# 2026-06-20 — Group Announcement notifications (nối noti cho "Thông báo")

> **Source**: User hỏi mục đích tab "Thông báo" 2026-06-20 → phát hiện đăng thông báo **KHÔNG gửi noti** (`ChurchGroupService.createAnnouncement` chỉ lưu DB, không gọi `NotificationService`); UI hứa "🔔 Bạn sẽ nhận thông báo khi có bài mới" nhưng chưa nối dây. · **Scope**: BE `ChurchGroupService` + `NotificationService`, FE `NotificationPanel`, SPEC_GROUP §12. · **Spec strategy**: (b) BL-24 — increment đầu của Q-K (11 push events, đang defer).

**Concept:** Leader/Mod đăng thông báo → tạo **in-app notification** cho mọi thành viên (trừ tác giả), tái dùng `NotificationService.createNotification(user, type, title, body, metadata)` đúng pattern `scheduled_quiz_ended` đã chạy ([ScheduledQuizScheduler.java:111](apps/api/src/main/java/com/biblequiz/modules/group/service/ScheduledQuizScheduler.java#L111)). In-app v1; push/FCM defer (Q-K full).

### Decisions (default — chốt trước khi code)
- **D1** Kênh = **in-app only** (reuse NotificationService, như scheduled-quiz). Push/FCM → defer Q-K.
- **D2** Nhận = **mọi member trừ tác giả**.
- **D3** Phạm vi = **chỉ event "đăng thông báo"** (1 increment của Q-K) — không ôm 10 event còn lại.

### Tasks
- GAN-1 BE: notify members khi `createAnnouncement`
  - Status: [x] DONE (clean build + 2 Mockito test pass) · Files: `modules/group/service/ChurchGroupService.java` (+`NotificationService` + loop members), test `ChurchGroupServiceTest` · Test: Mockito service test
  - Inject `NotificationService`; sau khi save announcement → `groupMemberRepository.findByGroupId` → mỗi member ≠ author: `createNotification(u, "group_announcement", "Thông báo mới · {groupName}", content≤140, {groupId, announcementId})`. try/catch best-effort (noti fail KHÔNG break tạo thông báo).
  - **Spec impact**: [x] SPEC_GROUP §12 (author ở GAN-3) · **Spec strategy**: [x] (b) BL-24
  - Checklist: impl ✅ · Tầng 1 ✅ (notify N-1 member; announcement vẫn tạo khi noti throw) · commit
- GAN-2 FE: `NotificationPanel` render type `group_announcement`
  - Status: [x] DONE (NotificationPanel 17/17 test) · Files: `apps/web/src/components/NotificationPanel.tsx` (TYPE_STYLE +`group_announcement` 📢) + test · Test: component test
  - Panel đã render generic mọi type (fallback 🔔) → chỉ thêm icon 📢 vào TYPE_STYLE. **Deep-link defer**: `PanelNotification` chưa có `metadata` → click-to-group cần plumb metadata qua data flow (follow-up).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl ✅ · Tầng 1 ✅ · `validate:i18n` no new debt · commit
- GAN-3 Spec + regression
  - Status: [x] DONE · Files: `docs/spec/SPEC_GROUP_v1.3.md` §12 (noti khi đăng = BL-24; endpoint `{content}`; banner/pin marked chưa ship), `docs/spec/BACKLOG.md` (BL-24 → DONE) · Test: `bash tools/spec-audit/audit.sh`
  - **Spec impact**: [x] SPEC_GROUP §12 · **Spec strategy**: [x] (a) update inline
  - Checklist: spec ✅ · BL-24 DONE ✅ · audit.sh · Tầng 3 (BE+FE) · commit

### Definition of Done
- Đăng thông báo → mọi member (trừ tác giả) thấy noti in-app trong bell/panel.
- Noti fail KHÔNG break tạo thông báo (try/catch isolated).
- Tầng 3 pass · SPEC_GROUP §12 updated · BL-24 DONE + commit hash.

### Notes
- Notification text server-generated hardcoded VN (đúng pattern `scheduled_quiz_ended`/`scheduled_quiz_24h` hiện có) → KHÔNG cần i18n key cho noti body.
- Defer (Q-K còn lại): member join · live room mở · quiz đặt lịch tạo · welcome flow… + push/FCM transport.
