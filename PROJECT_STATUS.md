# BibleQuiz — Project Status Report
> Generated: 2026-03-28

## 1. Tổng quan

| Metric | Count |
|--------|-------|
| Java source files (main) | 159 |
| TypeScript/React files | 56 |
| Flyway migrations | 12 (V1 → V12) |
| Backend test files | 42 |
| Frontend test files | 7 |
| E2E Playwright tests | 12 |
| k6 performance scripts | 5 |
| Total @Test methods | 370 |
| REST endpoints | ~75 |
| DB tables | ~30 |
| Backend modules | 14 |
| Frontend pages | 27 (20 user + 7 admin) |

---

## 2. Trạng thái từng module

| Module | Backend | Frontend | Tests | Ghi chú |
|--------|---------|----------|-------|---------|
| Auth (OAuth2 + JWT) | ✅ | ✅ | ✅ 25 tests | Login, register, refresh, logout, OAuth2 Google |
| Ranked Mode | ✅ | ✅ | ✅ 50 tests | Energy, scoring, book progression, daily cap |
| Daily Challenge | ✅ | ⚠️ | ✅ 13 tests | Backend done, FE chỉ có page chưa có complete flow |
| Practice Mode | ✅ | ✅ | ⚠️ 8 tests | Session + answer submission done |
| Leaderboard | ✅ | ✅ | ✅ 8 tests | Daily/weekly/monthly/all-time + my-rank |
| Church Group | ✅ | ❌ | ✅ 15 tests | Backend + API done, FE chưa có trang Group |
| Multiplayer Room | ✅ | ✅ | ✅ 32 tests | 4 game modes, WS, lobby, quiz |
| Tournament | ✅ | ❌ | ✅ 14 tests | Backend + API done, FE chưa có trang Tournament |
| Share Card | ✅ | ❌ | ✅ 8 tests | Backend + API done, chưa có image generation thật |
| Admin / Import | ✅ | ✅ | ✅ 23 tests | CRUD questions, import, review queue, AI generator page |
| Tier System | ✅ | ⚠️ | ✅ 15 tests | RankTier enum + endpoint, FE hiện tier nhưng chưa có progress bar |
| Streak System | ✅ | ⚠️ | ✅ 14 tests | StreakService done, FE chưa hiển thị streak rõ |
| Season System | ✅ | ⚠️ | ✅ 11 tests | Backend done, FE chưa có season leaderboard riêng |
| Notification | ❌ | ❌ | ❌ | Chưa implement (không có entity/service/controller) |
| Achievement/Badge | ✅ | ✅ | ✅ 9 tests | 5 achievement types, check + award logic |

**Legend:** ✅ Done | ⚠️ Partial | ❌ Not started

---

## 3. Test Cases Coverage

Dựa trên BIBLEQUIZ_TEST_CASES.md (100 TCs):

| Module | Total TCs | Có test code | Chưa có | Coverage |
|--------|-----------|-------------|---------|----------|
| Auth | 9 | 7 | 2 | 78% |
| User/Tier/Streak/Badge | 11 | 9 | 2 | 82% |
| Daily Challenge | 5 | 4 | 1 | 80% |
| Practice Mode | 5 | 2 | 3 | 40% |
| Ranked Mode | 13 | 11 | 2 | 85% |
| Multiplayer Room | 6 | 5 | 1 | 83% |
| Tournament | 6 | 4 | 2 | 67% |
| Church Group | 9 | 7 | 2 | 78% |
| Leaderboard | 5 | 2 | 3 | 40% |
| Share Card | 4 | 4 | 0 | 100% |
| Admin/Content/AI | 7 | 4 | 3 | 57% |
| Security | 8 | 5 | 3 | 63% |
| Notifications | 3 | 0 | 3 | 0% |
| Performance | 5 | 5 | 0 | 100% |
| WebSocket | 4 | 2 | 2 | 50% |
| **Total** | **100** | **71** | **29** | **71%** |

---

## 4. Database

### Migrations (V1 → V12)
| # | File | Nội dung |
|---|------|---------|
| V1 | init.sql | users, auth_identities, books, questions, quiz_sessions, quiz_session_questions, answers, user_daily_progress, feedback, bookmarks |
| V2 | achievements.sql | achievements, user_achievements |
| V3 | rooms.sql | rooms, room_players |
| V4 | add_audit_events_table.sql | audit_events |
| V5 | add_correct_answer_text.sql | ALTER questions ADD correct_answer_text |
| V6 | add_password_hash.sql | ALTER users ADD password_hash |
| V7 | seasons_and_achievements.sql | seasons, season_rankings (recreate achievements) |
| V8 | question_review_workflow.sql | question_reviews |
| V9 | fix_question_reviews_schema.sql | Schema fixes |
| V10 | add_room_game_modes.sql | room_rounds, room_answers, room_room_players updates |
| V11 | spec_v2_energy_streak.sql | ALTER users ADD streak fields |
| V12 | tournament_group_sharecard.sql | tournaments, tournament_participants, tournament_matches, tournament_match_participants, church_groups, group_members, group_announcements, group_quiz_sets, share_cards |

