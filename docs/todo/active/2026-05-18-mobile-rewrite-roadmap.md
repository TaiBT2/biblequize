# 2026-05-18 — Mobile rewrite roadmap (RN Expo + monorepo, MVP-first)

> **Source**: User prompt 2026-05-18 — "lên plan để viết app mobile lại để đầy đủ tính năng như bản web hiện tại"
> **Scope**: Roadmap-level only — sprint overview + gap analysis. Per-sprint detail nằm trong file riêng (`2026-05-18-mobile-rewrite-s<N>-<slug>.md`) tạo khi bắt đầu sprint đó. KHÔNG implement gì trong file này.
> **Decisions chốt với user**: (1) RN Expo + `packages/shared` monorepo, KHÔNG đổi sang RN-Web/Capacitor; (2) MVP-first → Expo Go internal beta sau S2; (3) distribution: Expo Go dev + EAS internal track lúc đầu, App Store/Play Store tới S7.

---

## Gap analysis (snapshot 2026-05-18)

**Mobile đã wire 24/32 screens** ([apps/mobile/src/screens/](../../../apps/mobile/src/screens/)). "Rewrite" thực chất = monorepo migration + complete missing + polish stub.

### Partial/stub cần fix (5)
| Screen | Status | Gap |
|---|---|---|
| [TryQuizScreen](../../../apps/mobile/src/screens/onboarding/TryQuizScreen.tsx) | 🟡 PARTIAL | 3 sample questions hardcoded |
| [RoomWaitingScreen](../../../apps/mobile/src/screens/multiplayer/RoomWaitingScreen.tsx) | 🟡 PARTIAL | "0/8 player" hardcoded, no STOMP wiring |
| [MultiplayerQuizScreen](../../../apps/mobile/src/screens/multiplayer/MultiplayerQuizScreen.tsx) | ⬜ STUB | `<Text>Tính năng sẽ được tích hợp...</Text>` |
| [MultiplayerResultsScreen](../../../apps/mobile/src/screens/multiplayer/MultiplayerResultsScreen.tsx) | 🟡 PARTIAL | Podium hardcode "Player 1/2/3" |
| [TournamentBracketScreen](../../../apps/mobile/src/screens/multiplayer/TournamentBracketScreen.tsx) | 🟡 PARTIAL | Render placeholder text |

### Missing screens vs web (~15)
**Quiz Sets:** QuizSetList · QuizSetEditor · QuizSetDetail · MySets · PersonalQuizSetEditor
**Scheduled:** ScheduledQuizCreate · ScheduledQuizDetail · ScheduledQuizPlay
**Tournament:** TournamentDetail · TournamentMatch
**Multiplayer:** RoomQuizHost (Quản trò) · RoomAnalytics
**Group:** GroupAnalytics
**Misc:** CosmeticsScreen · Help/FAQ

**Skip cho mobile (không parity):** `/admin/*` (15 screens, admin dùng web), LandingPage, NotFound, Privacy/Terms inline (đã có [LegalScreen](../../../apps/mobile/src/screens/system/LegalScreen.tsx)).

