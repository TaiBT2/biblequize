# Mobile Responsive Audit — Web (non-admin)

> Date: 2026-06-17 · Scope: all routed non-admin pages (`apps/web/src/pages`, excl. `admin/`).
> Target viewport: phone ~375–414px. Tailwind `sm`=640 `md`=768 `lg`=1024.
> Method: 7 parallel read-only audits, shared rubric (breakpoints / horizontal-overflow / touch targets / typography / fixed-overlay / media).

## Summary

| Rating | Count | Pages |
|---|---|---|
| **Good** | 32 | majority — solid mobile-first |
| **Fair** | 8 | Home, Achievements, OnboardingTryQuiz, LandingPage, Review, RoomAnalytics, QuizSetEditor, ScheduledQuizDetail |
| **Needs work** | 6 | Leaderboard, Onboarding, DailyChallenge, GroupDetail, TournamentDetail, TournamentMatch |
| **Poor** | 0 | — |

**Overall**: the Khung Sáng migration left the app broadly mobile-first (base `grid-cols-1`, `lg:`-gated desktop chrome, global bottom-tab spacer). Real breakage is concentrated in ~6 pages. No page is unusable.

### Cross-cutting context
- `AppLayout` gives `main` `px-4 md:px-8 py-6 md:py-10` and renders `MobileBottomTabs` (`md:hidden fixed bottom-0`, ~52–56px) with an `h-20` spacer — bottom-bar clearance is handled globally; pages must NOT re-add their own horizontal padding (Leaderboard does → double padding).
- Results screens (`QuizResults`, `RankedQuizResults`) are the **reference pattern**: fixed CTA layered above the tab bar with `pointer-events` scroll-safety + `env(safe-area-inset-bottom)`.

---

## P0 — real breakage (fix first)

1. **DailyChallenge — immersive view nested inside AppLayout.** The play view returns its own `min-h-screen` `<main>` with a `fixed bottom-6` dock while routed *inside* AppLayout (unlike `Quiz.tsx` which is full-screen outside it). Result: question+answers never fit one phone screen (forced scroll) **and** the "Câu tiếp theo" CTA overlaps `MobileBottomTabs`. `DailyChallenge.tsx:475`, `:571`, `:642`. Also no `compact`/length-adaptive answer buttons (`:534`).
2. **GroupDetail — member-table header overflows.** Header row `grid-cols-[40px_1fr_100px_100px_100px_60px]` (~460px) has no `hidden sm:grid`, so it overflows 375px AND misaligns with the mobile `flex` data rows. `GroupDetail.tsx:1029`.
3. **Review — sticky-header negative margins mis-sized.** `-mx-8 md:-mx-14 -mt-8` overshoot AppLayout's real `px-4 md:px-8` → header bleeds ~16px past viewport edges (horizontal overflow). `Review.tsx:100`.
4. **Leaderboard — double padding + rigid podium.** Re-adds `px-4 md:px-10` on top of AppLayout's `px-4` (32px/side on mobile); podium is `grid-cols-3` at all breakpoints; tier/"câu" labels `text-[9px]`/`text-[8px]` effectively unreadable. `Leaderboard.tsx:98`, `:128`, `:176`, `:194`.
5. **Home — hero name can't wrap.** `whitespace-nowrap` on the `clamp()` hero name → long VN names overflow / cause horizontal scroll. `Home.tsx:312`.

## P1 — meaningful density / cramping

