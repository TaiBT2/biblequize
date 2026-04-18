# Test Coverage Review — BibleQuize

## Tổng quan

| Layer | Có test | Thiếu test | Coverage |
|-------|---------|------------|----------|
| Web Pages (27) | 15 | **12** | 56% |
| Web Components (23) | 7 | **16** | 30% |
| Web Hooks (4) | 0 | **4** | 0% |
| Web Contexts (3) | 0 | **3** | 0% |
| Web Utils (3) | 1 | **2** | 33% |
| Web Stores (2) | 1 | **1** | 50% |
| Admin Sub-components (8) | 0 | **8** | 0% |
| Room Sub-components (1) | 0 | **1** | 0% |
| E2E Specs (13) | 13 | ~12 flows thiếu | ~40% |
| Mobile Logic (3) | 3 | 0 | 100% |
| API Controllers (24) | 24 | 0 | 100% |
| API Services (26+) | 26+ | 0 | 100% |

**Tổng source files thiếu test: 47 files**

---

## CHI TIẾT: Source files THIẾU test

### A. Pages thiếu test (12 files) — Ưu tiên CAO

| # | File | Lý do cần test |
|---|------|----------------|
| 1 | `pages/AuthCallback.tsx` | OAuth flow — lỗi ở đây = user không login được |
| 2 | `pages/Onboarding.tsx` | First-time user experience — impression đầu tiên |
| 3 | `pages/OnboardingTryQuiz.tsx` | Onboarding quiz demo |
| 4 | `pages/WeeklyQuiz.tsx` | Game mode chính |
| 5 | `pages/MysteryMode.tsx` | Game mode chính |
| 6 | `pages/SpeedRound.tsx` | Game mode chính |
| 7 | `pages/Cosmetics.tsx` | In-app customization |
| 8 | `pages/PrivacyPolicy.tsx` | Legal page (ít quan trọng nhưng dễ test) |
| 9 | `pages/TermsOfService.tsx` | Legal page |
| 10 | `pages/admin/Questions.tsx` | Admin CRUD chính |
| 11 | `pages/admin/AIQuestionGenerator.tsx` | AI feature phức tạp |
| 12 | `pages/admin/TestPanel.tsx` | Dev tool (ít quan trọng) |

### B. Components thiếu test (16 files) — Ưu tiên CAO

| # | File | Lý do cần test |
|---|------|----------------|
| 1 | `components/ErrorBoundary.tsx` | **Critical** — crash handler, nếu lỗi = blank screen |
| 2 | `components/Header.tsx` | **Critical** — hiển thị trên mọi page, notifications, navigation |
| 3 | `components/LiveFeed.tsx` | Real-time display, complex state |
| 4 | `components/ReactionBar.tsx` | User interaction, cooldown logic |
| 5 | `components/BookCompletionModal.tsx` | Modal logic + API call |
| 6 | `components/TierUpModal.tsx` | Animation + state transition |
| 7 | `components/DailyBonusModal.tsx` | Modal + reward logic |
| 8 | `components/ComebackModal.tsx` | Conditional display logic |
| 9 | `components/TutorialOverlay.tsx` | Overlay + step logic |
| 10 | `components/QuizLanguageSelect.tsx` | i18n switching |
| 11 | `components/EmptyState.tsx` | Simple but used everywhere |
| 12 | `components/Skeleton.tsx` | Loading state placeholder |
| 13 | `components/PageMeta.tsx` | SEO meta tags |
| 14 | `components/OfflineBanner.tsx` | Network status display |
| 15 | `components/MilestoneBanner.tsx` | Achievement notification |
| 16 | `components/StarPopup.tsx` | Visual reward feedback |

### C. Hooks thiếu test (4 files) — Ưu tiên RẤT CAO

| # | File | Lý do cần test |
|---|------|----------------|
| 1 | `hooks/useWebSocket.ts` | **Critical** — multiplayer real-time, reconnection logic, message routing |
| 2 | `hooks/useStomp.ts` | **Critical** — STOMP protocol, JWT auth, room subscriptions |
| 3 | `hooks/useRankedDataSync.ts` | **Critical** — data sync giữa local và server, conflict resolution |
| 4 | `hooks/useOnlineStatus.ts` | Network detection, offline banner trigger |

### D. Contexts thiếu test (3 files) — Ưu tiên CAO

| # | File | Lý do cần test |
|---|------|----------------|
| 1 | `contexts/RequireAuth.tsx` | **Critical** — auth guard cho mọi protected route |
| 2 | `contexts/RequireAdmin.tsx` | **Critical** — admin access control |
| 3 | `contexts/ErrorContext.tsx` | Global error handling, toast display |

