# W-M12 — Notifications (L2 Happy Path)

**Routes:** AppLayout notification bell
**Spec ref:** SPEC_USER §12
**Module priority:** Tier 4 (panel NOT IMPL — limited L2 coverage)

---

## ⚠️ Implementation Status

Per Phase 2 L1 findings:
- Notification bell icon visible trong AppLayout header
- Badge count display NOT IMPL
- Notification panel (dropdown/drawer) NOT IMPL

**L2 coverage limited đến**: icon visibility + NotificationController API contract test.

---

## W-M12-L2-001 — Notification bell visible trên mọi authenticated page

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @notifications @parallel-safe

**Actions**:
1. Navigate qua multiple pages (/, /practice, /ranked, /profile)

**Assertions**:
- `expect(page.getByTestId('nav-notification-bell')).toBeVisible()` trên mỗi page

---

## W-M12-L2-002 — GET /api/notifications → returns user notifications array

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @notifications @parallel-safe

**Actions**:
1. `GET /api/notifications`

**API Verification**:
- Response 200 với array
- Each item: `{ id, type, title, body, read, createdAt }`
- Sorted by createdAt desc

**Notes**:
- [NEEDS CODE CHECK]: confirm endpoint path from NotificationController

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 4s |
| **Total** | **~8s** |

---

## Summary
- **2 cases** (matches 2 estimate)
- Module gần hoàn toàn NOT IMPLEMENTED
- **Runtime**: ~8s
- Full L2 coverage depends on panel implementation
