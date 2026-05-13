# 2026-04-19 — Game Mode Recommendation (smart highlight) [DONE — pending local test run]

### Design summary
- Priority-cascade algorithm, client-side, pure function
- 5 rules v1: streakAboutToBreak / onboarding / dailyAvailable / fullEnergy / default
- UI: 1 card được recommend có gold border + glow + badge "✨ Gợi ý cho bạn" + reason text
- Các card khác giữ style hiện tại → tạo visual hierarchy không redesign
- Không cần endpoint mới — tái dùng data Home đã fetch

### Task R-1: Pure function getRecommendedMode + tests
- Status: [x] DONE — 5 priority rules + THRESHOLDS exported; 17 test cases (null guard, each rule, cascade precedence, threshold boundary)
- File(s): apps/web/src/utils/getRecommendedMode.ts + __tests__/
- Tests cover: 5 priority branches + edge (null/undefined context) = ~12 cases
- Commit: "feat(web): add smart game mode recommendation algorithm"

### Task R-2: GameModeGrid integration
- Status: [x] DONE — useMemo recommendation, gold border/glow, absolute badge top-right, reason text replacing description
- File(s): apps/web/src/components/GameModeGrid.tsx
- Add optional prop `userStats?: { currentStreak, totalPoints }`
- Compute recommendation via useMemo from existing state + prop
- Render matched card: gold-gradient border + glow shadow + badge + reason text
- Commit: "feat(web): highlight recommended game mode card in GameModeGrid"

### Task R-3: Home.tsx pass userStats prop
- Status: [x] DONE — 1 dòng thay đổi, pass `{ currentStreak: meData?.currentStreak, totalPoints }`
- File(s): apps/web/src/pages/Home.tsx
- Pass `{ currentStreak, totalPoints }` từ meData/tierData vào GameModeGrid
- Commit: "feat(web): wire userStats from Home into GameModeGrid"

### Task R-4: i18n + tests update
- Status: [x] DONE — vi/en thêm `home.recommend.*` (6 keys: badge + 5 reason); GameModeGrid.test.tsx thêm 5 recommendation test cases
- File(s): apps/web/src/i18n/vi.json + en.json + GameModeGrid test
- Add keys `home.recommend.*` (badge + 5 reason messages)
- Update GameModeGrid.test.tsx: verify badge renders khi có recommendation
- Commit: "i18n: add recommend namespace + update GameModeGrid tests"
