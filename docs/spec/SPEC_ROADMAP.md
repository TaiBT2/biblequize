# SPEC_ROADMAP — Future Features & Version Timeline

**Last updated:** 2026-05-09
**Purpose:** Mọi tính năng được defer khỏi current specs (`SPEC_USER_v3.1.md`, `SPEC_ADMIN_v3.1.md`, `SPEC_GROUP_v1.2.md`, `SPEC_MULTIPLAYER.md`) sống ở đây.

> **Quy tắc:** Tính năng trong file này KHÔNG được document như "shipped" trong current specs. Khi 1 feature ship → move section sang spec tương ứng + xoá khỏi đây.

---

## 1. Version Timeline

| Version | Target | Theme |
|---|---|---|
| **v1.2** (current) | 2026-05 | Spec rewrite + canonical lock |
| v1.5 | 2026-Q3 | Group power-features (multi-leader, TV Host) |
| v2.0 | 2026-Q4 | Lifeline expansion + Liturgical seasons completion |
| v2.5 | 2027-Q1 | Friend System |
| v3.0 | 2027-Q2 | Premium tier + Offline mode |

---

## 2. Deferred Features

### 2.1 Multi-leader system (v1.5)
- **Status:** Deferred — locked in SPEC_GROUP v1.1 §6 + Phụ lục B.
- **Mô tả:** Cho phép ChurchGroup có tối đa 5 leaders đồng thời (creator + 4 co-leaders).
- **Ghi chú thiết kế:**
  - `creator_id` privilege (chỉ creator có thể demote co-leaders)
  - Co-leader auto-promote nếu host disconnect
  - Permission matrix: tất cả leaders ngang quyền trừ "transfer ownership" (creator-only)
- **Vì sao defer:** v1 đã ship 1 LEADER + N MOD đủ cho beta; multi-leader thêm phức tạp permission edge cases.
- **Replaces:** N/A (mới)

### 2.2 TV Host Mode / Kahoot 2-screen (v1.5)
- **Mô tả:** Host stream câu hỏi lên TV/projector (host screen), người chơi join + trả lời trên điện thoại (player screen).
- **Yêu cầu kỹ thuật:**
  - Host screen route mới `/room/:roomId/host` (full-screen UI, large fonts, hide controls)
  - Sync room state qua WebSocket
  - QR code prominent để join nhanh
- **Vì sao defer:** Cần thiết kế UI đặc biệt + test trên màn hình lớn; ưu tiên thấp hơn 5 modes hiện có.

### 2.3 Pentecost (Ngũ Tuần) + Thanksgiving (Cảm Tạ) seasons (v2.0)
- **Status:** Spec canonical đã ghi 4 mùa (xem `SPEC_USER_v3.1.md §5.6`); code mới ship 2/4 (Christmas + Easter).
- **Cần:**
  - Thêm date detection trong `VarietyQuizController` (Ngũ Tuần T5-7, Cảm Tạ T8-10)
  - Mỗi mùa có set books filter relevant + description
  - Wire ×1.5 multiplier trong `ScoringService` (xem BACKLOG.md item BL-5)
- **Cross-ref:** [BACKLOG.md](BACKLOG.md) — BL-5

### 2.4 Lifeline ASK_OPINION (v2.0)
- **Status:** `LifelineType` enum đã có value `ASK_OPINION` (V28); chưa wire endpoint hay UI.
- **Mô tả:** Cho phép gửi câu hỏi tới 1 friend hoặc community → vote → hiển thị % chọn mỗi option.
- **Phụ thuộc:** Friend System (v2.5) hoặc community-pool fallback.
- **Vì sao defer:** v1 chỉ ship HINT (eliminate 1 wrong) — đủ cho mục tiêu giữ retention.

### 2.5 Friend System (v2.5)
- **Mô tả:**
  - Friend request / accept / decline
  - Friend list trên Profile
  - Friend leaderboard (separate tab cạnh global)
  - Challenge friend → tạo private duel room
- **Implementation note:**
  - Cần `friendships` table (user_a_id, user_b_id, status: PENDING/ACCEPTED/BLOCKED, created_at)
  - Notification types mới: FRIEND_REQUEST, FRIEND_ACCEPTED, FRIEND_CHALLENGE
