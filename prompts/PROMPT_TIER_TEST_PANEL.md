# Admin Test Panel — Verify Tier Progression Manually

> Tạo admin panel để test tier features không cần grind.
> Set tier instant, reset history, mock data → trải nghiệm như user thật.
> Paste vào Claude Code.

---

```
Tạo Admin Test Panel để verify tier progression features.
Vấn đề: tier progression cần thời gian dài để test bằng cách chơi thật.
Giải pháp: admin có thể set tier instant + reset data + simulate scenarios.

CHỈ ENABLE trong dev/staging environment. KHÔNG hiện trong production.

TRƯỚC KHI CODE: chia tasks vào TODO.md.

## Task 1: Backend — Test Endpoints (DEV ONLY)

```java
// AdminTestController.java
package com.biblequiz.modules.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/test")
@RequiredArgsConstructor
@Profile({"dev", "staging"})  // QUAN TRỌNG: không enable production
public class AdminTestController {

    private final UserRepository userRepository;
    private final UserQuestionHistoryRepository historyRepository;
    private final EnergyService energyService;
    private final StreakService streakService;

    /**
     * Set tier instant cho user
     */
    @PostMapping("/users/{userId}/set-tier")
    public ResponseEntity<?> setTier(@PathVariable Long userId, 
                                     @RequestParam int tierLevel) {
        if (tierLevel < 1 || tierLevel > 6) {
            return ResponseEntity.badRequest().body("Tier must be 1-6");
        }
        
        User user = userRepository.findById(userId).orElseThrow();
        user.setTierLevel(tierLevel);
        
        // Set total points đủ cho tier đó (theo SPEC)
        int[] tierThresholds = {0, 1000, 5000, 15000, 35000, 75000};
        user.setTotalPoints(tierThresholds[tierLevel - 1]);
        
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "newTier", tierLevel,
            "newPoints", user.getTotalPoints()
        ));
    }

    /**
     * Reset question history — test smart selection
     */
    @PostMapping("/users/{userId}/reset-history")
    public ResponseEntity<?> resetHistory(@PathVariable Long userId) {
        long deleted = historyRepository.deleteByUserId(userId);
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "deletedRecords", deleted,
            "message", "History reset. Tất cả câu hỏi sẽ là 'chưa gặp'"
        ));
    }

    /**
     * Mock history — giả vờ user đã gặp X% câu hỏi
     */
    @PostMapping("/users/{userId}/mock-history")
    public ResponseEntity<?> mockHistory(@PathVariable Long userId,
                                          @RequestParam(defaultValue = "50") int percentSeen,
                                          @RequestParam(defaultValue = "10") int percentWrong) {
        // Lấy random X% câu hỏi → tạo history cho user
        List<Question> allQuestions = questionRepository.findAll();
        int seenCount = (int) (allQuestions.size() * percentSeen / 100.0);
        int wrongCount = (int) (seenCount * percentWrong / 100.0);
        
        Collections.shuffle(allQuestions);
        for (int i = 0; i < seenCount; i++) {
            Question q = allQuestions.get(i);
            UserQuestionHistory h = new UserQuestionHistory();
            h.setUser(userRepository.getReferenceById(userId));
            h.setQuestion(q);
            h.setTimesSeen(1);
            h.setTimesCorrect(i < wrongCount ? 0 : 1);
            h.setTimesWrong(i < wrongCount ? 1 : 0);
            h.setLastSeenAt(LocalDateTime.now().minusDays(i % 30));
            h.setLastWrongAt(i < wrongCount ? LocalDateTime.now().minusDays(2) : null);
            historyRepository.save(h);
        }
        
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "totalQuestions", allQuestions.size(),
            "mockedSeen", seenCount,
            "mockedWrong", wrongCount,
            "message", "Smart selection sẽ ưu tiên câu chưa gặp + câu sai"
        ));
    }

    /**
     * Refill energy → không cần chờ regen
     */
    @PostMapping("/users/{userId}/refill-energy")
    public ResponseEntity<?> refillEnergy(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setEnergy(100);  // Max energy
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("energy", 100));
    }

    /**
     * Set streak ngay
     */
    @PostMapping("/users/{userId}/set-streak")
    public ResponseEntity<?> setStreak(@PathVariable Long userId, 
                                        @RequestParam int days) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setCurrentStreak(days);
        user.setLongestStreak(Math.max(user.getLongestStreak(), days));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("streak", days));
    }

    /**
     * Trigger tier-up celebration (cho test UI)
     */
    @PostMapping("/users/{userId}/trigger-tier-up")
    public ResponseEntity<?> triggerTierUp(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        int currentTier = user.getTierLevel();
        if (currentTier >= 6) {
            return ResponseEntity.badRequest().body("Already at max tier");
        }
        
        // Set points đủ cho tier sau
        int[] thresholds = {0, 1000, 5000, 15000, 35000, 75000};
        user.setTotalPoints(thresholds[currentTier]);  // Just enough
        userRepository.save(user);
        
        // Gọi service tính lại tier (sẽ trigger tier-up event)
        tierService.recalculateTier(userId);
        
        return ResponseEntity.ok(Map.of(
            "oldTier", currentTier,
            "newTier", currentTier + 1,
            "message", "Mở app → sẽ thấy tier-up celebration"
        ));
    }

    /**
     * Preview smart question selection
     * Không tạo session, chỉ xem câu nào sẽ được chọn
     */
    @GetMapping("/users/{userId}/preview-questions")
    public ResponseEntity<?> previewQuestions(@PathVariable Long userId,
                                               @RequestParam(defaultValue = "10") int count,
                                               @RequestParam(required = false) String book,
                                               @RequestParam(defaultValue = "vi") String language) {
        QuestionFilter filter = new QuestionFilter(book, null, language);
        List<Question> questions = smartQuestionSelector.selectQuestions(userId, count, filter);
        
        // Phân tích pool
        Map<String, Long> poolBreakdown = new HashMap<>();
        Set<Long> seenIds = new HashSet<>(historyRepository.findQuestionIdsByUserId(userId));
        
        for (Question q : questions) {
            String pool = !seenIds.contains(q.getId()) ? "NEW" :
                          historyRepository.findByUserIdAndQuestionId(userId, q.getId())
                              .map(h -> h.getTimesWrong() > h.getTimesCorrect() ? "REVIEW" : "OLD")
                              .orElse("UNKNOWN");
            poolBreakdown.merge(pool, 1L, Long::sum);
        }
        
        // Phân tích difficulty
        Map<String, Long> difficultyBreakdown = questions.stream()
            .collect(Collectors.groupingBy(Question::getDifficulty, Collectors.counting()));
        
        return ResponseEntity.ok(Map.of(
            "totalSelected", questions.size(),
            "poolBreakdown", poolBreakdown,        // {NEW: 6, REVIEW: 2, OLD: 2}
            "difficultyBreakdown", difficultyBreakdown,  // {EASY: 1, MEDIUM: 4, HARD: 5}
            "questions", questions.stream().map(q -> Map.of(
                "id", q.getId(),
                "content", q.getContent().substring(0, Math.min(50, q.getContent().length())) + "...",
                "book", q.getBook(),
                "difficulty", q.getDifficulty(),
                "previouslySeen", seenIds.contains(q.getId())
            )).toList()
        ));
    }

    /**
     * Reset toàn bộ user về trạng thái mới
     */
    @PostMapping("/users/{userId}/full-reset")
    public ResponseEntity<?> fullReset(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        
        // Reset stats
        user.setTierLevel(1);
        user.setTotalPoints(0);
        user.setCurrentStreak(0);
        user.setEnergy(100);
        userRepository.save(user);
        
        // Clear history
        historyRepository.deleteByUserId(userId);
        // Clear sessions
        quizSessionRepository.deleteByUserId(userId);
        // Clear badges
        userBadgeRepository.deleteByUserId(userId);
        
        return ResponseEntity.ok(Map.of(
            "message", "User reset hoàn toàn. Như user mới đăng ký."
        ));
    }
}
```

QUAN TRỌNG: `@Profile({"dev", "staging"})` — endpoint chỉ tồn tại trong dev/staging, KHÔNG có trong production.

Verify:
```bash
# Đảm bảo SPRING_PROFILES_ACTIVE=dev khi chạy local
# Production build → các endpoints này không tồn tại
```

Commit: "feat: admin test endpoints — dev/staging only"

---

## Task 2: Frontend — Admin Test Panel UI

```typescript
// apps/web/src/pages/admin/TestPanel.tsx
// Route: /admin/test (chỉ hiện nếu env = dev/staging)

