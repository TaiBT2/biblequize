# 2026-05-20 — Ranked result screen redesign (3 state variants)

> **Source**: User mockup `docs/mockups/mockup_ranked_result.html` (655 LOC) — kết quả Đấu Hạng redesign với 3 state: A normal · B promo (lên hạng) · C hết năng lượng.
> **Scope**: **Ranked-only**. Practice / Mystery / Speed giữ nguyên `QuizResults.tsx` hiện tại. New component `RankedQuizResults.tsx`. Quiz.tsx branch render theo `isRanked`.
> **Code review findings**:
> - BE tier-up detection có sẵn (`RankedController:533-545`) nhưng KHÔNG return flag trong response → FE workaround dùng `previousTierLevel` via navigation state + re-fetch `/api/me/tier-progress` sau quiz.
> - `stats.questions[]` + `stats.userAnswers[]` đã pass qua → FE derive wrong list client-side.
> - `/help#tiers` exists (TierPerksTeaser dùng) → State B CTA "Xem đặc quyền hạng mới".
> - `/practice` route exists → State C secondary CTA "Luyện tập (miễn phí)".

## State decision matrix

| State | Trigger | Header | Primary CTA | Secondary CTAs |
|---|---|---|---|---|
| **A · Normal** | Default | "TRẬN ĐÃ XONG / *Tiếp tục bền bỉ*" + sub | ↻ Chơi trận khác | Trang chủ · BXH |
| **B · Promo** | `newTierLevel > previousTierLevel` | Gold promo banner: LÊN HẠNG + new tier name + verse | 🏅 Xem đặc quyền hạng mới | ↻ Chơi tiếp · Chia sẻ |
| **C · OOE** | `livesRemaining <= 0` after quiz | OOE banner: ⚡ "Hết năng lượng" + countdown pill | ⚡ Hết năng lượng — chờ HH:MM:SS (disabled) | 📚 Luyện tập · Trang chủ |

Priority: B beats C (lên hạng > hết năng lượng).

### Tasks

- RANKED-RESULT-1 Ranked.tsx: pass `previousTierLevel` + `previousTotalPoints` qua navigate state
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/Ranked.tsx`
  - State key: `previousTier: { level, totalPoints, nextTierPoints }`. Read tier-progress đã có trong `tierData`.

- RANKED-RESULT-2 New component `RankedQuizResults.tsx` per mockup
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/RankedQuizResults.tsx` (new)
  - Props: `stats` (same shape current `QuizResults` props) + `previousTier` + `livesRemaining` + `resetTimeLeft` + `sessionId` + `onPlayAgain` + `onBackToHome`.
  - Internal: fetch `/api/me/tier-progress` via TanStack Query để biết new tier level + total points + tier name. Compare với `previousTier` → derive state A/B/C.
  - Render: layout per mockup — top context bar / hero XP / tier progress row / 3-stat grid / season rank card / review wrong list (top 2 + link) / sticky CTAs (gradient fade absolute bottom).
  - Bottom CTAs render `<MobileBottomTabs />` để giữ nav (giống fix vừa làm cho QuizResults).
  - i18n: keys mới trong `ranked.result.*` (eyebrow, title variants, CTA labels, etc.). Cả vi + en.

- RANKED-RESULT-3 Quiz.tsx branch: render RankedQuizResults khi `isRanked`
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/Quiz.tsx`
  - Trong block `isQuizCompleted` (line 555+): nếu `settings?.isRanked === true` → render `<RankedQuizResults>`, else giữ `<QuizResults>`.
  - Pass `previousTier` từ location.state + `serverEnergy` (đã track) + `resetTimeLeft` (cần fetch từ ranked-status hoặc tính tại đây).

- RANKED-RESULT-4 Test smoke + commit
  - Quiz.test.tsx mock không depend RankedQuizResults — should still pass.
  - tsc clean.
  - Manual smoke 3 state trên browser.

### Out of scope

- BE tier-up flag in submit response — FE workaround đủ dùng. Defer task riêng nếu cần realtime hiển thị tier-up DURING quiz.
- "Chia sẻ" CTA State B — hiện chưa có share infrastructure cho Ranked result (Daily có ShareCard). Tạm wire ra `/help#tiers` hoặc share via Web Share API browser. Defer nếu cần dedicated share image.
- Tier-up animation (confetti, etc.) — keep static for now.