- **Đã có một phần:** Challenge entity (peer challenges) ship rồi (V21) — sẽ được tái sử dụng.

### 2.6 Premium tier / Subscription (v3.0)
- **Mô tả:** Subscription tier với perks:
  - Unlock cosmetic frames cao cấp
  - Bypass energy cap
  - Priority support
  - Offline mode access
- **Pricing strategy:** TBD (likely 1 tier ~$4.99/month).
- **Tech requirements:** Stripe/PayPal integration, subscription lifecycle management, webhook handling.

### 2.7 Offline mode — full PWA (v3.0)
- **Status hiện tại (2026-07-11):** PWA installable ĐÃ SHIP — `vite-plugin-pwa` (generateSW) precache app-shell (JS/CSS/HTML/icon) + `public/manifest.json` (`display: standalone`) → user cài được lên màn hình chính, app-shell mở khi offline. Bản Capacitor không bật SW (guard `mode !== 'capacitor'`). `OfflineBanner.tsx` + `useOnlineStatus.ts` vẫn detect `navigator.onLine`.
- **CÒN LẠI cho v3.0 (data-layer offline, CHƯA ship):**
  - Pre-cache 50 questions/book khi user mở app online
  - Practice mode hoạt động offline (đọc cache local)
  - Queue answers + sync khi online lại
  - Conflict resolution cho streak/XP edge cases
- **Phụ thuộc:** Premium tier (Q3.0).

### 2.8 Seasonal UI theming (v3.0)
- **Mô tả:** Theme + decorations đổi theo mùa Liturgical (snow effect cho Giáng Sinh, hoa cho Phục Sinh, v.v).
- **Vì sao defer:** Cosmetic-only, ROI thấp; ship sau khi Premium thêm doanh thu.

### 2.9 Sentry monitoring (PARTIALLY SHIPPED — mobile only)
- **Status:**
  - ✅ Mobile (`apps/mobile`): shipped 2026-05-19 S2-3 — `@sentry/react-native@^8.11.1` + `apps/mobile/src/lib/sentry.ts` init wrapper + `App.tsx` Sentry.wrap + `ErrorBoundary.componentDidCatch` captureException. DSN driven bằng `EXPO_PUBLIC_SENTRY_DSN`; no-op khi missing. Env tag từ `EXPO_PUBLIC_ENV` (eas.json profile).
  - ⬜ Web (`apps/web`): chưa ship. Vẫn defer pending tách scope (web traffic lớn hơn mobile beta).
  - ⬜ Backend (`apps/api`): chưa ship `sentry-spring-boot-starter`. Vẫn defer.
- **Quyết định:** Mobile un-defer cho beta crash monitoring. Web + BE giữ defer tới khi cần.
- **Alternative considered (BE/web):** Stick with current logging + audit_events (V4).

---

## 3. Decisions log (deferred-related)

| Date | Decision | Reference |
|---|---|---|
| 2026-04-19 | Bible canon = Protestant only (66 books) — không thêm Deuterocanonical | DECISIONS.md |
| 2026-04-19 | Tier naming = religious (CŨ) — không dùng Light-themed | DECISIONS.md |
| 2026-05-09 | Q4 mode wording: "Luyện Tập" + "Đấu Hạng" (Vietnamese-only) | AUDIT_SUMMARY.md |
| 2026-05-09 | Sentry → defer (chưa ship; remove khỏi current spec) | AUDIT_SUMMARY.md |
| 2026-05-19 | Sentry mobile un-defer (S2-3 beta crash monitoring); web + BE giữ defer | Roadmap S2 mobile rewrite |
| 2026-05-09 | Q-A group leaderboard = group-play-only | AUDIT_SUMMARY.md |

---

## 4. Cross-references
- Current shipped spec: [SPEC_USER_v3.1.md](SPEC_USER_v3.1.md), [SPEC_MULTIPLAYER.md](SPEC_MULTIPLAYER.md), [SPEC_ADMIN_v3.1.md](SPEC_ADMIN_v3.1.md), [SPEC_GROUP_v1.2.md](SPEC_GROUP_v1.2.md)
- Code-gap items (vs canonical spec): [BACKLOG.md](BACKLOG.md)
- Audit findings: [AUDIT_SUMMARY.md](../audit/AUDIT_SUMMARY.md)