### Drift đã biết
- **BL-4** [apps/mobile/src/i18n/vi.json:63-65](../../../apps/mobile/src/i18n/vi.json#L63-L65) — "Thi Đấu" → "Đấu Hạng" (C2 canonical). Fix trong S1.
- **BL-11** Mobile parity tracker — close khi S6 done.
- **BL-15** useStomp migration — N/A vì mobile chưa wire STOMP, làm thẳng trong S3.

---

## Sprint plan (8 sprint, ~10-14 tuần)

| # | Sprint | Mục tiêu | Tuần | Detail file (tạo khi start) |
|---|---|---|---|---|
| **S0** ✅ | Monorepo + shared package | Convert root → pnpm workspaces, tách `packages/shared/{types,logic,constants,i18n-keys}` | 1 | [`s0-monorepo-setup.md`](2026-05-18-mobile-rewrite-s0-monorepo-setup.md) — DONE 2026-05-18 |
| **S1** ✅ | Polish stubs + BL-4 | Wire 4 multiplayer screens minimal + TryQuiz type narrow (BL-4 closed S0-4) | 1-2 | [`s1-polish-stubs.md`](2026-05-19-mobile-rewrite-s1-polish-stubs.md) — DONE 2026-05-19 |
| **S2** ✅ | Beta launch internal | EAS Build config + Sentry mobile + branding polish | 1 | [`s2-beta-internal.md`](2026-05-19-mobile-rewrite-s2-beta-internal.md) — DONE 2026-05-19, **M1 milestone reached** |
| **S3** | Multiplayer realtime full | 5 modes STOMP parity + Quản trò + chat + RoomAnalytics | 2-3 | `s3-multiplayer-realtime.md` |
| **S4** | Quiz Set workflow | QuizSetList/Editor/Detail (Sprint 5 parity) + MySets/PersonalEditor | 2 | `s4-quiz-set-workflow.md` |
| **S5** | Scheduled + Tournament detail | ScheduledQuiz 3 screens + TournamentDetail/Match + GroupAnalytics | 1-2 | `s5-scheduled-tournament.md` |
| **S6** | Cosmetics + Help + a11y polish | CosmeticsScreen + Help + onboarding polish + a11y audit | 1 | `s6-cosmetics-help-polish.md` |
| **S7** | Production release | App Store + Play Store assets/screenshots/privacy, submit review | 1-2 | `s7-production-release.md` |

### Milestones
- **M1 — Beta nội bộ** sau S2 (tuần ~3-4): tester invite được qua EAS internal track
- **M2 — Feature parity** sau S6 (tuần ~10-12): mọi flow web đều có trên mobile
- **M3 — Public launch** sau S7 (tuần ~12-14): App Store + Play Store live

---

## Architecture target (post-S0)

```
biblequize/
├── apps/
│   ├── api/          (Spring Boot — unchanged)
│   ├── web/          (React + Vite — import từ packages/shared)
│   └── mobile/       (RN Expo — import từ packages/shared)
└── packages/
    └── shared/
        ├── types/        DTOs: User, Tier, Question, Session, Room, QuizSet
        ├── constants/    C1 tier names, C2 mode labels, C5 answer colors, book list
        ├── logic/        scoring, tierProgression, streaks (merge web + mobile)
        └── i18n-keys/    typed key registry (catch missing keys compile-time)
```

UI components KHÔNG share (web dùng `<div>` + Tailwind, mobile dùng `<View>` + StyleSheet). Chỉ logic/types/constants share.

---

## Common (toàn roadmap)

- **Spec impact**: cập nhật khi từng sprint chạy
  - S0: `[no-spec-impact]` (refactor pure, no behavior change)
  - S1: BL-4 close partial · spec strategy (a) inline (BL-4 progress note)
  - S3-S6: BL-11 progress note mỗi sprint, close khi S6 done
- **Spec strategy**: per-sprint quyết, default (a) inline cho behavior change, (c) `[no-spec-impact]` cho refactor
- **Sensitive files**: S0 chạm `apps/web/src/store/authStore.ts`, `apps/mobile/src/stores/authStore.ts` qua re-export → Tầng 3 BẮT BUỘC web + mobile + api sau migration
- **Definition of Done** áp dụng mọi sprint: Tầng 3 pass cả 3 app, baseline không giảm, không `@SuppressWarnings`/`as any` mới
- **`new-task` skill**: dùng `/new-task mobile-rewrite-s<N>-<slug>` khi bắt đầu sprint mới để auto-generate template + index row

---

## Verification

- Roadmap file này KHÔNG có impl — chỉ là index/plan
- File detail per-sprint sẽ chứa tasks < 100 LOC mỗi cái theo template CLAUDE.md
- Khi S7 done → move roadmap file + tất cả per-sprint file vào `docs/todo/archive/`, đóng BL-11