6. **TournamentDetail** — bracket `inline-grid min-w-max` (`repeat(rounds, minmax(220px,1fr))`) forces horizontal scroll with no mobile affordance (`TournamentDetail.tsx:261`); 3-block hero header never `flex-col` (`:482`); tab row no `overflow-x-auto` (`:600`).
7. **TournamentMatch** — VS layout `gridTemplateColumns:'1fr auto 1fr'` never collapses → two PlayerCards + 72px timer cramped at 375px. `TournamentMatch.tsx:410`.
8. **QuizSetEditor (+ PersonalQuizSetEditor)** — focused inputs use `fontSize:12–14` → iOS Safari auto-zoom on every field tap (`quizset-editor/styles.ts:43`, `QuestionEditor.tsx:217/255`, MetadataAccordion); AI-rewrite diff `1fr 1fr` doesn't stack (`quizset-editor/AIRewriteModal.tsx:104`); collapsed sidebar renders above the editor.
9. **Onboarding (slides)** — `fixed top-0` nav vs only `pt-16` offset, `min-h-[700px]` grid, journey visual `px-12 py-24` + `grid-cols-4` tiles cramped/overlap on small phones. `Onboarding.tsx:148`, `:157`, `:320`; footer `px-12` non-wrapping `:248`.
10. **GroupDetail tab nav** — `flex flex-nowrap` 4 tabs + badges, no `overflow-x-auto` fallback. `GroupDetail.tsx:858`.

## P2 — minor / acceptable-but-watch

- **LandingPage** — 12-col leaderboard preview never reflows; cramped but `truncate`/`text-[10px]` prevent hard overflow. `LandingPage.tsx:274`, `:285`.
- **RoomAnalytics** — 7-col player `<table>` only `overflow-x-auto` (horizontal scroll), no card reflow. `RoomAnalytics.tsx:204`.
- **OnboardingTryQuiz** — results `grid-cols-3` stats lack `grid-cols-1` base; `px-12` footers. `OnboardingTryQuiz.tsx:149`, `:198`.
- **Achievements** — sidebar splits only at `xl` → long single-column scroll on phone/tablet (not overflow). `Achievements.tsx:216`.
- **ScheduledQuizDetail** — fixed-px leaderboard grid + un-`min-w-0` winner name (mild squeeze). `ScheduledQuizDetail.tsx:217`, `:129`.
- Hard `grid-cols-3` stat rows that stay legible via scaled type: `Ranked.tsx:270`, `RankedQuizResults.tsx:338`, `Cosmetics.tsx:51` (skeleton).
- Quiz long-question one-screen fit imperfect (mitigated by adaptive buckets + compact buttons). `Quiz.tsx:861`.

---

## Per-page detail

### A · Home & Identity
| Page | Route | Rating | Key issue |
|---|---|---|---|
| Home | `/` | Fair | `whitespace-nowrap` hero name overflow (`Home.tsx:312`) |
| Profile | `/profile` | Good | mobile-first; heatmap `overflow-x-auto` correct |
| Achievements | `/achievements` | Fair | sidebar splits only at `xl` (long scroll); uses useEffect+fetch |
| Journey | `/journey` | Good | summary legend lacks `flex-wrap` (minor) |
| Cosmetics | `/cosmetics` | Good | skeleton `grid-cols-3` non-responsive (cosmetic) |
| Leaderboard | `/leaderboard` | **Needs work** | double padding + always `grid-cols-3` podium + sub-10px labels |

### B · Auth & Public
| Page | Route | Rating | Key issue |
|---|---|---|---|
| Login | `/login` | Good | hero `hidden lg:flex`; ≥48px taps |
| Register | `/register` | Good | same proven pattern |
| AuthCallback | `/auth/callback` | Good | centered spinner |
| Onboarding | `/onboarding` | **Needs work** | fixed-nav offset, `min-h-[700px]`, `px-12` journey visual |
| OnboardingTryQuiz | `/onboarding/try` | Fair | results `grid-cols-3` no base; `px-12` footers |
| LandingPage | `/landing` | Fair | 12-col leaderboard table no mobile reflow |
| Help | `/help` | Good | fluid FAQ |
| PrivacyPolicy | `/privacy` | Good | clean long-form |
| TermsOfService | `/terms` | Good | clean long-form |
| NotFound | `*` | Good | scaled 404, clipped decoratives |

