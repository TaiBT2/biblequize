# Tablet Responsive Audit — Web (non-admin)

> Date: 2026-06-17 · Scope: all routed non-admin pages, post phone-responsive pass.
> Viewports: **768px** (iPad portrait, `md` boundary) + **1024px** (iPad landscape, `lg` boundary).
> Method: 7 parallel read-only audits. Tailwind sm=640 md=768 lg=1024 xl=1280. Shell = **top-bar** AppLayout (`max-w-7xl mx-auto px-4 md:px-8`, no left sidebar).

## Summary

| Rating | Count | Meaning |
|---|---|---|
| **Good** | ~21 | adapts well at 768 & 1024 |
| **Fair** | ~22 | works, no breakage — **underutilizes tablet width** (optimization) |
| **Needs work** | 6 | shows a **mobile layout on tablet** (desktop chrome gated at `lg`) |
| **Poor / broken** | 0 | — no overflow/overlap found at either width |

**Verdict**: effort is **low-risk breakpoint tuning**, not bug-fixing. Two root anti-patterns:
1. **Desktop chrome gated at `lg` (1024)** instead of `md` (768) → the 768–1023 "tween zone" gets the phone layout (sidebars hidden, 1-col).
2. **Narrow self-imposed `max-w-*` caps** (`max-w-2xl/3xl/md`) → big empty gutters at 1024.

---

## P0 — Needs work (mobile layout on tablet)

1. **RoomLobby + RoomQuiz** — 3-col `lg:grid-cols-[280px_1fr_320px]` + `isMobile = innerWidth < 1024` treat the whole 768–1023 band as a phone: chat/activity/live-feed/scoreboard sidebars hidden, chat demoted to FAB, wide empty gutters. Fix: add a `md` tier that docks ≥1 sidebar at 768 and lower `isMobile` to `<768`. `RoomLobby.tsx:112,694,891,1146`; `room/RoomQuizShell.tsx:395,398,648,685`.
2. **QuizSetList** — folder sidebar `hidden lg:flex w-[240px]` + toolbar `hidden lg:block` + cards `grid-cols-1 lg:grid-cols-3` → **1 card per row** at 768. Fix: gate chrome at `md`, cards `md:grid-cols-2 lg:grid-cols-3`. `group/QuizSetList.tsx:202,270,606,665,713,195,382`.
3. **QuizSetDetail** — right stats sidebar `hidden lg:block w-[340px]` + desktop branch all `lg` → mobile branch on tablet. Fix: gate at `md`. `group/QuizSetDetail.tsx:90,174,223`.
4. **Achievements** — 12-col content/sidebar split gated at `lg` → at 768 the rich sidebar is stranded below the cards. Fix: `md:grid-cols-12` + `md:col-span-8/4`. `Achievements.tsx:216,218,344`.
5. **PersonalQuizSetEditor / QuizSetEditor** — collapse rules use `@media (max-width: 768px)`, so **iPad portrait (exactly 768) gets the mobile stacked editor** (off-by-one). Fix: change `768px`→`767px` in the 3 media queries. `group/QuizSetEditor.tsx:446`, `quizset-editor/MetadataAccordion.tsx:123`, `quizset-editor/QuestionEditor.tsx:323`.

## P1 — Fair, higher value (abrupt jump / clearly wasted width)

- **CreateRoom** — 2-col split gated `lg` → 768 stacks preview below a long form. Fix `md:grid-cols-[…1.55fr…1fr]` + `md:sticky`. `CreateRoom.tsx:151`, `create-room/PreviewPanel.tsx:42`.
- **GroupAnalytics** — KPI/actions `grid-cols-2 lg:grid-cols-4` → abrupt 2→4 jump at 1024. Fix `md:grid-cols-4`. `GroupAnalytics.tsx:282,441`.
- **Login + Register** — hero gated `lg:w-[60%]` → 768–1023 = full-paper around a `max-w-md` form, hero hidden; at 1024 the 40% col + `md:px-24` is tight. Fix: `md:w-[55%]/md:w-[45%]` + `md:px-12`. `Login.tsx:76,114`, `Register.tsx:60,96`.
- **BasicQuiz** — `max-w-3xl` + single-column answer stack → narrow column floating at 1024. Fix: `max-w-4xl/5xl` + answers `md:grid-cols-2`. `BasicQuiz.tsx:204,237`.
- **GroupDetail** — member table fixed `grid-cols-[40px_1fr_100px_100px_100px_60px]` is `sm`-gated → cramped (not broken) at 768. Fix: gate the table at `md` (keep compact rows on tablet). `GroupDetail.tsx:1029,1049`.
- **Journey / Cosmetics / MySets / Tournaments** — narrow caps + missing intermediate column tier. Fix: add `md:`/`lg:grid-cols-N` + widen `max-w`. `Journey.tsx:76,148`; `Cosmetics.tsx:61,81,126`; `MySets.tsx:42,79`; `Tournaments.tsx:152`.

## P2 — Fair, low priority (intentional narrow reading column)

- RankedQuizResults (`max-w-md`→`md:max-w-xl`), Review (`max-w-4xl`), QuizResults (`max-w-2xl`), Practice (filter `lg:grid-cols-2`→`md:`), WeeklyQuiz/MysteryMode/SpeedRound (`max-w-2xl` intros), ScheduledQuizCreate/Detail, TournamentDetail (4 info cards tight at exactly 768 → `lg:grid-cols-4`), RoomQuizHost (TV-intent, 2-col `lg`-gated).

