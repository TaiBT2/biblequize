# Apply Parchment Style to All Pages

Apply the same warm visual language from the Practice page to all other user-facing pages.

## Design System (from Practice page)

| Token | Value |
|---|---|
| Page background | `#12103a` + purple radial gradients + star dots |
| Card background | `#f5f0e4` (warm cream/parchment) |
| Primary text (on card) | `#4a3f35` |
| Secondary text (on card) | `#7a6a5a` |
| Title font | `Caveat`, cursive |
| Body font | `Nunito`, sans-serif |
| Accent (selected/CTA) | `#4bbf9f` (teal) |
| Danger | `#e05c5c` |
| Button (primary) | teal gradient pill |
| Button (secondary) | white/gray bordered |

---

## Proposed Changes

### 1. CSS Foundation  
#### [MODIFY] [global.css](file:///f:/git/biblequize/apps/web/src/styles/global.css)
- Add shared card class: `.page-card` — reusable parchment card shell
- Add shared page wrapper: `.page-bg` — same star background as practice-bg
- Add shared heading component: `.page-title` — Caveat cursive title
- Add shared badges: `.badge-easy`, `.badge-medium`, `.badge-hard`
- Add answer button variants: `.answer-btn`, `.answer-btn-correct`, `.answer-btn-wrong`
- Add shared form elements: `.form-input`, `.form-select`
- Add `btn-primary`, `btn-secondary`, `btn-danger` pills

---

### 2. Login Page
#### [MODIFY] [Login.tsx](file:///f:/git/biblequize/apps/web/src/pages/Login.tsx)
- Replace `neon-bg` with `page-bg`
- Replace `neon-card` with `page-card` 
- Replace `neon-btn neon-btn-blue` Google button → styled pill (white bg, Google colors)
- Replace `neon-btn neon-btn-pink` Facebook button → styled pill (blue Facebook color)

### 3. Quiz Page
#### [MODIFY] [Quiz.tsx](file:///f:/git/biblequize/apps/web/src/pages/Quiz.tsx)
- Replace dark page background with `page-bg`
- Replace `neon-card` question card → `page-card`
- Replace `neon-btn-gray/green/red/blue` answer buttons → `answer-btn`, `answer-btn-correct`, `answer-btn-wrong`
- Timer circle: change cyan stroke → warm teal
- Progress bar: change neon gradient → teal
- Score text: change neon-green → teal text on card

### 4. QuizResults Page
#### [MODIFY] [QuizResults.tsx](file:///f:/git/biblequize/apps/web/src/pages/QuizResults.tsx)
- Replace dark background → `page-bg`
- Stats cards → `page-card` with warm inner cards
- Action buttons → `btn-primary` pill

### 5. Home Page (game-mode cards only)
#### [MODIFY] [Home.tsx](file:///f:/git/biblequize/apps/web/src/pages/Home.tsx)
- Keep dark hero section (intentional brand statement)
- Replace `.gaming-card` neon cards → `page-card` with teal/amber/gold accents 
- The CTA button stays (intentional hero element)

### 6. Profile Page
#### [MODIFY] [Profile.tsx](file:///f:/git/biblequize/apps/web/src/pages/Profile.tsx)
- Replace dark background → `page-bg`
- Stats sections → `page-card`

### 7. Leaderboard Page
#### [MODIFY] [Leaderboard.tsx](file:///f:/git/biblequize/apps/web/src/pages/Leaderboard.tsx)
- Replace dark background → `page-bg`
- Leaderboard table → `page-card`

### 8. Review Page
#### [MODIFY] [Review.tsx](file:///f:/git/biblequize/apps/web/src/pages/Review.tsx)
- Replace dark cards → `page-card`

### 9. Ranked Page
#### [MODIFY] [Ranked.tsx](file:///f:/git/biblequize/apps/web/src/pages/Ranked.tsx)
- Replace dark background → `page-bg`
- Info panels → `page-card`

---

## Pages NOT changed
- Admin pages (`admin/*`) — separate admin UX
- [AuthCallback.tsx](file:///f:/git/biblequize/apps/web/src/pages/AuthCallback.tsx) — redirect-only page, no visual
- `Rooms`, `RoomLobby`, `RoomQuiz`, `CreateRoom`, `JoinRoom` — can be done in a follow-up
- [Achievements.tsx](file:///f:/git/biblequize/apps/web/src/pages/Achievements.tsx) — can be done in a follow-up

---

## Verification Plan

### Browser Testing
1. Run `npm run dev` in `f:\git\biblequize\apps\web` (already running)
2. Open http://localhost:5173/ — verify game-mode cards use parchment style
3. Open http://localhost:5173/login — verify login card is parchment
4. Open http://localhost:5173/practice → click "Bắt đầu luyện tập" — verify Quiz page uses parchment
5. After completing quiz — verify Results page uses parchment
6. Open http://localhost:5173/ranked — verify parchment card
7. Open http://localhost:5173/leaderboard — verify parchment style
