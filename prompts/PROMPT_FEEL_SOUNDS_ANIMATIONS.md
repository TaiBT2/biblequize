# #1 Sound Effects + Haptics + Animations — "Feel" cho Quiz

> Thêm cảm xúc cho mỗi interaction. Đúng = phấn khích, sai = tiếc, streak = on fire.
> Paste vào Claude Code.

---

```
Thêm sound effects, haptic feedback, và micro-animations cho BibleQuiz.
Hiện tại app trả lời đúng/sai chỉ có text — không có cảm xúc.

TRƯỚC KHI CODE: đọc Quiz.tsx, QuizResults.tsx, Review.tsx hiện tại. Chia tasks vào TODO.md.

## Task 1: Sound System Setup

Tạo sound manager dùng cho toàn app:

```typescript
// src/services/soundManager.ts (web) hoặc src/utils/sound.ts

// Web: dùng Web Audio API hoặc howler.js
// Mobile: dùng expo-av hoặc react-native-sound

// Sound files cần tạo/download (free sfx):
// Đặt trong: public/sounds/ (web) hoặc assets/sounds/ (RN)

const SOUNDS = {
  // Quiz gameplay
  correctAnswer: 'correct.mp3',        // Ngắn, vui, "ding!" ~0.3s
  wrongAnswer: 'wrong.mp3',            // Ngắn, buồn, "buzzer" ~0.3s
  timerTick: 'tick.mp3',               // Tick nhẹ, dùng khi còn <5s
  timerWarning: 'warning.mp3',         // Urgent tick khi còn <3s
  
  // Streak & combo
  combo3: 'combo3.mp3',                // "Fire!" khi streak 3
  combo5: 'combo5.mp3',                // "Amazing!" khi streak 5
  combo10: 'combo10.mp3',              // Epic sound khi streak 10
  
  // Results
  quizComplete: 'complete.mp3',        // Fanfare ngắn ~1s
  perfectScore: 'perfect.mp3',         // Celebration dài ~2s
  newRecord: 'record.mp3',             // Achievement unlock
  
  // Tier & achievements
  tierUp: 'tier-up.mp3',               // Level up fanfare ~2s
  badgeUnlock: 'badge.mp3',            // Badge unlock ~1s
  
  // Navigation
  buttonTap: 'tap.mp3',               // Subtle tap ~0.1s
  
  // Daily
  dailyReady: 'daily-ready.mp3',      // "Thử thách sẵn sàng!"
}

class SoundManager {
  private enabled: boolean = true
  private volume: number = 0.7
  private audioCache: Map<string, HTMLAudioElement> = new Map()

  // Preload sounds khi app start
  async preload() {
    for (const [key, file] of Object.entries(SOUNDS)) {
      const audio = new Audio(`/sounds/${file}`)
      audio.preload = 'auto'
      audio.volume = this.volume
      this.audioCache.set(key, audio)
    }
  }

  play(sound: keyof typeof SOUNDS) {
    if (!this.enabled) return
    const audio = this.audioCache.get(sound)
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(() => {}) // Ignore autoplay errors
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    // Lưu vào localStorage/AsyncStorage
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.audioCache.forEach(audio => audio.volume = this.volume)
  }
}

export const soundManager = new SoundManager()
```

Tạo sound files:
- Nếu không có sound files → tạo bằng Web Audio API (generate sine waves, beeps)
- Hoặc dùng free sounds từ freesound.org, mixkit.co
- Mỗi file < 50KB, format MP3
- Tổng: ~15 files × 30KB = ~450KB

```typescript
// Tạo placeholder sounds bằng Web Audio API (nếu không có files)
// src/utils/generateSounds.ts
export const generateBeep = (frequency: number, duration: number, type: OscillatorType = 'sine'): string => {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
  // Return base64 or blob URL
}

// correct: 880Hz sine, 0.15s (high pitched, happy)
// wrong: 220Hz square, 0.3s (low pitched, buzzer)
// combo: ascending tones 440→880→1760, 0.3s
// tierUp: chord C-E-G ascending, 1.5s
```

Commit: "feat: sound manager + placeholder sound effects"

---

## Task 2: Haptic Feedback (Mobile)

```typescript
// src/utils/haptics.ts
// Web: navigator.vibrate() (limited support)
// Mobile: expo-haptics hoặc react-native-haptic-feedback

import * as Haptics from 'expo-haptics'  // Expo
// hoặc: import ReactNativeHapticFeedback from 'react-native-haptic-feedback'

export const haptic = {
  // Trả lời đúng — light tap, vui
  correct: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  
  // Trả lời sai — heavy thud, tiếc
  wrong: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  
  // Chọn đáp án — subtle selection
  select: () => Haptics.selectionAsync(),
  
  // Streak combo — medium impact
  combo: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  
  // Tier up — notification success
  tierUp: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  
  // Timer warning — warning notification
  timerWarning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  
  // Button tap — light
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
}