### E. Utils + Stores thiếu test (3 files)

| # | File | Lý do cần test |
|---|------|----------------|
| 1 | `utils/localStorageClearDetector.ts` | Complex monkeypatch logic (sẽ bị rewrite theo code review) |
| 2 | `utils/quizLanguage.ts` | Language persistence |
| 3 | `store/onboardingStore.ts` | Onboarding state |

### F. Admin sub-components thiếu test (9 files)

| # | File | Lý do cần test |
|---|------|----------------|
| 1 | `admin/dashboard/KpiCards.tsx` | Data display + API |
| 2 | `admin/dashboard/CoverageChart.tsx` | Chart rendering (66 books) |
| 3 | `admin/dashboard/QuestionQueue.tsx` | Queue + links |
| 4 | `admin/dashboard/ActionItems.tsx` | Actionable items |
| 5 | `admin/dashboard/ActivityLog.tsx` | Log display |
| 6 | `admin/dashboard/SessionsChart.tsx` | Chart (mock data) |
| 7 | `admin/dashboard/UserRegChart.tsx` | Chart (mock data) |
| 8 | `admin/ai-generator/DraftCard.tsx` | Edit mode, validation |
| 9 | `pages/room/RoomOverlays.tsx` | Podium, team scores |

---

## E2E FLOWS THIẾU (Playwright)

### Hoàn toàn thiếu:
1. **Onboarding flow** — first-time user → onboarding → try quiz → home
2. **Profile editing** — update name/avatar/settings
3. **Tournament full flow** — create → join → bracket → match → results
4. **Group analytics** — view charts, export data
5. **Game modes UI** — WeeklyQuiz, MysteryMode, SpeedRound (chỉ test API, không test UI)
6. **Cosmetics** — browse → preview → equip
7. **Admin CRUD** — question review/approve, user management, events, notifications, export

### Thiếu một phần:
8. **Multiplayer UI** — có test API nhưng thiếu UI flow (create room → lobby → start → play → results)
9. **Daily Challenge UI** — có test API nhưng thiếu completion UI flow
10. **Ranked full UI** — có test API nhưng thiếu match → answer → results UI
11. **Error recovery** — network failure → retry → success
12. **Mobile responsive** — không có viewport test cho mobile breakpoints

---

## ĐÁNH GIÁ THEO TIÊU CHUẨN CLAUDE.md

CLAUDE.md yêu cầu:
- Mỗi screen/component PHẢI có unit test → **VI PHẠM: 47 files thiếu**
- Minimum 8 test cases per screen → **Cần audit các test hiện tại**
- Mỗi user flow PHẢI có e2e test → **VI PHẠM: ~12 flows thiếu**
- Minimum 5 e2e cases per screen → **Cần audit**

---

## KHUYẾN NGHỊ THỨ TỰ FIX

### Phase 1 — Critical (phải có trước khi ship)
1. `hooks/useWebSocket.ts` test
2. `hooks/useStomp.ts` test
3. `hooks/useRankedDataSync.ts` test
4. `contexts/RequireAuth.tsx` test
5. `contexts/RequireAdmin.tsx` test
6. `components/ErrorBoundary.tsx` test
7. `pages/AuthCallback.tsx` test

### Phase 2 — High (cần cho stability)
8. `components/Header.tsx` test
9. `contexts/ErrorContext.tsx` test
10. `pages/Onboarding.tsx` + `OnboardingTryQuiz.tsx` tests
11. `pages/WeeklyQuiz.tsx` test
12. `pages/MysteryMode.tsx` test
13. `pages/SpeedRound.tsx` test
14. `components/LiveFeed.tsx` test
15. `components/ReactionBar.tsx` test
16. E2E: Onboarding flow
17. E2E: Tournament full flow
18. E2E: Multiplayer UI flow

### Phase 3 — Medium (cần cho completeness)
19. Tất cả Modal components (5 files)
20. `pages/Cosmetics.tsx` test
21. `pages/admin/Questions.tsx` test
22. `pages/admin/AIQuestionGenerator.tsx` test
23. Admin dashboard sub-components (7 files)
24. E2E: Admin CRUD workflows
25. E2E: Game modes UI

### Phase 4 — Low (nice to have)
26. `components/EmptyState.tsx`, `Skeleton.tsx`, `PageMeta.tsx` tests
27. `pages/PrivacyPolicy.tsx`, `TermsOfService.tsx` tests
28. `store/onboardingStore.ts` test
29. `utils/quizLanguage.ts` test
30. E2E: Mobile responsive viewport tests
