# 2026-05-20 — Mobile RankedResultScreen redesign theo mockup (3 state A/B/C)

> **Source**: user request — "đọc mockup_ranked_result.html và tôi muốn redesign lại màn rank result mobile lại giống mockup".
> **Scope**: New `RankedResultScreen.tsx` + branch routing trong QuizScreen + pass snapshot trong RankedScreen + nav register. ~600 LOC.

## Mockup (`docs/mockups/mockup_ranked_result.html`) → 3 state variants

Body chung 5 blocks (XP hero / tier-row / 3-stat grid / season rank / review wrong). Chỉ header + sticky CTAs swap theo context. Priority: **B > C > A** (tier-up beats OOE).

| State | Trigger | Header | XP detail | Bottom block | Sticky CTAs |
|---|---|---|---|---|---|
| **A · Normal** | Default | Eyebrow "TRẬN ĐÃ XONG" + italic gold title ("Vững vàng!"/"Đang tiến bộ"/"Tiếp tục bền bỉ" theo accuracy) + sub "Bạn đúng X/Y câu trong M:SS" | "Tính theo thời gian & độ khó mỗi câu đúng" | Review wrong (top 2 + "Xem chi tiết N câu") | Primary "↻ Chơi trận khác" + 2 secondary "🏠 Trang chủ / 📊 Bảng xếp hạng" |
| **B · Promo (tier-up)** | `currentTier.level > previousTier.level` | Gold-bordered banner: eyebrow "LÊN HẠNG" + crown icon circle + italic gold tier-name + sub "Bạn vừa lên hạng từ {oldTier}" | "Vượt ngưỡng — chính thức lên hạng!" | Inline verse "Rô-ma 12:12" thay review wrong | Primary "🏅 Xem đặc quyền hạng mới" + "↻ Chơi tiếp / 🏠 Trang chủ" |
| **C · OOE** | `livesRemaining <= 0` | Border banner: bolt icon + "Hết năng lượng hôm nay" + sub "Bạn đã dùng hết 100 năng lượng..." + timer chip | Default | Review wrong (title "Trong khi chờ") | Disabled "⚡ Hết năng lượng — chờ reset" + "📚 Luyện tập / 🏠 Trang chủ" |

## Implementation

### M8-1 RankedResultScreen.tsx (NEW, ~600 LOC)
- Reads stats từ route param (totalScore, correctAnswers, totalQuestions, questions, userAnswers, totalTime, previousTotalPoints)
- Queries `['tier-progress']` (fresh post-quiz), `['ranked-status']` (livesRemaining, seasonRank, seasonPoints), `['season', 'active']`
- Tier-up detection: `getTierByPoints(previousTotalPoints).level vs getTierByPoints(currentTotalPoints).level`
- Wrong-question derivation client-side từ stats.questions + stats.userAnswers (no extra fetch)
- Review modal: `<Modal animationType="fade">` với scroll body — list từng wrong question + correct answer green border + user's wrong pick red border + explanation panel
- CTA navigation handlers: `onBackToHome` = popToTop, `onPlayAgain` = navigate('Ranked'), state B "Xem đặc quyền" navigates to Help, state C "Luyện tập" navigates to PracticeSelect

### M8-2 Branch routing trong QuizScreen.tsx
- Track `quizStartTime = useState(Date.now())` để compute `totalTime` cho display "M phút SS giây"
- Forward `previousTotalPoints` từ route param sang stats
- Branch destination: `isDailyMode → DailyResults`, `isRankedMode → RankedResults`, else → `QuizResults`

### M8-3 RankedScreen.tsx
- handleStart pass `previousTotalPoints: totalPoints` (snapshot từ tier-progress query) qua navigation state

### M8-4 Navigation
- Register `RankedResults` trong `MainTabNavigator.tsx` QuizStack
- Add `RankedResults: { stats: any }` to `navigation/types.ts`

### Tasks

- M8-1 Create RankedResultScreen với 3 states + review modal
  - Status: [x] DONE (tsc + 33 jest pass)
  - Files: `apps/mobile/src/screens/quiz/RankedResultScreen.tsx`
- M8-2 QuizScreen branch routing + track quizStartTime + forward previousTotalPoints
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/quiz/QuizScreen.tsx`
- M8-3 RankedScreen pass previousTotalPoints
  - Status: [x] DONE
  - Files: `apps/mobile/src/screens/quiz/RankedScreen.tsx`
- M8-4 Navigation register + types
  - Status: [x] DONE
  - Files: `apps/mobile/src/navigation/MainTabNavigator.tsx`, `apps/mobile/src/navigation/types.ts`

**Spec impact**: [x] None (UI redesign, không thay đổi behavior)
**Spec strategy**: [x] (c) `[no-spec-impact]`

## Out of scope

- Live HH:MM:SS countdown timer (web có useEffect interval) — mobile dùng static "Phục hồi sau khi reset" caption.
- Practice + Mystery + Speed modes vẫn dùng QuizResultsScreen (không thay đổi).
- Backdrop blur cho result card (RN Android chưa stable).
- Material Symbols icons → mobile dùng emoji (🏅 ⚡ 📚 🏠 ↻ 🏆) cho cross-platform.
- Animation transitions on progress bar width — defer.
