# 2026-05-19 — Add: Daily Challenge explanation panel — click outside to close

> **Source**: User follow-up 2026-05-19 — sau khi tắt explanation auto-show (commit 560cc2b), user yêu cầu 2 cách close panel: (1) nút × hiện tại + (2) click outside panel
> **Scope**: `apps/web/src/pages/DailyChallenge.tsx` — port click-outside listener pattern từ [Quiz.tsx:234-250](../../../apps/web/src/pages/Quiz.tsx)

## Plan

Add useRef cho panel container + useEffect listening mousedown/touchstart outside panel → setExplanationCollapsed(true). Listener chỉ attach khi `answered && !explanationCollapsed` để không leak.

### Tasks

- DAILY-EXP-CLICKOUT-1 Add click-outside listener cho explanation panel
  - Status: [x] DONE
  - Files: `apps/web/src/pages/DailyChallenge.tsx`
  - Test: Tầng 1 DailyChallenge 6/7 pass (cùng baseline pre-existing fail, không phải do fix này)
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact] (UX polish)
  - Checklist: ✅ impl · ✅ test (no new fail) · ✅ commit
