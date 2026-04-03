# Thêm tiếng Anh cho BibleQuiz — 2 Phases

> Phase 1: Content (câu hỏi EN) — ít code change, ít risk
> Phase 2: UI i18n (giao diện EN) — nhiều file, cần cẩn thận
> Mỗi phase paste riêng vào Claude Code.

---

## Phase 1: Content English — Câu hỏi tiếng Anh

```
Thêm hỗ trợ câu hỏi tiếng Anh. Backend filter by language. Frontend chọn ngôn ngữ.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Task 1: Kiểm tra database + entity hiện tại

```bash
# Check Question entity
grep -n "language\|Language" apps/api/src/main/java/com/biblequiz/modules/quiz/entity/Question.java

# Check có column language trong DB chưa
grep -rn "language" apps/api/src/main/resources/db/migration/*.sql | head -10

# Check import DTO
grep -n "language" apps/api/src/main/java/com/biblequiz/modules/quiz/dto/*.java
```

Nếu Question entity CHƯA CÓ field language → thêm:

```java
// Question.java entity
@Column(name = "language", length = 5, nullable = false)
private String language = "vi";  // default Vietnamese

@Column(name = "scripture_version", length = 20)
private String scriptureVersion = "VIE2011";
```

Flyway migration (nếu column chưa có):
```sql
-- V{next}__add_question_language.sql
ALTER TABLE question ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'vi';
ALTER TABLE question ADD COLUMN scripture_version VARCHAR(20) DEFAULT 'VIE2011';
CREATE INDEX idx_question_language ON question(language);
-- Set existing questions to Vietnamese
UPDATE question SET language = 'vi' WHERE language IS NULL OR language = '';
```

Nếu ĐÃ CÓ field language → skip migration, chỉ verify.

Commit: "feat: add language field to Question entity"

---

### Task 2: Backend — Filter by language

Cập nhật tất cả query liên quan câu hỏi:

```java
// QuestionRepository.java — thêm language filter
List<Question> findByLanguageAndIsActiveTrue(String language);
List<Question> findByBookAndLanguageAndIsActiveTrue(String book, String language);
long countByLanguage(String language);
long countByBookAndLanguage(String book, String language);

// Hoặc nếu dùng Specification/Criteria:
// Thêm language vào mọi query existing
```

Cập nhật services:

```java
// QuizSessionService — khi tạo session, lấy câu hỏi theo language
public QuizSession createSession(CreateSessionRequest request) {
    String language = request.getLanguage() != null ? request.getLanguage() : "vi";
    List<Question> questions = questionRepository
        .findRandomByBookAndDifficultyAndLanguage(
            request.getBook(), 
            request.getDifficulty(), 
            language,
            request.getQuestionCount()
        );
    // ...
}

// DailyChallengeService — daily challenge theo language
public DailyChallenge getDailyChallenge(String language) {
    // Mỗi language có daily challenge riêng
    // Hoặc cùng daily nhưng câu hỏi khác language
}

// LeaderboardService — leaderboard chung (không chia theo language)
// Vì user chơi EN và VI đều cùng compete
```

Cập nhật API endpoints — thêm optional `language` param:

```java
// Các endpoint liên quan quiz:
GET /api/questions?language=en          // admin: list by language
GET /api/questions/random?language=en   // lấy câu random
POST /api/sessions                      // body thêm: { ..., "language": "en" }
GET /api/daily-challenge?language=en    // daily theo language
GET /api/questions/coverage?language=en // coverage per language
```

Default: `language = "vi"` nếu không truyền → backward compatible.

Tests:
- Query language=vi → chỉ câu tiếng Việt
- Query language=en → chỉ câu tiếng Anh
- Query không có language → default vi
- Daily challenge vi ≠ daily challenge en
- Coverage per language

Commit: "feat: filter questions by language in all queries"

---

### Task 3: Backend — Import + AI generate support language

Import đã có field language (từ IMPORT_FORMAT.md). Verify:
```bash
grep -n "language" apps/api/src/main/java/com/biblequiz/modules/quiz/dto/QuestionImportDto.java
```

AI generate — thêm language param:
```java
// AIAdminController hoặc AI service
POST /api/admin/ai/generate
Body: { ..., "language": "en", "scriptureVersion": "NIV" }

// AI prompt template thay đổi theo language:
// language=vi → prompt tiếng Việt, scripture VIE2011
// language=en → prompt tiếng Anh, scripture NIV/ESV/KJV
```

Commit: "feat: AI generate + import support language param"

---

### Task 4: Frontend — User chọn ngôn ngữ câu hỏi

Thêm language preference cho user:

```typescript
// authStore.ts hoặc settingsStore.ts
interface UserSettings {
  quizLanguage: 'vi' | 'en'  // Ngôn ngữ câu hỏi (không phải UI language)
}

// Hoặc lưu trong user profile API:
PATCH /api/me/settings → { quizLanguage: "en" }
```

UI — thêm language toggle ở các nơi:

**a) Profile/Settings page:**
```typescript
// Section "Ngôn ngữ câu hỏi" / "Quiz Language"
<div>
  <label>Ngôn ngữ câu hỏi:</label>
  <select value={quizLanguage} onChange={setQuizLanguage}>
    <option value="vi">🇻🇳 Tiếng Việt</option>
    <option value="en">🇬🇧 English</option>
  </select>
</div>
```

**b) Practice mode — chọn trước khi chơi:**
```typescript
// Practice.tsx — thêm language filter cạnh book/difficulty
<select value={language} onChange={setLanguage}>
  <option value="vi">🇻🇳 Tiếng Việt</option>
  <option value="en">🇬🇧 English</option>
</select>
```

**c) CreateRoom — chọn language cho room:**
```typescript
// CreateRoom.tsx — thêm field
<label>Ngôn ngữ câu hỏi:</label>
<select name="language" ...>
```

**d) Daily Challenge — tự động theo user preference**

Tất cả API calls thêm `?language=${quizLanguage}` hoặc trong body.

Commit: "feat: user quiz language selection UI"

---

### Task 5: Admin — Quản lý câu hỏi theo language

Admin Questions page thêm language filter:

```typescript
// Questions.tsx — thêm filter
<select value={languageFilter} onChange={setLanguageFilter}>
  <option value="">Tất cả ngôn ngữ</option>
  <option value="vi">🇻🇳 Tiếng Việt</option>
  <option value="en">🇬🇧 English</option>
</select>
```

Admin Dashboard — coverage per language:
```typescript
// Coverage chart thêm language tabs
// Tab "Tiếng Việt" → coverage 66 books (vi)
// Tab "English" → coverage 66 books (en)
```

Admin AI Generator — chọn language generate:
```typescript
// Thêm language + scripture version selector
// vi → VIE2011 (Kinh Thánh Việt Ngữ)
// en → NIV / ESV / KJV (cho user chọn)
```

Commit: "feat: admin question management by language"

---

### Task 6: Seed câu hỏi tiếng Anh

Tạo 66 file JSON tiếng Anh (dùng PROMPT_GENERATE_QUESTIONS.md đã có):

```
apps/api/src/main/resources/seed/questions/
  en/
    01-genesis.json       # Genesis (English)
    02-exodus.json        # Exodus
    ...
    66-revelation.json    # Revelation
```

Cập nhật seed-manifest.json:
```json
{
  "version": "1.1",
  "books": [
    // ... existing Vietnamese books ...
  ],
  "books_en": [
    { "file": "en/01-genesis.json", "book": "Genesis", "language": "en", "scriptureVersion": "NIV" },
    // ...
  ]
}
```

Cập nhật QuestionSeedService: seed cả vi và en.

Commit: "feat: English question seed files structure"

---

### Task 7: Tests + Regression

Backend:
- GET questions language=vi → only Vietnamese
- GET questions language=en → only English
- POST session language=en → English questions
- Daily challenge language=en → different from vi
- Import with language=en → saved correctly
- Coverage per language accurate
- Default language=vi backward compatible

Frontend:
- Language toggle visible in settings
- Practice filter by language
- CreateRoom language selection
- Admin filter by language
- Admin coverage per language tabs

Regression: tất cả existing tests pass (backward compatible).
Commit: "test: multi-language question support"
```

---

## Phase 2: UI i18n — Giao diện tiếng Anh

```
Thêm multi-language cho giao diện app (không chỉ câu hỏi).
Dùng react-i18next. Hiện tại toàn bộ UI text hardcode tiếng Việt.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

### Task 1: Setup react-i18next

```bash
cd apps/web
npm install react-i18next i18next i18next-browser-languagedetector
```

Tạo cấu trúc:
```
apps/web/src/
  i18n/
    index.ts           → i18n config
    vi.json            → Vietnamese translations
    en.json            → English translations
```

```typescript
// apps/web/src/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import vi from './vi.json'
import en from './en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: 'vi',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
```

```typescript
// main.tsx — import i18n
import './i18n'
```

Commit: "feat: setup react-i18next"

---

### Task 2: Tạo translation files

Vietnamese (extract từ code hiện tại):

```json
// apps/web/src/i18n/vi.json
{
  "common": {
    "loading": "Đang tải...",
    "error": "Có lỗi xảy ra",
    "retry": "Thử lại",
    "save": "Lưu",
    "cancel": "Hủy",
    "delete": "Xóa",
    "edit": "Sửa",
    "create": "Tạo mới",
    "search": "Tìm kiếm...",
    "confirm": "Xác nhận",
    "back": "Quay lại",
    "next": "Tiếp theo",
    "close": "Đóng",
    "yes": "Có",
    "no": "Không",
    "all": "Tất cả",
    "noData": "Không có dữ liệu"
  },
  "nav": {
    "home": "Trang chủ",
    "ranked": "Xếp hạng",
    "practice": "Luyện tập",
    "daily": "Hàng ngày",
    "multiplayer": "Nhiều người",
    "groups": "Nhóm",
    "tournaments": "Giải đấu",
    "leaderboard": "Bảng xếp hạng",
    "profile": "Cá nhân",
    "achievements": "Thành tích",
    "settings": "Cài đặt",
    "adminPanel": "Admin Panel"
  },
  "auth": {
    "login": "Đăng nhập",
    "logout": "Đăng xuất",
    "loginWith": "Đăng nhập với {{provider}}",
    "welcome": "Chào mừng trở lại!"
  },
  "home": {
    "greeting": "Chào {{name}}!",
    "dailyChallenge": "Thử thách hàng ngày",
    "dailyCountdown": "Challenge mới sau {{time}}",
    "energy": "Năng lượng",
    "streak": "Chuỗi {{count}} ngày",
    "streakKeep": "Đừng để gãy chuỗi!",
    "leaderboard": "Bảng xếp hạng",
    "activity": "Hoạt động gần đây",
    "noActivity": "Chưa có hoạt động gần đây",
    "verse": "Câu gốc hôm nay"
  },
  "quiz": {
    "question": "Câu {{current}}/{{total}}",
    "timeLeft": "Còn {{seconds}}s",
    "correct": "Đúng!",
    "incorrect": "Sai!",
    "score": "Điểm",
    "accuracy": "Độ chính xác",
    "startQuiz": "Bắt đầu",
    "nextQuestion": "Câu tiếp",
    "finish": "Hoàn thành",
    "quit": "Thoát",
    "quitConfirm": "Bạn có chắc muốn thoát? Tiến trình sẽ mất."
  },
  "results": {
    "title": "Kết quả",
    "excellent": "Xuất sắc!",
    "good": "Tốt!",
    "tryHarder": "Cố gắng thêm!",
    "score": "{{correct}}/{{total}} câu đúng",
    "accuracy": "Độ chính xác: {{percent}}%",
    "time": "Thời gian: {{time}}",
    "xp": "+{{xp}} XP",
    "review": "Xem lại",
    "playAgain": "Chơi lại",
    "share": "Chia sẻ",
    "home": "Trang chủ"
  },
  "review": {
    "title": "Xem lại bài làm",
    "filterAll": "Tất cả",
    "filterWrong": "Câu sai",
    "filterCorrect": "Câu đúng",
    "explanation": "Giải thích",
    "bookmark": "Đánh dấu",
    "retry": "Chơi lại"
  },
  "practice": {
    "title": "Luyện tập",
    "selectBook": "Chọn sách",
    "selectDifficulty": "Chọn độ khó",
    "easy": "Dễ",
    "medium": "Trung bình",
    "hard": "Khó",
    "questionCount": "Số câu hỏi",
    "start": "Bắt đầu luyện tập",
    "history": "Lịch sử luyện tập"
  },
  "ranked": {
    "title": "Xếp hạng",
    "energy": "Năng lượng: {{current}}/{{max}}",
    "season": "Mùa {{name}}",
    "tierProgress": "Tiến trình tier",
    "nextTier": "Tiếp theo: {{tier}} (còn {{points}} điểm)"
  },
  "daily": {
    "title": "Thử thách hàng ngày",
    "todayChallenge": "Thử thách hôm nay",
    "completed": "Đã hoàn thành!",
    "betterThan": "Giỏi hơn {{percent}}% người chơi",
    "countdown": "Thử thách mới sau",
    "leaderboard": "Bảng xếp hạng hôm nay"
  },
  "multiplayer": {
    "title": "Nhiều người",
    "createRoom": "Tạo phòng",
    "joinRoom": "Tham gia",
    "roomCode": "Mã phòng",
    "enterCode": "Nhập mã phòng...",
    "publicRooms": "Phòng công khai",
    "noRooms": "Chưa có phòng nào"
  },
  "room": {
    "waiting": "Đang chờ...",
    "playersReady": "{{ready}}/{{total}} sẵn sàng",
    "ready": "Sẵn sàng",
    "start": "Bắt đầu",
    "modes": {
      "speed_race": "Speed Race",
      "battle_royale": "Battle Royale",
      "team_vs_team": "Team vs Team",
      "sudden_death": "Sudden Death"
    }
  },
  "groups": {
    "title": "Nhóm",
    "myGroups": "Nhóm của tôi",
    "createGroup": "Tạo nhóm",
    "joinGroup": "Tham gia nhóm",
    "members": "{{count}} thành viên",
    "leaderboard": "Bảng xếp hạng nhóm",
    "announcements": "Thông báo",
    "noGroups": "Chưa tham gia nhóm nào"
  },
  "profile": {
    "title": "Hồ sơ",
    "totalPoints": "Tổng điểm",
    "currentStreak": "Chuỗi hiện tại",
    "longestStreak": "Chuỗi dài nhất",
    "sessionsPlayed": "Số phiên học",
    "joinedDate": "Ngày tham gia",
    "badges": "Huy hiệu",
    "heatmap": "Hoạt động"
  },
  "leaderboard": {
    "title": "Bảng xếp hạng",
    "daily": "Hôm nay",
    "weekly": "Tuần này",
    "allTime": "Tất cả",
    "myRank": "Hạng của tôi",
    "points": "{{points}} điểm"
  },
  "tiers": {
    "spark": "Tia Sáng",
    "dawn": "Ánh Bình Minh",
    "lamp": "Ngọn Đèn",
    "flame": "Ngọn Lửa",
    "star": "Ngôi Sao",
    "glory": "Vinh Quang"
  },
  "achievements": {
    "title": "Thành tích",
    "unlocked": "Đã mở khóa",
    "locked": "Chưa mở khóa",
    "streakBadge7": "Chuyên cần",
    "streakBadge30": "Trung tín",
    "streakBadge100": "Kiên nhẫn như Gióp"
  },
  "settings": {
    "title": "Cài đặt",
    "language": "Ngôn ngữ giao diện",
    "quizLanguage": "Ngôn ngữ câu hỏi",
    "notifications": "Thông báo",
    "darkMode": "Chế độ tối",
    "about": "Về BibleQuiz"
  },
  "errors": {
    "notFound": "Trang không tìm thấy",
    "notFoundDesc": "Trang bạn tìm kiếm không tồn tại.",
    "goHome": "Về trang chủ",
    "networkError": "Không thể kết nối server",
    "unauthorized": "Phiên đăng nhập đã hết hạn",
    "forbidden": "Bạn không có quyền truy cập"
  }
}
```

English translation:

```json
// apps/web/src/i18n/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Retry",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search...",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "close": "Close",
    "yes": "Yes",
    "no": "No",
    "all": "All",
    "noData": "No data available"
  },
  "nav": {
    "home": "Home",
    "ranked": "Ranked",
    "practice": "Practice",
    "daily": "Daily",
    "multiplayer": "Multiplayer",
    "groups": "Groups",
    "tournaments": "Tournaments",
    "leaderboard": "Leaderboard",
    "profile": "Profile",
    "achievements": "Achievements",
    "settings": "Settings",
    "adminPanel": "Admin Panel"
  },
  "auth": {
    "login": "Log In",
    "logout": "Log Out",
    "loginWith": "Log in with {{provider}}",
    "welcome": "Welcome back!"
  },
  "home": {
    "greeting": "Hello {{name}}!",
    "dailyChallenge": "Daily Challenge",
    "dailyCountdown": "New challenge in {{time}}",
    "energy": "Energy",
    "streak": "{{count}}-day streak",
    "streakKeep": "Don't break your streak!",
    "leaderboard": "Leaderboard",
    "activity": "Recent Activity",
    "noActivity": "No recent activity",
    "verse": "Today's Verse"
  },
  "quiz": {
    "question": "Question {{current}}/{{total}}",
    "timeLeft": "{{seconds}}s left",
    "correct": "Correct!",
    "incorrect": "Wrong!",
    "score": "Score",
    "accuracy": "Accuracy",
    "startQuiz": "Start",
    "nextQuestion": "Next",
    "finish": "Finish",
    "quit": "Quit",
    "quitConfirm": "Are you sure? Your progress will be lost."
  },
  "results": {
    "title": "Results",
    "excellent": "Excellent!",
    "good": "Good job!",
    "tryHarder": "Keep trying!",
    "score": "{{correct}}/{{total}} correct",
    "accuracy": "Accuracy: {{percent}}%",
    "time": "Time: {{time}}",
    "xp": "+{{xp}} XP",
    "review": "Review",
    "playAgain": "Play Again",
    "share": "Share",
    "home": "Home"
  },
  "review": {
    "title": "Review Answers",
    "filterAll": "All",
    "filterWrong": "Wrong",
    "filterCorrect": "Correct",
    "explanation": "Explanation",
    "bookmark": "Bookmark",
    "retry": "Retry"
  },
  "practice": {
    "title": "Practice",
    "selectBook": "Select Book",
    "selectDifficulty": "Select Difficulty",
    "easy": "Easy",
    "medium": "Medium",
    "hard": "Hard",
    "questionCount": "Number of Questions",
    "start": "Start Practice",
    "history": "Practice History"
  },
  "ranked": {
    "title": "Ranked",
    "energy": "Energy: {{current}}/{{max}}",
    "season": "Season {{name}}",
    "tierProgress": "Tier Progress",
    "nextTier": "Next: {{tier}} ({{points}} points to go)"
  },
  "daily": {
    "title": "Daily Challenge",
    "todayChallenge": "Today's Challenge",
    "completed": "Completed!",
    "betterThan": "Better than {{percent}}% of players",
    "countdown": "Next challenge in",
    "leaderboard": "Today's Leaderboard"
  },
  "multiplayer": {
    "title": "Multiplayer",
    "createRoom": "Create Room",
    "joinRoom": "Join Room",
    "roomCode": "Room Code",
    "enterCode": "Enter room code...",
    "publicRooms": "Public Rooms",
    "noRooms": "No rooms available"
  },
  "room": {
    "waiting": "Waiting...",
    "playersReady": "{{ready}}/{{total}} ready",
    "ready": "Ready",
    "start": "Start",
    "modes": {
      "speed_race": "Speed Race",
      "battle_royale": "Battle Royale",
      "team_vs_team": "Team vs Team",
      "sudden_death": "Sudden Death"
    }
  },
  "groups": {
    "title": "Groups",
    "myGroups": "My Groups",
    "createGroup": "Create Group",
    "joinGroup": "Join Group",
    "members": "{{count}} members",
    "leaderboard": "Group Leaderboard",
    "announcements": "Announcements",
    "noGroups": "You haven't joined any groups yet"
  },
  "profile": {
    "title": "Profile",
    "totalPoints": "Total Points",
    "currentStreak": "Current Streak",
    "longestStreak": "Longest Streak",
    "sessionsPlayed": "Sessions Played",
    "joinedDate": "Joined",
    "badges": "Badges",
    "heatmap": "Activity"
  },
  "leaderboard": {
    "title": "Leaderboard",
    "daily": "Today",
    "weekly": "This Week",
    "allTime": "All Time",
    "myRank": "My Rank",
    "points": "{{points}} pts"
  },
  "tiers": {
    "spark": "Spark",
    "dawn": "Dawn",
    "lamp": "Lamp",
    "flame": "Flame",
    "star": "Star",
    "glory": "Glory"
  },
  "achievements": {
    "title": "Achievements",
    "unlocked": "Unlocked",
    "locked": "Locked",
    "streakBadge7": "Diligent",
    "streakBadge30": "Faithful",
    "streakBadge100": "Patient as Job"
  },
  "settings": {
    "title": "Settings",
    "language": "Interface Language",
    "quizLanguage": "Quiz Language",
    "notifications": "Notifications",
    "darkMode": "Dark Mode",
    "about": "About BibleQuiz"
  },
  "errors": {
    "notFound": "Page Not Found",
    "notFoundDesc": "The page you're looking for doesn't exist.",
    "goHome": "Go Home",
    "networkError": "Cannot connect to server",
    "unauthorized": "Session expired",
    "forbidden": "You don't have permission"
  }
}
```

Commit: "feat: vi.json + en.json translation files"

---

### Task 3: Tạo Language Switcher component

```typescript
// apps/web/src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next'

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()
  
  return (
    <select 
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="bg-[#1a1d2e] text-white border border-white/10 rounded-lg px-3 py-1.5 text-sm"
    >
      <option value="vi">🇻🇳 Tiếng Việt</option>
      <option value="en">🇬🇧 English</option>
    </select>
  )
}
```

Đặt LanguageSwitcher vào:
- AppLayout sidebar (bottom, gần user info)
- Settings page
- Login page (cho guest chọn trước khi login)
- Landing page (header)

Commit: "feat: language switcher component"

---

### Task 4: Migrate pages — Thay hardcoded text bằng t()

Quy trình cho MỖI page:

```typescript
// TRƯỚC:
<h1>Trang chủ</h1>
<p>Chào mừng {name}!</p>
<button>Bắt đầu</button>

// SAU:
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()
<h1>{t('nav.home')}</h1>
<p>{t('home.greeting', { name })}</p>
<button>{t('quiz.startQuiz')}</button>
```

Thứ tự migrate (theo priority):

**Batch A — Core pages (dùng nhiều nhất):**
1. AppLayout.tsx — nav labels, user info
2. Home.tsx — greeting, section titles, streak
3. Quiz.tsx — question counter, timer, buttons
4. QuizResults.tsx — score, grade text, buttons
5. Review.tsx — filter tabs, buttons
6. Login.tsx — login buttons, providers

**Batch B — Game modes:**
7. Practice.tsx — filters, history
8. Ranked.tsx — energy, tier, season
9. DailyChallenge.tsx — title, countdown, leaderboard
10. Multiplayer.tsx — room list, buttons
11. CreateRoom.tsx — form labels
12. RoomQuiz.tsx — game mode labels, status

**Batch C — Social:**
13. Leaderboard.tsx — tabs, rank labels
14. Profile.tsx — stats labels, badges
15. Groups.tsx — group list, actions
16. GroupDetail.tsx — tabs, member list
17. Tournaments.tsx — status labels
18. Achievements.tsx — badge names, descriptions

**Batch D — Utility:**
19. NotFound.tsx — error text
20. LandingPage.tsx — all marketing copy
21. ShareCard.tsx — share text

**Admin pages: KHÔNG migrate i18n** — admin UI giữ tiếng Việt hoặc tiếng Anh cố định (internal tool, không cần multi-language).

Mỗi batch commit riêng:
- "i18n: migrate core pages (Home, Quiz, Results, Review, Login)"
- "i18n: migrate game mode pages"
- "i18n: migrate social pages"
- "i18n: migrate utility pages"

---

### Task 5: Bible book names — bilingual mapping

```typescript
// apps/web/src/data/bookNames.ts
export const BOOK_NAMES: Record<string, { vi: string; en: string }> = {
  "Genesis": { vi: "Sáng Thế Ký", en: "Genesis" },
  "Exodus": { vi: "Xuất Hành", en: "Exodus" },
  "Leviticus": { vi: "Lê-vi Ký", en: "Leviticus" },
  // ... tất cả 66 sách
  "Revelation": { vi: "Khải Huyền", en: "Revelation" },
}

export const getBookName = (bookKey: string, language: string): string => {
  const book = BOOK_NAMES[bookKey]
  if (!book) return bookKey
  return language === 'en' ? book.en : book.vi
}
```

Dùng trong UI:
```typescript
const { i18n } = useTranslation()
<span>{getBookName(question.book, i18n.language)}</span>
```

Commit: "feat: bilingual Bible book names"

---

### Task 6: Date/Number formatting

```typescript
// apps/web/src/utils/format.ts
import { useTranslation } from 'react-i18next'

export const useFormatters = () => {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN'
  
  return {
    formatDate: (date: Date) => date.toLocaleDateString(locale),
    formatNumber: (num: number) => num.toLocaleString(locale),
    formatRelativeTime: (date: Date) => {
      // "2 giờ trước" vs "2 hours ago"
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
      const diff = Date.now() - date.getTime()
      const hours = Math.floor(diff / 3600000)
      if (hours < 1) return rtf.format(-Math.floor(diff / 60000), 'minute')
      if (hours < 24) return rtf.format(-hours, 'hour')
      return rtf.format(-Math.floor(hours / 24), 'day')
    },
  }
}
```

Commit: "feat: locale-aware date/number formatting"

---

### Task 7: Verify layout không bị break

Tiếng Anh thường DÀI HƠN tiếng Việt 20-30%. Check:

```bash
# Tìm buttons/labels có thể bị tràn
grep -rn 'truncate\|overflow-hidden\|whitespace-nowrap\|max-w-\|w-\[' apps/web/src/ --include="*.tsx" | head -20
```

Manual check trên browser:
- Switch sang English → mở mỗi page → check:
  - [ ] Buttons không bị tràn text
  - [ ] Navigation labels không bị cắt
  - [ ] Tables headers không bị wrap xấu
  - [ ] Cards content không overflow
  - [ ] Mobile layout vẫn OK

Nếu bị tràn → adjust:
- Giảm font size
- Dùng `truncate` class
- Rút ngắn English text (vd "Achievements" → "Badges")

Commit: "fix: adjust layout for English text length"

---

### Task 8: Tests + Regression

```typescript
// Test i18n setup
test('renders Vietnamese by default', () => {
  render(<App />)
  expect(screen.getByText('Trang chủ')).toBeInTheDocument()
})

test('switches to English', () => {
  render(<App />)
  act(() => i18n.changeLanguage('en'))
  expect(screen.getByText('Home')).toBeInTheDocument()
})

test('persists language in localStorage', () => {
  act(() => i18n.changeLanguage('en'))
  expect(localStorage.getItem('i18nextLng')).toBe('en')
})
```

Update existing tests: nếu test assert text content ("Bắt đầu", "Trang chủ") → dùng t() hoặc test cả 2 languages.

Regression: tất cả FE tests pass.
Commit: "test: i18n language switching"
```

---

## Thứ tự tổng:

```
Phase 1 (Content — 1-2 tuần):
  Task 1: DB + entity (migration)
  Task 2: Backend filter by language
  Task 3: Import + AI generate
  Task 4: Frontend language selection
  Task 5: Admin language management
  Task 6: Seed English files
  Task 7: Tests

Phase 2 (UI i18n — 1-2 tuần):
  Task 1: Setup react-i18next
  Task 2: vi.json + en.json
  Task 3: Language switcher
  Task 4: Migrate ~20 pages (4 batches)
  Task 5: Book names bilingual
  Task 6: Date/number formatting
  Task 7: Layout check
  Task 8: Tests
```
