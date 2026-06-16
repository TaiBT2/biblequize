# 2026-06-14 — "Khung Sáng" Full-App Redesign — MASTER PLAN

> **Bối cảnh**: Home redesign "Khung Sáng" (task [HGR](2026-06-12-home-game-redesign.md)) đổi **toàn bộ ngôn ngữ thị giác**
> (nền sáng gallery + phổ khúc xạ + bóng màu + đèn/lửa + vòm giếng trời, font Bricolage Grotesque + Literata).
> Style này áp cho **CẢ APP**, không chỉ Home → mọi page phải migrate. File này là **bản đồ tổng** đảm bảo **không sót page nào**.
> **Branch**: `redesign/home-game-vibe`. **Code prefix toàn migration**: `KS` (Khung Sáng).

## Nguồn sự thật visual
`docs/designs/home-game vibe/` — `biblequiz-home-khungsang (1).html` (visual) · `biblequiz-khungsang-spec.md` (nguyên tắc + component props) · `biblequiz-tokens.css` (token) · `biblequiz-tailwind.config.js` (Tailwind extend). Chi tiết token/IA: xem [HGR task §0–§1](2026-06-12-home-game-redesign.md).

## Chiến lược: FOUNDATION-FIRST (đòn bẩy lớn nhất trước)
Đổi tầng dùng chung trước → nhiều page "ăn theo" mà không phải sửa từng cái:
1. **Tokens + fonts** (KS-0 / HGR-1): `tokens.css` + merge Tailwind `bq.*` + 3 font. Toàn app có sẵn class `bq-*`.
2. **Shell**: `layouts/AppLayout.tsx` (sidebar/topnav + header + bottom nav) + `layouts/AdminLayout.tsx`.
3. **UI primitives**: `components/ui/{Button,Card,Input,Modal,SearchableSelect}.tsx` + `Skeleton`, `EmptyState`, `ErrorToast`/`ErrorBoundary`, `OfflineBanner`, `global.css` (scrollbar/utilities).
> ⚠️ Đây là **file nhạy cảm** (CLAUDE.md): `AppLayout.tsx`, `global.css`, `main.tsx` → sửa = chạy Tầng 3 ngay. Mỗi PR nhỏ, verify nhiều page.

## Rủi ro xuyên suốt (xem chi tiết HGR §5)
- **CSS-var vs bug nền trắng**: "Khung Sáng" cố ý dùng `var(--bq-*)` (season-theming). Project memory cảnh báo CSS-var gây bug nền trắng (đã hardcode hex). Design nền sáng → rủi ro thấp, nhưng **test render thật từng wave**.
- **Quiz full-screen**: các màn gameplay (Quiz/BasicQuiz/RoomQuiz/SpeedRound/Mystery/Weekly/ScheduledPlay/OnboardingTry) cần bản "Khung Sáng" giữ độ tập trung — không chỉ đổi màu. Cân nhắc biến thể "focus" của token.
- **Answer colors C5**: A=Coral/B=Sky/C=Gold/D=Sage là canonical — KHÔNG thay bằng jewel palette. Map jewel cho khung, giữ answer colors cho đáp án.
- i18n: chuỗi mới có `vi`+`en`. Giữ `data-testid`. Baseline test (`.test-baseline`) KHÔNG giảm.

## Waves & task files (mỗi wave = 1 file task riêng)
| Wave | Phạm vi | Task file | # page |
|---|---|---|---|
| **W0** | Foundation: tokens + shell + UI primitives + shared atoms | [ks-w0-foundation](2026-06-14-ks-w0-foundation-design-system.md) | shell/shared |
| **W1** | Home + Home widgets | [HGR (đã có)](2026-06-12-home-game-redesign.md) | 1 |
| **W2** | Core play loop | [ks-w2-core-play](2026-06-14-ks-w2-core-play-loop.md) | 6 |
| **W3** | Ranked | [ks-w3-ranked](2026-06-14-ks-w3-ranked.md) | 2 |
| **W4** | Daily & Variety | [ks-w4-daily-variety](2026-06-14-ks-w4-daily-variety.md) | 4 |
| **W5** | Progress & Identity | [ks-w5-progress-identity](2026-06-14-ks-w5-progress-identity.md) | 5 |
| **W6** | Groups & Quiz Sets & Scheduled | [ks-w6-groups-quizsets](2026-06-14-ks-w6-groups-quizsets.md) | 12 |
| **W7** | Multiplayer & Rooms | [ks-w7-multiplayer-rooms](2026-06-14-ks-w7-multiplayer-rooms.md) | 9 |
| **W8** | Tournaments | [ks-w8-tournaments](2026-06-14-ks-w8-tournaments.md) | 3 |
| **W9** | Auth / Onboarding / Public | [ks-w9-auth-public](2026-06-14-ks-w9-auth-public.md) | 9 |
| **W10** | Admin (light touch) | [ks-w10-admin](2026-06-14-ks-w10-admin.md) | 15 |

