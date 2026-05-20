# 2026-05-20 — Mobile Quiz: unified scroll cho question + answers (fix ngột ngạt)

> **Source**: user report — kéo lên trong Quiz screen chỉ scroll được phần answers, question card cố định ở trên → khi result bar appear, answers area bị nén ngột ngạt.
> **Scope**: `apps/mobile/src/screens/quiz/QuizScreen.tsx`. ~10 LOC.

## Root cause

Layout cũ ([QuizScreen.tsx:266-296](apps/mobile/src/screens/quiz/QuizScreen.tsx#L266-L296)):
```
<View container flex:1>
  <Header>           ← fixed
  <Segments>         ← fixed
  <Timer>            ← fixed
  <QuestionCard>     ← fixed
  <ScrollView flex:1>← chỉ phần này scroll
    <Answers>
  </ScrollView>
  {showResult && <ResultBar>}
</View>
```

ScrollView wrap chỉ answers. Khi result bar render (showResult=true + isCorrect !== null), nó chiếm ~110px ở dưới → ScrollView area co lại → 4 answer buttons + selected/correct/wrong reveal + faded state → squeezed.

User cũng không thể scroll lên xem lại question dài (e.g. câu trắc nghiệm Bible reference dài 2-3 dòng), vì question card cố định ngoài ScrollView.

## Fix

Wrap Timer + QuestionCard + Answers trong **outer ScrollView**. Header + Segments giữ fixed top. Result bar (+ explanation pill) giữ sibling sau ScrollView → tự động ở bottom của visible area khi render.

```
<View container flex:1>
  <Header>                          ← fixed top
  <Segments>                        ← fixed top
  <ScrollView contentScroll flex:1> ← user scroll được toàn bộ content
    <Timer>
    <QuestionCard>
    <Answers (View, không phải ScrollView)>
  </ScrollView>
  {showResult && <ResultBar>}       ← sibling, pin bottom
</View>
```

Styles changes: `answersScroll` → `contentScroll`; thêm `contentScrollInner` (paddingBottom). `answers` đổi từ contentContainerStyle sang View style + `marginTop` để space với question card.

### Tasks

- M6-1 QuizScreen layout — outer ScrollView wrap timer + question + answers thay vì chỉ answers
  - Status: [x] DONE (tsc + 33 jest pass)
  - Files: `apps/mobile/src/screens/quiz/QuizScreen.tsx`
  - Test: tsc clean, jest 33/33, manual verify trên Expo cần check: (a) scroll mượt cả question + answers, (b) result bar pin bottom khi visible, (c) explanation pill above result bar, (d) answer D không bị che bởi result bar
  - **Spec impact**: [x] None (UX polish)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`

## Out of scope

- Header/Segments scroll-with-content: hiện fixed để Close button luôn reachable. Nếu muốn maximal scroll area cho question dài, có thể move segments vào ScrollView — defer pending user feedback.
- Timer (Countdown circle) inside scroll: hiện cũng inside ScrollView. Có thể fix top nếu user prefer always-visible countdown — defer.