### Bảng đã tạo (~30)
users, auth_identities, books, questions, quiz_sessions, quiz_session_questions, answers, user_daily_progress, feedback, bookmarks, achievements, user_achievements, rooms, room_players, room_room_players, room_rounds, room_answers, audit_events, seasons, season_rankings, question_reviews, tournaments, tournament_participants, tournament_matches, tournament_match_participants, church_groups, group_members, group_announcements, group_quiz_sets, share_cards

### Bảng còn thiếu so với SPEC-v2.md
| Bảng | Mô tả | Status |
|------|-------|--------|
| notifications | Push notification records | ❌ Chưa tạo |
| user_badges | Badge records (tier_up, streak_7...) | ❌ Dùng user_achievements thay thế |
| question_locale | Multi-language questions | ❌ Chưa cần (chỉ có tiếng Việt) |
| question_sets | Custom quiz sets | ⚠️ Có group_quiz_sets nhưng chưa có global |
| friends | Friend relationships | ❌ Chưa tạo |
| ai_generation_jobs | AI question generation tracking | ❌ Chưa tạo (AI service là stub) |
| import_batches | Import history tracking | ❌ Chưa tạo |

---

## 5. API Endpoints

### Auth (`/api/auth`)
- ✅ POST /auth/exchange — OAuth2 token exchange
- ✅ POST /auth/register — Email/password registration
- ✅ POST /auth/login — Email/password login
- ✅ POST /auth/refresh — Refresh access token
- ✅ POST /auth/logout — Logout + blacklist token
- ✅ GET /auth/oauth/success — OAuth2 callback redirect

### User (`/api/me`)
- ✅ GET /me — Get profile
- ✅ PATCH /me — Update profile
- ✅ GET /me/ranked-status — Ranked daily status
- ✅ GET /me/tier — Tier info + progress
- ✅ POST /me/promote-admin — Promote to admin
- ✅ POST /me/bootstrap-admin — Create first admin
- ❌ GET /me/badges — Badge list (spec has it, not implemented)
- ❌ GET /me/history — Session history
- ❌ GET /me/friends — Friend list

### Sessions (`/api/sessions`)
- ✅ POST /sessions — Create quiz session
- ✅ POST /sessions/{id}/answer — Submit answer
- ✅ GET /sessions/{id} — Get session
- ✅ GET /sessions/{id}/review — Review answers
- ❌ POST /sessions/{id}/retry — Retry session

### Ranked (`/api/ranked`)
- ✅ POST /ranked/sessions — Start ranked session
- ✅ POST /ranked/sessions/{id}/answer — Submit ranked answer
- ✅ POST /ranked/sync-progress — Sync to DB

### Daily Challenge (`/api/daily-challenge`)
- ✅ GET /daily-challenge — Get today's questions
- ✅ POST /daily-challenge/start — Start challenge
- ✅ GET /daily-challenge/result — Get result

### Leaderboard (`/api/leaderboard`)
- ✅ GET /leaderboard/daily — Daily leaderboard
- ✅ GET /leaderboard/weekly — Weekly
- ✅ GET /leaderboard/monthly — Monthly
- ✅ GET /leaderboard/all-time — All-time
- ✅ GET /leaderboard/{period}/my-rank — My rank
- ❌ GET /leaderboard/friends — Friend leaderboard
- ❌ GET /leaderboard/around-me — Around-me context

### Rooms (`/api/rooms`)
- ✅ POST /rooms — Create room
- ✅ POST /rooms/join — Join by code
- ✅ GET /rooms/{id} — Room details
- ✅ POST /rooms/{id}/start — Start quiz
- ✅ POST /rooms/{id}/leave — Leave room
- ✅ POST /rooms/{id}/switch-team — Switch team
- ✅ GET /rooms/public — Public rooms
- ✅ GET /rooms/{id}/leaderboard — Room leaderboard
- ❌ POST /rooms/{id}/kick — Kick player

### Tournament (`/api/tournaments`)
- ✅ POST /tournaments — Create
- ✅ GET /tournaments/{id} — Details
- ✅ POST /tournaments/{id}/join — Join
- ✅ POST /tournaments/{id}/start — Start
- ✅ GET /tournaments/{id}/bracket — Bracket
- ✅ POST /tournaments/{id}/matches/{matchId}/forfeit — Forfeit

### Church Group (`/api/groups`)
- ✅ POST /groups — Create group
- ✅ GET /groups/{id} — Details
- ✅ POST /groups/join — Join by code
- ✅ DELETE /groups/{id}/leave — Leave
- ✅ GET /groups/{id}/leaderboard — Group leaderboard
- ✅ GET /groups/{id}/analytics — Analytics (leader only)
- ✅ POST /groups/{id}/quiz-sets — Create quiz set
- ✅ GET /groups/{id}/quiz-sets — List quiz sets
- ❌ PATCH /groups/{id} — Update group
- ❌ DELETE /groups/{id} — Delete group
- ❌ DELETE /groups/{id}/members/{userId} — Kick member
- ❌ POST /groups/{id}/announcements — Create announcement
- ❌ GET /groups/{id}/announcements — List announcements