const TestPanel = () => {
  const [userId, setUserId] = useState<number>(1)  // Default test user
  const [preview, setPreview] = useState(null)
  
  // Chỉ hiện trong dev
  if (import.meta.env.PROD) return <Navigate to="/" />
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h1 className="text-xl font-bold text-yellow-400">⚠️ Test Panel — DEV ONLY</h1>
        <p className="text-sm text-yellow-300/80 mt-1">
          Panel này chỉ enable trong dev/staging. Production sẽ không có.
        </p>
      </div>

      {/* User selector */}
      <div className="bg-white/5 rounded-xl p-4">
        <label className="text-sm text-white/70">Test User ID:</label>
        <input
          type="number"
          value={userId}
          onChange={(e) => setUserId(Number(e.target.value))}
          className="ml-2 bg-white/10 px-3 py-1 rounded"
        />
      </div>

      {/* Section 1: Tier Testing */}
      <section className="bg-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">🏆 Test Tier Progression</h2>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6].map(tier => (
            <button
              key={tier}
              onClick={() => setTier(userId, tier)}
              className="bg-gold/20 text-gold border border-gold/30 rounded-lg py-3 hover:bg-gold/30"
            >
              Set Tier {tier}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => triggerTierUp(userId)}
          className="w-full bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg py-3"
        >
          🎉 Trigger Tier-Up Celebration
        </button>
        
        <p className="text-xs text-white/50 mt-2">
          Sau khi set tier → mở Home page (tab khác) → quan sát:
          XP multiplier, energy regen, locked modes, difficulty distribution.
        </p>
      </section>

      {/* Section 2: Smart Question Selection */}
      <section className="bg-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">🎯 Test Smart Question Selection</h2>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => resetHistory(userId)}
            className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg py-3"
          >
            🔄 Reset History (như user mới)
          </button>
          <button
            onClick={() => mockHistory(userId, 50, 20)}
            className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-3"
          >
            📚 Mock 50% seen, 20% wrong
          </button>
        </div>
        
        <button
          onClick={async () => {
            const result = await previewQuestions(userId, 10)
            setPreview(result)
          }}
          className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg py-3 mb-3"
        >
          👁️ Preview 10 câu sẽ chọn (không tạo session)
        </button>
        
        {preview && (
          <div className="bg-black/30 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm text-white/60">Pool breakdown:</p>
              <div className="flex gap-3 mt-1">
                <span className="text-green-400">NEW: {preview.poolBreakdown.NEW || 0}</span>
                <span className="text-yellow-400">REVIEW: {preview.poolBreakdown.REVIEW || 0}</span>
                <span className="text-gray-400">OLD: {preview.poolBreakdown.OLD || 0}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-white/60">Difficulty breakdown:</p>
              <div className="flex gap-3 mt-1">
                <span className="text-green-400">EASY: {preview.difficultyBreakdown.EASY || 0}</span>
                <span className="text-yellow-400">MEDIUM: {preview.difficultyBreakdown.MEDIUM || 0}</span>
                <span className="text-red-400">HARD: {preview.difficultyBreakdown.HARD || 0}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-white/60">Questions:</p>
              <ul className="text-xs text-white/70 mt-1 space-y-1 max-h-40 overflow-y-auto">
                {preview.questions.map(q => (
                  <li key={q.id}>
                    [{q.difficulty}] {q.book} — {q.content}
                    {q.previouslySeen && <span className="text-yellow-400 ml-2">(seen)</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <p className="text-xs text-white/50 mt-2">
          Verify: Pool breakdown phải có ~60% NEW (nếu chưa gặp nhiều).
          Difficulty phù hợp với tier hiện tại.
        </p>
      </section>

      {/* Section 3: Other utilities */}
      <section className="bg-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">🛠️ Utilities</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => refillEnergy(userId)} className="utility-btn">
            ⚡ Refill Energy
          </button>
          <button onClick={() => setStreak(userId, 30)} className="utility-btn">
            🔥 Set Streak 30 days
          </button>
          <button onClick={() => setStreak(userId, 100)} className="utility-btn">
            💎 Set Streak 100 days
          </button>
          <button 
            onClick={() => fullReset(userId)} 
            className="utility-btn bg-red-500/20 text-red-400 border-red-500/30"
          >
            ☢️ Full Reset
          </button>
        </div>
      </section>

      {/* Section 4: Test Scenarios */}
      <section className="bg-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">📋 Test Scenarios</h2>
        
        <div className="space-y-3 text-sm text-white/80">
          <div className="border-l-2 border-cyan-500 pl-3">
            <p className="font-semibold">Scenario 1: New user experience</p>
            <p className="text-white/60 text-xs">
              1. Full Reset → Set Tier 1
              2. Mở Home → verify locked modes, easy questions
              3. Chơi 5 câu → verify difficulty distribution
            </p>
          </div>
          
          <div className="border-l-2 border-green-500 pl-3">
            <p className="font-semibold">Scenario 2: Tier-up flow</p>
            <p className="text-white/60 text-xs">
              1. Set Tier 2
              2. Trigger Tier-Up → verify celebration animation
              3. Verify rewards (XP, energy, unlocks)
            </p>
          </div>
          
          <div className="border-l-2 border-yellow-500 pl-3">
            <p className="font-semibold">Scenario 3: Smart selection</p>
            <p className="text-white/60 text-xs">
              1. Mock 50% history
              2. Preview questions → verify ~60% NEW pool
              3. Chơi quiz → confirm không gặp lại câu vừa chơi đúng
            </p>
          </div>
          
          <div className="border-l-2 border-red-500 pl-3">
            <p className="font-semibold">Scenario 4: High tier difficulty</p>
            <p className="text-white/60 text-xs">
              1. Set Tier 6
              2. Preview 20 questions → verify ~60% HARD
              3. Chơi quiz → verify timer 18s, no easy questions
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
```

### Service helper:

```typescript
// src/api/testApi.ts
export const setTier = (userId: number, tier: number) => 
  apiClient.post(`/admin/test/users/${userId}/set-tier?tierLevel=${tier}`)

export const resetHistory = (userId: number) =>
  apiClient.post(`/admin/test/users/${userId}/reset-history`)

export const mockHistory = (userId: number, percentSeen: number, percentWrong: number) =>
  apiClient.post(`/admin/test/users/${userId}/mock-history?percentSeen=${percentSeen}&percentWrong=${percentWrong}`)

export const previewQuestions = (userId: number, count: number) =>
  apiClient.get(`/admin/test/users/${userId}/preview-questions?count=${count}`)
    .then(r => r.data)

export const triggerTierUp = (userId: number) =>
  apiClient.post(`/admin/test/users/${userId}/trigger-tier-up`)

export const refillEnergy = (userId: number) =>
  apiClient.post(`/admin/test/users/${userId}/refill-energy`)

export const setStreak = (userId: number, days: number) =>
  apiClient.post(`/admin/test/users/${userId}/set-streak?days=${days}`)

export const fullReset = (userId: number) =>
  apiClient.post(`/admin/test/users/${userId}/full-reset`)
```

Commit: "feat: admin test panel UI for tier progression testing"

---

## Task 3: Test Checklist

Sau khi có Test Panel, manually verify từng feature:

```markdown
## Tier Progression Verification Checklist

### 1. Smart Question Selection
- [ ] Reset history → preview → 100% NEW pool
- [ ] Mock 50% seen → preview → ~60% NEW + ~40% mix
- [ ] Mock 50% seen + 20% wrong → preview → có REVIEW pool
- [ ] Chơi 10 câu → preview lại → các câu vừa đúng KHÔNG xuất hiện
- [ ] Daily Challenge vẫn random (không dùng smart selection)

### 2. Difficulty Scaling
- [ ] Set Tier 1 → preview 20 → ~14 EASY, ~5 MEDIUM, ~1 HARD
- [ ] Set Tier 3 → preview 20 → ~7 EASY, ~9 MEDIUM, ~4 HARD
- [ ] Set Tier 6 → preview 20 → ~1 EASY, ~7 MEDIUM, ~12 HARD

### 3. Timer Scaling
- [ ] Tier 1 → tạo session → timer = 30s
- [ ] Tier 3 → tạo session → timer = 25s
- [ ] Tier 6 → tạo session → timer = 18s

### 4. XP Multiplier
- [ ] Tier 1 → trả lời đúng → XP base
- [ ] Tier 6 → trả lời đúng → XP = base × 2.0
- [ ] Quan sát XP trong Profile

### 5. Energy Regen
- [ ] Tier 1 → check API /me → energyRegenPerHour = 20
- [ ] Tier 6 → check API /me → energyRegenPerHour = 35

### 6. Game Mode Unlocks
- [ ] Tier 1 → Home → Battle Royale có lock icon
- [ ] Tier 1 → cố tạo Battle Royale → 403 Forbidden
- [ ] Tier 3 → Battle Royale unlocked
- [ ] Tier 6 → tất cả modes unlocked

### 7. Tier-Up Celebration
- [ ] Set Tier 1 → Trigger Tier-Up
- [ ] Mở Home → thấy modal celebration
- [ ] Verify rewards hiện đúng
- [ ] Sound + animation chạy
```

Commit: "docs: tier progression manual test checklist"

---

## Task 4: Tạo seed data cho test scenarios

```sql
-- V{next}__test_users.sql (CHỈ CHẠY trong dev)

-- Test users với các tier khác nhau
INSERT INTO users (email, name, tier_level, total_points, current_streak, energy)
VALUES
  ('test1@dev.local', 'Test User Tier 1', 1, 0, 0, 100),
  ('test2@dev.local', 'Test User Tier 2', 2, 1500, 5, 100),
  ('test3@dev.local', 'Test User Tier 3', 3, 8000, 15, 100),
  ('test4@dev.local', 'Test User Tier 4', 4, 20000, 30, 100),
  ('test5@dev.local', 'Test User Tier 5', 5, 50000, 60, 100),
  ('test6@dev.local', 'Test User Tier 6', 6, 100000, 100, 100);
```

Login từng test user → trải nghiệm tier khác nhau ngay → không cần grind.

Commit: "feat: seed test users for tier verification"

---

## Thứ tự:
1. Task 1: Backend test endpoints
2. Task 2: Frontend test panel UI
3. Task 4: Seed test users
4. Task 3: Manual checklist run-through

Total effort: 1 ngày để build panel, 2-3 giờ để verify hết checklist.
```