### C · Quiz gameplay
| Page | Route | Rating | Key issue |
|---|---|---|---|
| Quiz | `/quiz` | Good | best-engineered; long-question fit imperfect |
| Practice | `/practice` | Good | responsive config form |
| DailyChallenge | `/daily` | **Needs work** | `min-h-screen` inside AppLayout → forced scroll + dock/tab overlap |
| Review | `/review` | Fair | sticky-header negative margins → horizontal overflow |
| BasicQuiz | `/basic-quiz` | Good | natural scroll, stacked options (safest) |
| QuizResults | (results) | Good | reference fixed-CTA + tab clearance |

### D · Other modes
| Page | Route | Rating | Key issue |
|---|---|---|---|
| Ranked | `/ranked` | Good | mobile-first sticky CTA; `grid-cols-3` stats dense |
| RankedQuizResults | (results) | Good | layered fixed CTA + scroll-safe modal |
| WeeklyQuiz | `/weekly-quiz` | Good | centered fluid intro |
| MysteryMode | `/mystery-mode` | Good | centered fluid intro |
| SpeedRound | `/speed-round` | Good | centered fluid intro |

### E · Multiplayer & Rooms
| Page | Route | Rating | Key issue |
|---|---|---|---|
| Multiplayer | `/multiplayer` | Good | wraps everywhere; JoinByCodeBar tight |
| Rooms | `/rooms` | Good | redirect only |
| CreateRoom | `/room/create` | Good | safe `minmax(0,…)` tracks |
| JoinRoom | `/room/join` | Good | centered status card |
| RoomLobby | `/room/:id/lobby` | Good | drawer/FAB/footer mobile pattern |
| RoomQuiz | `/room/:id/quiz` | Good | safe-area handling, sidebars swapped |
| RoomQuizHost | `/room/:id/host` | Good | TV-first + working sticky mobile controls |
| RoomAnalytics | `/room/:id/analytics` | Fair | 7-col table horizontal-scroll only |

### F · Groups & Quiz Sets
| Page | Route | Rating | Key issue |
|---|---|---|---|
| Groups | `/groups` | Good | scroll-snap carousel, FAB |
| GroupDetail | `/groups/:id` | **Needs work** | unguarded member-table header overflow; non-scroll tabs |
| GroupAnalytics | `/groups/:id/analytics` | Good | responsive KPI grids |
| QuizSetList | `/groups/:id/quiz-sets` | Good | separate mobile header/toolbar |
| QuizSetDetail | `/groups/:id/quiz-sets/:setId` | Good | forked mobile/desktop, `lg:`-gated sidebar |
| QuizSetEditor | `/groups/:id/quiz-sets/new\|edit` | Fair | iOS input zoom <16px; AI-diff no stack; sidebar-above-editor |

### G · Personal / Scheduled / Tournaments
| Page | Route | Rating | Key issue |
|---|---|---|---|
| MySets | `/my-sets` | Good | mobile-first grid |
| PersonalQuizSetEditor | `/my-sets/new\|edit` | Good | delegates to QuizSetEditor (same minor nits) |
| ScheduledQuizCreate | `/groups/:id/scheduled-quizzes/new` | Good | single-column form |
| ScheduledQuizDetail | `/groups/:id/scheduled-quizzes/:quizId` | Fair | fixed-px leaderboard grid; un-`min-w-0` winner name |
| ScheduledQuizPlay | `…/:quizId/play` | Good | textbook responsive gameplay |
| Tournaments | `/tournaments` | Good | `flex-col sm:flex-row` header, wrapping stats |
| TournamentDetail | `/tournaments/:id` | **Needs work** | bracket `min-w-max` scroll; 3-col hero never stacks; non-scroll tabs |
| TournamentMatch | `/tournaments/:id/match/:matchId` | **Needs work** | VS `1fr auto 1fr` grid never collapses → cramped |
