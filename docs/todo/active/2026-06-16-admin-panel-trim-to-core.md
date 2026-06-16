# 2026-06-16 — Admin panel: cắt về core + hoàn thiện (ADM)

> **Source**: User muốn ít chức năng nhưng hoàn thiện, bỏ các trang nửa vời. · **Scope**: apps/web admin pages + apps/api admin controllers.
> **Đánh giá nền**: xem [apps/api/DOMAIN.md §8](../../../apps/api/DOMAIN.md) (admin surface + F-api-16..22).

## Bối cảnh — phân loại 14 nav item hiện tại

| Tier | Trang (nav path) | BE | Quyết định |
|---|---|---|---|
| **A core** | Dashboard `/admin` · Users `/admin/users` · Questions `/admin/questions` · Review Queue `/admin/review-queue` | đủ | GIỮ + hoàn thiện |
| **B giữ** | AI Generator `/admin/ai-generator` · Feedback `/admin/feedback` · Groups `/admin/groups` | đủ | GIỮ nguyên |
| **C ẩn** | Seasons&Rankings `/admin/rankings` · Events `/admin/events` · Notifications `/admin/notifications` · Configuration `/admin/config` · Export `/admin/export` · Question Quality `/admin/question-quality` · Early Unlock `/admin/metrics/early-unlock` | placeholder / niche / auto-seeded | ẨN khỏi nav |

Lý do "C ẩn": `Configuration`+`ExportCenter` = placeholder 0 API; `QuestionQuality` chỉ coverage chạy, phần problems/unused trỏ endpoint chưa tồn tại; `Seasons` đã auto-seed bằng `SeasonSeeder` (4 mùa/năm), CRUD tay phần lớn thừa; `Events` chỉ là viewer `/api/tournaments`; `EarlyUnlock` analytics niche.

### Tasks

- **ADM-1 Trim AdminLayout nav xuống 7 mục (Core + B)** ✅
  - Status: [x] DONE (2026-06-16) · Files: `apps/web/src/layouts/AdminLayout.tsx` (`NAV_ITEMS`) · Test: `AdminLayout.test.tsx`
  - Bỏ khỏi nav: rankings, events, notifications, config, export, question-quality, metrics/early-unlock. **Giữ route + PAGE_TITLES** để bookmark cũ không 404 — chỉ ẩn khỏi sidebar. Route+page cleanup ở ADM-5.
  - **Spec impact**: [x] None (UI nav only, routes intact)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: [x] impl · [x] Tầng 1 (AdminLayout 7/7) · [x] Tầng 3 FE · [ ] commit

- **ADM-2 Dashboard: bỏ panel placeholder, giữ số liệu thật** ✅
  - Status: [x] DONE (2026-06-16) · Files: `Dashboard.tsx` (bỏ 4 panel), `dashboard/QuestionQueue.tsx` (rút còn pendingReview), **xoá** `ActionItems/ActivityLog/SessionsChart/UserRegChart.tsx`, `AdminDashboardController.java` (bỏ actionItems/recentActivity/queue placeholder), `Dashboard.test.tsx`
  - Phát hiện: Sessions/UserReg charts render đường cong/cột **hardcoded**, total luôn `—` (BE không trả `charts`); ActivityLog luôn rỗng; ActionItems chỉ pendingReview thật (trùng KPI). Giữ: KpiCards (5 count thật) + CoverageChart + QuestionQueue(pendingReview + CTA).
  - **Spec impact**: [x] SPEC_ADMIN §3 (updated inline) + gap table §20 (RESOLVED)
  - **Spec strategy**: [x] (a) update SPEC_ADMIN §3 inline + DECISIONS 2026-06-16 (đảo hướng AD-1..6)
  - Checklist: [x] impl · [x] Tầng 1 (Dashboard 7/7) · [x] Tầng 3 FE (129 files/1285 tests pass) · [x] BE compile (JDK17) — no BE test refs các field bỏ · [x] spec+DECISIONS · [ ] commit

- **ADM-3 Review Queue: hạ 2-approval → 1-approval (gỡ blocker team nhỏ)** ✅
  - Status: [x] DONE (2026-06-16) · Files: `QuestionReviewController.java` (`APPROVALS_REQUIRED=1`), `ReviewQueue.tsx` (fallback `?? 1`), `QuestionReviewControllerTest.java` (3 case) · FE label "x/N" tự cập nhật vì đọc `approvalsRequired` từ BE
  - ⚠️ Trước cần 2 admin KHÁC NHAU → team 1 admin kẹt PENDING vĩnh viễn. Giờ phê duyệt đầu tiên active luôn.
  - **Spec impact**: [x] SPEC_ADMIN §8 (updated inline)
  - **Spec strategy**: [x] (a) update SPEC_ADMIN §8 + DECISIONS 2026-06-16
  - Checklist: [x] impl · [x] Tầng 1 (BE 9/9 · FE ReviewQueue 6/6) · [x] Tầng 3 FE · [x] spec+DECISIONS · [ ] commit

- **ADM-4 Hoàn thiện Ban: enforce ở REST (F-api-17)**
  - Status: [ ] TODO · Files: `apps/api/.../CustomUserDetailsService.java` (set `disabled`/`accountNonLocked` theo `User.isBanned`) hoặc filter; verify `JwtAuthenticationFilter` · Test: BE security test (banned user → 401/403 REST)
  - Hiện ban chỉ chặn WebSocket (`WebSocketRateLimitInterceptor`); JWT user bị ban vẫn gọi REST. **File nhạy cảm** (security) → chạy Tầng 3 ngay.
  - **Spec impact**: [ ] SPEC_ADMIN §moderation (ban scope)
  - **Spec strategy**: [ ] (a) update inline / [ ] (b) BL-N
  - Checklist: impl · Tầng 1+2+3 (FULL — file nhạy cảm) · spec · commit

- **ADM-5 Dọn route + xoá trang placeholder Tier C**
  - Status: [ ] TODO · Files: router (`App.tsx`/routes) bỏ route Tier C; xoá `Configuration.tsx` + `ExportCenter.tsx` (placeholder thuần); `QuestionQuality.tsx` → giữ coverage, gộp vào Questions hoặc xoá phần "needs API"; xoá test tương ứng
  - Làm SAU ADM-1 khi đã chắc không ai dùng. Kiểm grep import trước khi xoá.
  - **Spec impact**: [x] None (xoá dead UI)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2 · Tầng 3 · commit

### Out of scope (defer — ghi nhận, chưa làm)
- F-api-16/18 wire `AuditService` vào mọi mutation admin (audit trail đầy đủ) — chỉ cần nếu có yêu cầu compliance. Tới lúc đó mới un-hide trang Audit.
- AI Generator: lưu thẳng câu AI vào DB (hiện chỉ trả về cho review).
- F-api-20 `changeRole` validate enum · F-api-21 AI quota fail-open · F-api-22 audit filter dead code.
