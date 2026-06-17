# 2026-06-17 — Tablet responsive (P0 → P2)

> **Source**: [TABLET_RESPONSIVE_AUDIT.md](../../audit/TABLET_RESPONSIVE_AUDIT.md). User: làm P0→P2.
> **Scope**: web, viewport 768 + 1024. Chỉ chỉnh breakpoint/grid/max-w — KHÔNG đụng logic (trừ RoomLobby isMobile, cẩn thận). 1 wave = 1 commit.
> **Prefix**: `TBL`.

### P0 — Needs work (mobile layout on tablet)
- TBL-1 Achievements: 12-col split `lg`→`md` (`Achievements.tsx:216,218,344`)
- TBL-2 QuizSetList: sidebar/toolbar `lg`→`md`, cards `md:grid-cols-2 lg:grid-cols-3` (`group/QuizSetList.tsx`)
- TBL-3 QuizSetDetail: sidebar/desktop branch `lg`→`md` (`group/QuizSetDetail.tsx`)
- TBL-4 QuizSetEditor/PersonalQuizSetEditor: collapse media `768px`→`767px` (`QuizSetEditor.tsx`, `MetadataAccordion.tsx`, `QuestionEditor.tsx`)
- TBL-5 RoomLobby: dock 1 sidebar @ md + isMobile `<1024`→`<768` (CẨN THẬN, realtime) (`RoomLobby.tsx`)
- TBL-6 RoomQuiz/Shell: 3-col add `md` tier (`room/RoomQuizShell.tsx`)

### P1 — Fair, high value
- TBL-7 CreateRoom: split `lg`→`md` + PreviewPanel `md:sticky` (`CreateRoom.tsx`, `create-room/PreviewPanel.tsx`)
- TBL-8 GroupAnalytics: KPI/actions `lg:grid-cols-4`→`md:` (`GroupAnalytics.tsx:282,441`)
- TBL-9 Login + Register: hero `md:w-[55%]/45%` + `md:px-12` (`Login.tsx`, `Register.tsx`)
- TBL-10 BasicQuiz: `max-w-4xl` + answers `md:grid-cols-2` (`BasicQuiz.tsx:204,237`)
- TBL-11 GroupDetail: member table `sm`→`md` (giữ compact rows @768) (`GroupDetail.tsx`)
- TBL-12 Journey/Cosmetics/MySets/Tournaments: thêm grid tier + nới max-w

### P2 — Fair, low priority (nới max-w / tier)
- TBL-13 RankedQuizResults `md:max-w-xl`; Practice filter `lg`→`md`; Weekly/Mystery/Speed `lg:max-w-3xl`; ScheduledQuizCreate/Detail; TournamentDetail info `lg:grid-cols-4`; RoomQuizHost 2-col `md`; RankedActionFooter bỏ `md:left-72`

Status: [ ] in progress · Test: build mỗi wave + Tầng 3 cuối · **Spec impact** [x] None · **Spec strategy** [x] (c)