## ✅ INVENTORY ĐẦY ĐỦ — checklist "không sót page" (theo `main.tsx`)
> Mỗi page tick khi wave tương ứng DONE. Nguồn: route trong `apps/web/src/main.tsx`.

### Trong AppLayout
- [ ] `/` Home → **W1**
- [ ] `/leaderboard` Leaderboard → W5
- [ ] `/profile` Profile → W5
- [ ] `/achievements` Achievements → W5
- [ ] `/journey` Journey → W5
- [ ] `/cosmetics` Cosmetics → W5
- [ ] `/ranked` Ranked → W3
- [ ] `/basic-quiz` BasicQuiz → W2
- [ ] `/practice` Practice → W2
- [ ] `/review` Review → W2
- [ ] `/daily` DailyChallenge → W4
- [ ] `/weekly-quiz` WeeklyQuiz → W4
- [ ] `/mystery-mode` MysteryMode → W4
- [ ] `/speed-round` SpeedRound → W4
- [ ] `/help` Help → W9
- [ ] `/multiplayer` Multiplayer → W7
- [ ] `/rooms` Rooms → W7
- [ ] `/room/create` CreateRoom → W7
- [ ] `/room/join` JoinRoom → W7
- [ ] `/groups` Groups → W6
- [ ] `/groups/:id` GroupDetail → W6
- [ ] `/groups/:id/analytics` GroupAnalytics → W6
- [ ] `/groups/:id/quiz-sets` QuizSetList → W6
- [ ] `/groups/:id/quiz-sets/new` + `/:setId/edit` QuizSetEditor → W6
- [ ] `/groups/:id/quiz-sets/:setId` QuizSetDetail → W6
- [ ] `/groups/:id/scheduled-quizzes/new` ScheduledQuizCreate → W6
- [ ] `/groups/:id/scheduled-quizzes/:quizId` ScheduledQuizDetail → W6
- [ ] `/groups/:id/scheduled-quizzes/:quizId/play` ScheduledQuizPlay → W6
- [ ] `/tournaments` Tournaments → W8
- [ ] `/tournaments/:id` TournamentDetail → W8
- [ ] `/tournaments/:id/match/:matchId` TournamentMatch → W8
- [ ] `/my-sets` MySets → W6
- [ ] `/my-sets/new` + `/:setId/edit` + `/:setId` PersonalQuizSetEditor → W6

### Standalone (ngoài AppLayout)
- [ ] `/quiz` Quiz → W2
- [ ] `/room/:roomId/lobby` RoomLobby → W7
- [ ] `/room/:roomId/quiz` RoomQuiz (+ room/views/*) → W7
- [ ] `/room/:roomId/host` RoomQuizHost (+ RoomOverlays) → W7
- [ ] `/room/:roomId/analytics` RoomAnalytics → W7
- [ ] `/onboarding` Onboarding → W9
- [ ] `/onboarding/try` OnboardingTryQuiz → W9 (gameplay → tham chiếu W2)
- [ ] `/landing` LandingPage → W9
- [ ] `/login` Login → W9
- [ ] `/register` Register → W9
- [ ] `/auth/callback` AuthCallback → W9 (chỉ spinner — touch nhẹ)
- [ ] `/privacy` PrivacyPolicy → W9
- [ ] `/terms` TermsOfService → W9
- [ ] `*` NotFound → W9
- [ ] `/home-game-preview` HomeGameMock → **XÓA** ở HGR-12 (mock dark cũ)

### Admin (AdminLayout) → W10
- [ ] `/admin` Dashboard · `users` · `questions` · `feedback` · `rankings` · `events` · `ai-generator` · `review-queue` · `groups` · `notifications` · `config` · `export` · `question-quality` · `metrics/early-unlock` · `test`

## Thứ tự thực hiện đề xuất
W0 (foundation) → W1 (Home, validate concept thật) → W2 → W3 → W4 → W5 → W6 → W7 → W8 → W9 → W10.
> Sau W0+W1: dừng review với chủ dự án trước khi cuốn các wave còn lại (concept đã chứng minh trên Home).

## Definition of Done toàn migration
- Mọi page trong inventory ✅ (không còn nền tối "Sacred Modernist" lẫn lộn).
- Token cũ (`surface*`, `primary`, `secondary`...) chỉ còn nơi chưa migrate; cuối cùng dọn token chết.
- Tầng 3 pass mỗi wave; `.test-baseline` không giảm.
- i18n đủ vi/en; a11y AA; reduced-motion tôn trọng.
