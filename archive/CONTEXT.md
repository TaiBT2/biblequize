# BibleQuiz — Project Context (2026-04-15)

> File này giúp conversation mới nhanh chóng có context. Đọc file này đầu tiên.

---

## Stack
- **Backend**: Spring Boot 3.3 (Java 17), port 8080, MySQL 8.0 (Docker 3307), Redis 7
- **Web**: Vite 5 + React 18 + TypeScript, port 5173
- **Mobile**: Expo SDK + React Native + TypeScript (rebuilt 2026-04-09)
- **DB**: Flyway V1–V27
- **Tests**: Web 412 (Vitest), Mobile 33 (Jest), Backend ~380

## Features Shipped

### 1. Tier Progression v1
- Sub-tier Stars, Daily Missions, Milestone Burst, Comeback Bridge, Cosmetics, Prestige
- Services: TierProgressService, DailyMissionService, ComebackService, CosmeticService, PrestigeService
- Flyway V23-V27
- APIs: /api/me/tier-progress, /api/me/daily-missions, /api/me/comeback-*, /api/me/cosmetics, /api/me/prestige-*

### 2. Sound + Animations
- SoundManager (Web Audio API, 13 types), Haptic feedback
- Quiz animations: correct pulse, wrong shake, combo banner, timer warning
- Components: TierUpModal, StarPopup, MilestoneBanner

### 3. Explanations + Learning
- Wrong answer → explanation + scripture ref + bookmark
- GET /api/me/weaknesses → WeaknessWidget on Profile

### 4. Variety Events
- Weekly Themed Quiz (10 themes), Mystery Mode (1.5x XP), Speed Round (10×10s, 2x XP)
- Daily Bonus (14% chance), Seasonal Content (Christmas/Easter)
- VarietyQuizController, WeeklyThemeService
- Quiz.tsx supports custom timePerQuestion

### 5. Mobile Rebuild (32 screens)
- Old app → apps/mobile-old-backup-20260408
- New: 5 tabs, 32 screens, Zustand + TanStack Query + React Navigation 6
- Theme: Sacred Modernist design tokens
- Logic modules: scoring, tierProgression, streaks (tested)
- 26 Stitch designs in docs/designs/stitch/mobile/

### 6. Mobile Fix-All
- i18n: 200+ keys vi+en, useTranslation in all screens
- Scoring: isDailyFirst 2x bonus
- useHaptic, useOnlineStatus, OfflineBanner, ErrorBoundary
- Quiz exit confirmation, Delete account, Google Sign-In hook

## Key API Endpoints
```
GET  /api/me/tier-progress
GET  /api/me/daily-missions
GET  /api/me/comeback-status    POST /api/me/comeback-claim
GET  /api/me/cosmetics          PATCH /api/me/cosmetics
GET  /api/me/prestige-status    POST /api/me/prestige
GET  /api/me/weaknesses
GET  /api/quiz/weekly            GET /api/quiz/weekly/theme
POST /api/quiz/mystery
GET  /api/quiz/speed-round
GET  /api/quiz/daily-bonus
GET  /api/quiz/seasonal
```

## Mobile Status

### Works
- Full navigation flow: Splash → Language → Welcome → Try Quiz → Login → Home
- Quiz gameplay (timer, answers, combo, scoring, results, review)
- All 32 screens render, API integration with JWT refresh
- ErrorBoundary, OfflineBanner, useHaptic
- Test account: mobile@test.com / password123

### Missing / Blocked
1. **Google OAuth**: useGoogleAuth hook exists, needs Expo account + redirect URI in Google Cloud Console
2. **STOMP WebSocket**: ws/ empty, multiplayer quiz placeholder (~8h work)
3. **Sound files**: assets/sounds/ empty, useSound hook not created
4. **Push notifications**: expo-notifications not wired
5. **Hardcoded strings**: useTranslation imported but t() not replacing all strings yet

### Dev Setup
```bash
# Backend
docker compose up -d mysql redis
cd apps/api && ./mvnw spring-boot:run

# Web
cd apps/web && npm run dev

# Mobile
cd apps/mobile && npx expo start --clear
# Emulator: adb reverse tcp:8081 tcp:8081 && adb reverse tcp:8080 tcp:8080
# ADB: C:/Users/thanh/AppData/Local/Android/Sdk/platform-tools/adb.exe
```

## Git
- Repo: https://github.com/TaiBT2/biblequize.git
- Branch: main (all features merged)
- User: taibt

## User Preferences
- Communicates in Vietnamese, code/commits in English
- Gives prompt files → "đọc và thực hiện"
- Wants commits pushed + merged to main after each feature
- Uses Stitch MCP for designs (project ID: 5341030797678838526)
- gcloud: tai.bt@metatechnologylab.io
