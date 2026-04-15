# APP-M01 — Auth & Onboarding (L1 Smoke)

**Screens:** SplashScreen → LanguageSelectionScreen → WelcomeSlidesScreen → TryQuizScreen → TryQuizResultScreen → LoginScreen
**Spec ref:** Mobile onboarding flow
**Format note:** Maestro YAML syntax. Executable once `testID` props are wired.

---

## Maestro Strategy Notes

- **Selector priority**: `id` (testID prop) > `text` (exact string) > `label` (accessibilityLabel)
- **Auth**: `[DEV] Quick Login` button (text-based, `__DEV__` only) → POST `/api/auth/mobile/login`
- **SplashScreen**: Auto-navigates after 2 000 ms → use `waitForAnimationToEnd` before asserting next screen
- **Onboarding store**: LanguageSelection + WelcomeSlides states persist via MMKV; cleared between test runs with `clearState: true` in `launchApp`

---

## APP-M01-L1-001 — SplashScreen hiển thị rồi tự chuyển sang LanguageSelection

**Priority**: P0
**Est. runtime**: ~5s
**Tags**: @smoke @mobile @auth @onboarding @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- launchApp:
    clearState: true
- assertVisible: "BibleQuiz"
- assertVisible: "Lời Chúa trong từng câu hỏi"
- waitForAnimationToEnd:
    timeout: 4000
- assertVisible: "Chào mừng / Welcome"
```

**Assertions**:
- "BibleQuiz" title visible on SplashScreen
- "Lời Chúa trong từng câu hỏi" subtitle visible
- After ~2s auto-navigate → "Chào mừng / Welcome" visible on LanguageSelection

**Notes**:
- SplashScreen không có testID — text-based assertions đủ
- `clearState: true` reset onboarding Zustand/MMKV store

---

## APP-M01-L1-002 — LanguageSelection: chọn ngôn ngữ và Continue

**Priority**: P0
**Est. runtime**: ~4s
**Tags**: @smoke @mobile @auth @onboarding @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- launchApp:
    clearState: true
- waitForAnimationToEnd:
    timeout: 4000
- assertVisible: "Chào mừng / Welcome"
- assertVisible: "Tiếng Việt"
- assertVisible: "English"
- tapOn: "Tiếng Việt"
- tapOn:
    id: "language-continue-btn"
- assertVisible: "BibleQuiz"
```

**Assertions**:
- Cả 2 language options visible
- Tap "Tiếng Việt" → chọn (radio selected)
- Tap Continue → navigate sang WelcomeSlides
- WelcomeSlides: "BibleQuiz" brand text visible

**Notes**:
- [NEEDS TESTID: language-continue-btn] — nút "Tiếp theo" / "Continue" trên LanguageSelection
- "Tiếng Việt" và "English" là static text → không cần testID

---

## APP-M01-L1-003 — WelcomeSlides: swipe qua 3 slides rồi tới LoginScreen

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @auth @onboarding

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- launchApp:
    clearState: true
- waitForAnimationToEnd:
    timeout: 4000
- tapOn: "Tiếng Việt"
- tapOn:
    id: "language-continue-btn"
- waitForAnimationToEnd
- assertVisible:
    id: "welcome-slides-screen"
- tapOn:
    id: "slide-next-btn"
- waitForAnimationToEnd
- tapOn:
    id: "slide-next-btn"
- waitForAnimationToEnd
- tapOn:
    id: "slide-get-started-btn"