## Minor / latent
- `RankedActionFooter.tsx:107` uses `md:left-72` (288px sidebar offset) but this app has **no sidebar** (top-bar shell). It's `md:hidden` on the Ranked page so dead at tablet — but worth cleaning to avoid future misuse.

---

## Per-page detail (rating · 768 → 1024)

### A · Home & Identity
| Page | Rating | Note |
|---|---|---|
| Home `/` | Good | modes 3-col @ sm, missions+lb split @ lg — fills width |
| Profile `/profile` | Good | full-width card stack, internal grids `md:` |
| Achievements `/achievements` | **Needs work** | 12-col split gated `lg` → sidebar stranded at 768 |
| Journey `/journey` | Fair | single-column rows, `max-w-4xl`, no multi-col tier |
| Cosmetics `/cosmetics` | Fair | `max-w-3xl` frozen + 3-col → gutters at 1024 |
| Leaderboard `/leaderboard` | Good | `max-w-5xl`, podium/tier `md:` |

### B · Auth & Public
| Page | Rating | Note |
|---|---|---|
| Login `/login` | Fair | hero `lg`-gated → wasted width 768–1023 |
| Register `/register` | Fair | same |
| AuthCallback | Good | centered card |
| Onboarding `/onboarding` | Good | language `md:grid-cols-2`, slides `md:` split |
| OnboardingTryQuiz `/onboarding/try` | Good | answers/result `md:grid-cols-2` |
| LandingPage `/landing` | Good | hero `md:grid-cols-2`, features `lg:grid-cols-4` |
| Help `/help` | Good | full-width FAQ |
| PrivacyPolicy / TermsOfService | Good | `max-w-3xl` prose (correct) |
| NotFound `*` | Good | centered |

### C · Quiz gameplay
| Page | Rating | Note |
|---|---|---|
| Quiz `/quiz` | Good | `max-w-5xl` + `md:grid-cols-2` answers |
| Practice `/practice` | Fair | filter `lg:grid-cols-2` → 768 single-col |
| DailyChallenge `/daily` | Good | mirrors Quiz |
| Review `/review` | Fair | `max-w-4xl` (intentional), gutters at 1024 |
| BasicQuiz `/basic-quiz` | Fair | `max-w-3xl` + single-col answers → big gutters |
| QuizResults | Fair | `max-w-2xl` (intentional) |

### D · Other modes
| Page | Rating | Note |
|---|---|---|
| Ranked `/ranked` | Good | `md:grid-cols-[1.55fr_1fr]` |
| RankedQuizResults | Fair | `max-w-md` too narrow on tablet |
| WeeklyQuiz / MysteryMode / SpeedRound | Fair | `max-w-2xl` intros, low priority |

### E · Multiplayer & Rooms
| Page | Rating | Note |
|---|---|---|
| Multiplayer `/multiplayer` | Good | `md:grid-cols-2` |
| Rooms `/rooms` | Good | redirect |
| CreateRoom `/room/create` | Fair | 2-col gated `lg` → 768 stacked |
| JoinRoom `/room/join` | Good | centered |
| RoomLobby `/room/:id/lobby` | **Needs work** | 3-col + `isMobile<1024` → phone on tablet |
| RoomQuiz `/room/:id/quiz` | **Needs work** | 3-col `lg`-gated → phone on tablet |
| RoomQuizHost `/room/:id/host` | Fair | 2-col `lg`-gated (TV-intent) |
| RoomAnalytics `/room/:id/analytics` | Good | 7-col table fits 768 (3 cols hidden <sm) |

### F · Groups & Quiz Sets
| Page | Rating | Note |
|---|---|---|
| Groups `/groups` | Good | `md:grid-cols-2` → `lg:` 3-col |
| GroupDetail `/groups/:id` | Fair | member table `sm`-gated, cramped at 768 |
| GroupAnalytics `/groups/:id/analytics` | Fair | KPI 2-col until `lg`, abrupt 2→4 jump |
| QuizSetList `/groups/:id/quiz-sets` | **Needs work** | sidebar/toolbar `lg`-gated → 1-col at 768 |
| QuizSetDetail `…/:setId` | **Needs work** | 340px sidebar `lg`-gated → mobile at 768 |
| QuizSetEditor `…/new\|edit` | Fair | collapses at ≤768 → no side-by-side at 768 |

### G · Personal / Scheduled / Tournaments
| Page | Rating | Note |
|---|---|---|
| MySets `/my-sets` | Fair | `max-w-4xl` 2-col, no `lg:` 3-col |
| PersonalQuizSetEditor `/my-sets/new\|edit` | **Needs work** | collapses at exactly 768 → mobile editor (off-by-one) |
| ScheduledQuizCreate | Fair | `max-w-2xl` form |
| ScheduledQuizDetail | Fair | `max-w-3xl`, stacked cards |
| ScheduledQuizPlay | Good | `sm:grid-cols-2` answers |
| Tournaments `/tournaments` | Fair | `space-y` stack, could be 2-col grid |
| TournamentDetail `/tournaments/:id` | Fair | 4 info cards tight at exactly 768 |
| TournamentMatch | Good | VS `sm:grid-cols-[1fr_auto_1fr]` |