// Web fallback (limited):
export const hapticWeb = {
  correct: () => navigator.vibrate?.(50),
  wrong: () => navigator.vibrate?.([100, 50, 100]),
  combo: () => navigator.vibrate?.([50, 30, 50, 30, 50]),
  tierUp: () => navigator.vibrate?.([100, 50, 100, 50, 200]),
}
```

Commit: "feat: haptic feedback system"

---

## Task 3: Quiz Answer Animations

Khi trả lời đúng/sai — feedback visual ngay lập tức:

```typescript
// Trong Quiz.tsx hoặc QuizScreen.tsx

const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle')
const [comboCount, setComboCount] = useState(0)
const [showCombo, setShowCombo] = useState(false)

const handleAnswer = (answerId: string) => {
  const isCorrect = answerId === question.correctAnswer
  
  if (isCorrect) {
    setAnswerState('correct')
    soundManager.play('correctAnswer')
    haptic.correct()
    
    // Combo tracking
    const newCombo = comboCount + 1
    setComboCount(newCombo)
    
    if (newCombo === 3) {
      soundManager.play('combo3')
      haptic.combo()
      setShowCombo(true)
      setTimeout(() => setShowCombo(false), 1500)
    } else if (newCombo === 5) {
      soundManager.play('combo5')
      haptic.combo()
    } else if (newCombo === 10) {
      soundManager.play('combo10')
      haptic.combo()
    }
  } else {
    setAnswerState('wrong')
    soundManager.play('wrongAnswer')
    haptic.wrong()
    setComboCount(0)
  }
  
  // Reset sau 800ms → next question
  setTimeout(() => {
    setAnswerState('idle')
    nextQuestion()
  }, 800)
}
```

### Answer button animations:

```css
/* Web — CSS animations */

/* Đúng: button flash xanh + scale up nhẹ */
.answer-correct {
  animation: correctPulse 0.5s ease-out;
  background: #22c55e !important;
  color: white !important;
}

@keyframes correctPulse {
  0% { transform: scale(1); }
  30% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Sai: button flash đỏ + shake */
.answer-wrong {
  animation: wrongShake 0.4s ease-out;
  background: #ef4444 !important;
  color: white !important;
}

@keyframes wrongShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* Combo banner */
.combo-banner {
  animation: comboSlideIn 0.3s ease-out, comboPulse 0.5s ease-in-out 0.3s;
}

@keyframes comboSlideIn {
  0% { transform: translateY(-50px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

/* Score increment animation */
.score-pop {
  animation: scorePop 0.6s ease-out;
}

@keyframes scorePop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); color: #e8a832; }
  100% { transform: scale(1); }
}
```

### Combo banner UI:

```tsx
{/* Hiện khi streak 3, 5, 10 */}
{showCombo && (
  <div className="combo-banner fixed top-20 left-1/2 -translate-x-1/2 z-50
    bg-gradient-to-r from-orange-500 to-red-500 text-white 
    px-6 py-3 rounded-full font-bold text-lg shadow-lg">
    🔥 {comboCount}x COMBO!
  </div>
)}
```

Commit: "feat: quiz answer animations + combo system"

---

## Task 4: Timer Animations

```css
/* Timer circle — pulse khi còn ít thời gian */

/* Bình thường: circle xoay smooth */
.timer-circle { transition: stroke-dashoffset 1s linear; }

/* Còn <5s: đổi màu vàng + pulse */
.timer-warning {
  stroke: #f59e0b !important;
  animation: timerPulse 1s ease-in-out infinite;
}

/* Còn <3s: đổi đỏ + pulse nhanh + scale */
.timer-critical {
  stroke: #ef4444 !important;
  animation: timerCritical 0.5s ease-in-out infinite;
}

@keyframes timerPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes timerCritical {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}
```

Thêm sound tick khi <5s:

```typescript
useEffect(() => {
  if (timeLeft <= 5 && timeLeft > 0) {
    soundManager.play('timerTick')
    if (timeLeft <= 3) {
      haptic.timerWarning()
      soundManager.play('timerWarning')
    }
  }
}, [timeLeft])
```

Commit: "feat: timer warning animations + sounds"

---

## Task 5: Quiz Results Celebrations

```typescript
// QuizResults.tsx

const accuracy = correctCount / totalCount

useEffect(() => {
  if (accuracy === 1.0) {
    // Perfect score!
    soundManager.play('perfectScore')
    haptic.tierUp()
    setShowConfetti(true)
  } else if (accuracy >= 0.8) {
    soundManager.play('quizComplete')
    haptic.correct()
  } else {
    soundManager.play('quizComplete')
  }
}, [])
```

### Confetti animation (perfect score):

```tsx
// Dùng canvas-confetti (web) hoặc react-native-confetti-cannon (RN)
// npm install canvas-confetti

import confetti from 'canvas-confetti'

// Perfect score → confetti burst
if (accuracy === 1.0) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#e8a832', '#22c55e', '#3b82f6', '#a855f7'],
  })
}
```

### Score reveal animation:

```css
/* Score number counting up from 0 → actual score */
.score-reveal {
  animation: scoreCountUp 1.5s ease-out;
}