- assertVisible: "Đăng nhập bằng Google"
```

**Assertions**:
- WelcomeSlides screen visible (testID)
- Next button tappable on each slide
- Final slide có "Get Started" / "Bắt đầu" → navigate sang LoginScreen
- LoginScreen: "Đăng nhập bằng Google" button visible

**Notes**:
- [NEEDS TESTID: welcome-slides-screen] — wrapper WelcomeSlidesScreen
- [NEEDS TESTID: slide-next-btn] — nút "Next" trên mỗi slide (không phải slide cuối)
- [NEEDS TESTID: slide-get-started-btn] — nút "Bắt đầu" trên slide cuối
- WelcomeSlides screen chưa đọc code — confirm số slides khi implement testID

---

## APP-M01-L1-004 — TryQuiz: xem demo quiz không cần login

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @smoke @mobile @auth @onboarding

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- launchApp:
    clearState: true
- waitForAnimationToEnd:
    timeout: 4000
- tapOn: "Tiếng Việt"
- tapOn:
    id: "language-continue-btn"
- waitForAnimationToEnd
- tapOn:
    id: "slide-try-quiz-btn"
- waitForAnimationToEnd
- assertVisible:
    id: "try-quiz-screen"
- assertVisible:
    id: "quiz-question-text"
- tapOn:
    id: "quiz-answer-option-0"
- waitForAnimationToEnd
- assertVisible:
    id: "try-quiz-result-screen"
```

**Assertions**:
- "Try Quiz" / "Thử ngay" link visible on WelcomeSlides
- TryQuizScreen: question text visible
- Tap any answer → navigate to TryQuizResultScreen
- Result screen visible

**Notes**:
- [NEEDS TESTID: slide-try-quiz-btn] — nút "Thử quiz ngay" (có thể là text link trên WelcomeSlides)
- [NEEDS TESTID: try-quiz-screen] — wrapper TryQuizScreen
- [NEEDS TESTID: quiz-question-text] — text câu hỏi trong TryQuizScreen
- [NEEDS TESTID: quiz-answer-option-0] — option đầu tiên (index 0)
- [NEEDS TESTID: try-quiz-result-screen] — wrapper TryQuizResultScreen
- TryQuiz dùng static questions — không cần backend

---

## APP-M01-L1-005 — LoginScreen: DEV Quick Login thành công → vào HomeScreen

**Priority**: P0
**Est. runtime**: ~5s
**Tags**: @smoke @mobile @auth @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- launchApp:
    clearState: true
- waitForAnimationToEnd:
    timeout: 4000
- tapOn: "Tiếng Việt"
- tapOn:
    id: "language-continue-btn"
- waitForAnimationToEnd
- tapOn:
    id: "slide-get-started-btn"
- waitForAnimationToEnd
- assertVisible: "[DEV] Quick Login"
- tapOn: "[DEV] Quick Login"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible: "BibleQuiz"
- assertVisible:
    id: "home-screen"
```

**Assertions**:
- "[DEV] Quick Login" button visible (only in `__DEV__` builds)
- Tap → POST `/api/auth/mobile/login` with test credentials
- Success → navigate to HomeScreen
- HomeScreen: brand "BibleQuiz" + `home-screen` testID visible

**Notes**:
- [NEEDS TESTID: home-screen] — wrapper HomeScreen (ScrollView root)
- "[DEV] Quick Login" là static text → text-based tap đủ, không cần testID
- Precondition: backend running, `mobile@test.com` account exists (seed data)

---

## NEEDS TESTID Summary (APP-M01)

| Element | Suggested testID | File |
|---------|-----------------|------|
| Language continue btn | `language-continue-btn` | screens/onboarding/LanguageSelectionScreen.tsx |
| Welcome slides screen | `welcome-slides-screen` | screens/onboarding/WelcomeSlidesScreen.tsx |
| Slide next btn | `slide-next-btn` | screens/onboarding/WelcomeSlidesScreen.tsx |
| Slide get started btn | `slide-get-started-btn` | screens/onboarding/WelcomeSlidesScreen.tsx |
| Slide try quiz btn | `slide-try-quiz-btn` | screens/onboarding/WelcomeSlidesScreen.tsx |
| Try quiz screen | `try-quiz-screen` | screens/onboarding/TryQuizScreen.tsx |
| Quiz question text | `quiz-question-text` | screens/onboarding/TryQuizScreen.tsx |
| Quiz answer option | `quiz-answer-option-{n}` | screens/onboarding/TryQuizScreen.tsx |
| Try quiz result screen | `try-quiz-result-screen` | screens/onboarding/TryQuizResultScreen.tsx |
| Home screen | `home-screen` | screens/main/HomeScreen.tsx |