### Share Card (`/api/share`)
- ✅ GET /share/session/{sessionId} — Session card (returns JSON, not PNG yet)
- ✅ GET /share/tier-up/{tierId} — Tier-up card
- ✅ POST /share/{id}/view — Track view count
- ⚠️ Image generation is placeholder (returns JSON metadata, not actual PNG)

### Admin (`/api/admin`)
- ✅ GET /admin/questions — List questions
- ✅ POST /admin/questions — Create question
- ✅ PUT /admin/questions/{id} — Update
- ✅ DELETE /admin/questions/{id} — Delete
- ✅ DELETE /admin/questions — Bulk delete
- ✅ POST /admin/import — Import questions
- ✅ GET /admin/questions/ping — Health check
- ✅ GET /admin/review/pending — Pending reviews
- ✅ POST /admin/review/{id}/approve — Approve
- ✅ POST /admin/review/{id}/reject — Reject
- ✅ GET /admin/audit/events — Audit events
- ❌ GET /admin/coverage — Pool coverage per book
- ❌ POST /admin/ai/generate — AI generate (service exists but stub)
- ❌ GET /admin/ai/jobs/{id} — AI job status

### Notification
- ❌ GET /notifications — Not implemented
- ❌ PATCH /notifications/read-all — Not implemented
- ❌ POST /notifications/push-token — Not implemented

### Feedback
- ✅ POST /feedback — Submit feedback
- ✅ GET /admin/feedback — List feedback
- ✅ PATCH /admin/feedback/{id} — Update status

### Season (`/api/seasons`)
- ✅ GET /seasons/active — Active season
- ✅ GET /seasons/{id}/leaderboard — Season leaderboard
- ✅ GET /seasons/{id}/my-rank — My season rank
- ✅ GET /seasons — List all seasons

### Health
- ✅ GET /health — App health check
- ✅ GET /health/simple — Simple health

**Summary: ~75 endpoints implemented, ~20 endpoints missing from SPEC-v2**

---

## 6. Known Issues

```
grep -r "TODO|FIXME|HACK" apps/ --include="*.java" --include="*.ts" --include="*.tsx"
→ 0 results
```

Không có TODO/FIXME/HACK trong codebase.

---

## 7. Việc còn lại theo thứ tự ưu tiên

### Phải làm trước khi deploy v1.0
- [ ] **Share Card image generation** — hiện trả về JSON, cần render PNG thật (Puppeteer/Canvas)
- [ ] **Friend system** — table + API cho add/remove friends, friend leaderboard
- [ ] **Session retry** — POST /sessions/{id}/retry
- [ ] **Room kick** — POST /rooms/{id}/kick
- [ ] **Group CRUD hoàn chỉnh** — PATCH/DELETE group, kick member, announcements
- [ ] **Admin coverage API** — GET /admin/coverage (pool size per book)

### Nên làm ở v1.5
- [ ] **Notification system** — entity, service, controller, FCM integration
- [ ] **AI question generation** — connect Bedrock/Gemini, validate drafts, approval flow
- [ ] **Import batch tracking** — import_batches table, rollback on failure
- [ ] **Frontend pages cho Church Group** — trang tạo/join/manage group
- [ ] **Frontend pages cho Tournament** — trang bracket, match view
- [ ] **Season leaderboard UI** — tab riêng cho season ranking
- [ ] **Streak UI** — hiển thị streak count, freeze status, badges

### Để sau (v2.0+)
- [ ] **Multi-language questions** — question_locale table
- [ ] **Ordering/Matching question types** — spec có nhưng chưa implement
- [ ] **Leaderboard around-me** — context ±5 ranks
- [ ] **WebSocket horizontal scaling** — Redis Pub/Sub thay simple broker
- [ ] **Rate limit per-endpoint tuning** — hiện dùng global rate limit
- [ ] **Anomaly detection** — audit log flagging cho leaderboard cheating

---

## 8. Thống kê dependency

### Backend (pom.xml)
| Dependency | Version | Mục đích |
|------------|---------|----------|
| spring-boot | 3.3.0 | Framework |
| mysql-connector-java | 8.0.33 | DB driver |
| spring-data-redis | (managed) | Cache |
| spring-security + oauth2-client | (managed) | Auth |
| jjwt | 0.11.5 | JWT tokens |
| flyway-core + flyway-mysql | (managed) | DB migration |
| spring-boot-starter-websocket | (managed) | WebSocket STOMP |
| springdoc-openapi | 2.2.0 | Swagger UI |
| spring-dotenv | 4.0.0 | .env file support |

### Frontend (package.json)
| Dependency | Mục đích |
|------------|----------|
| react 18 + react-dom | UI framework |
| react-router-dom | Routing |
| @tanstack/react-query | API data fetching |
| zustand | Global state |
| axios | HTTP client |
| @stomp/stompjs + sockjs-client | WebSocket |
| tailwindcss | Styling |