/* Grade text entrance */
.grade-text {
  animation: gradeReveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes gradeReveal {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* XP gained — float up */
.xp-gained {
  animation: xpFloat 1s ease-out;
}

@keyframes xpFloat {
  0% { transform: translateY(20px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(-10px); opacity: 0.8; }
}
```

### Grade text theo accuracy:

```typescript
const getGrade = (accuracy: number) => {
  if (accuracy === 1.0) return { text: 'HOÀN HẢO!', emoji: '👑', color: 'text-yellow-400' }
  if (accuracy >= 0.9) return { text: 'Xuất sắc!', emoji: '⭐', color: 'text-yellow-400' }
  if (accuracy >= 0.7) return { text: 'Tốt lắm!', emoji: '💪', color: 'text-green-400' }
  if (accuracy >= 0.5) return { text: 'Khá tốt!', emoji: '📖', color: 'text-blue-400' }
  return { text: 'Cố gắng thêm!', emoji: '🙏', color: 'text-gray-400' }
}
```

Commit: "feat: quiz results celebrations + confetti + score animation"

---

## Task 6: Tier Up Celebration

Khi user đạt tier mới → full screen celebration:

```tsx
// TierUpModal.tsx — full screen overlay

const TierUpModal = ({ newTier, onClose }) => {
  useEffect(() => {
    soundManager.play('tierUp')
    haptic.tierUp()
  }, [])
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="text-center tier-up-animation">
        {/* Tier icon — animate scale in */}
        <div className="tier-icon-reveal">
          {newTier.icon} {/* 🔥 hoặc ⭐ etc */}
        </div>
        
        {/* "Lên tier!" text */}
        <h1 className="text-3xl font-bold text-gold mt-4 grade-text">
          Chúc mừng!
        </h1>
        
        {/* Tier name */}
        <h2 className="text-2xl text-white mt-2">
          Bạn đã đạt {newTier.name}!
        </h2>
        
        {/* New rewards */}
        <div className="mt-6 space-y-2">
          <p className="text-green-400">🎁 {newTier.xpMultiplier}x XP</p>
          <p className="text-green-400">⚡ {newTier.energyRegen} energy/giờ</p>
          {newTier.unlockedMode && (
            <p className="text-yellow-400">🔓 Mở khóa: {newTier.unlockedMode}!</p>
          )}
        </div>
        
        {/* Share + Continue */}
        <button onClick={onClose} className="gold-button mt-8">
          Tiếp tục hành trình
        </button>
      </div>
    </div>
  )
}
```

Commit: "feat: tier up full screen celebration"

---

## Task 7: Settings — Sound & Haptics toggle

```tsx
// Settings page thêm:

<div>
  <label>Âm thanh</label>
  <input type="range" min="0" max="100" value={volume} 
    onChange={(e) => {
      setVolume(e.target.value)
      soundManager.setVolume(e.target.value / 100)
    }} 
  />
</div>

<div>
  <label>Rung phản hồi</label>
  <Switch checked={hapticsEnabled} onChange={setHapticsEnabled} />
</div>
```

Commit: "feat: sound + haptics settings toggle"

---

## Task 8: Tests

```typescript
// Sound manager tests
test('plays correct sound on right answer', () => {
  const spy = jest.spyOn(soundManager, 'play')
  handleAnswer(correctAnswerId)
  expect(spy).toHaveBeenCalledWith('correctAnswer')
})

test('plays wrong sound on wrong answer', () => {
  const spy = jest.spyOn(soundManager, 'play')
  handleAnswer(wrongAnswerId)
  expect(spy).toHaveBeenCalledWith('wrongAnswer')
})

test('plays combo sound at streak 3', () => {
  const spy = jest.spyOn(soundManager, 'play')
  answerCorrectly(3) // helper: answer 3 correct in a row
  expect(spy).toHaveBeenCalledWith('combo3')
})

test('does not play sound when disabled', () => {
  soundManager.setEnabled(false)
  const spy = jest.spyOn(soundManager, 'play')
  handleAnswer(correctAnswerId)
  // play called but should not actually play
})

test('confetti shown on perfect score', () => {
  render(<QuizResults accuracy={1.0} />)
  expect(screen.getByTestId('confetti')).toBeTruthy()
})

test('no confetti on non-perfect score', () => {
  render(<QuizResults accuracy={0.8} />)
  expect(screen.queryByTestId('confetti')).toBeNull()
})

// Snapshot tests for animations states
test('answer-correct state matches snapshot', () => {
  const tree = render(<AnswerButton state="correct" />).toJSON()
  expect(tree).toMatchSnapshot()
})
```

Commit: "test: sound + haptics + animation tests"

---

## Thứ tự:
1. Task 1: Sound system setup + placeholder sounds
2. Task 2: Haptic feedback system
3. Task 3: Answer animations + combo
4. Task 4: Timer warning animations
5. Task 5: Results celebrations + confetti
6. Task 6: Tier up celebration
7. Task 7: Settings toggle
8. Task 8: Tests

Total effort: 2-3 ngày. Impact: ⭐⭐⭐⭐⭐
```
