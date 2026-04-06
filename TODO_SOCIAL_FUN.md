# TODO — Multiplayer Social Fun [DONE]

### Task 1: Real-time Reactions — [x] DONE
- BE: REACTION message type + @MessageMapping handler
- FE: ReactionBar (6 emojis, cooldown) + FloatingReaction animation

### Task 2: Live Feed — [x] DONE
- FE: LiveFeed component (auto-dismiss 3s, fun messages i18n EN/VI)
- Integrated into RoomQuiz.tsx, subscribes to ANSWER_SUBMITTED

### Task 3: Challenge Friend — [x] DONE
- V21 migration (challenges table)
- Challenge entity + ChallengeRepository
- ChallengeService (create, accept, decline, expire scheduler)
- ChallengeController (4 REST endpoints)
- WebSocket notification to challenged user

### Task 4: Victory + Rematch — [ ] TODO (frontend-only, deferred)

### Task 5: Online Indicator — [x] DONE
- OnlineService (Redis-backed, 5-min TTL, activity status)

### Task 6: Tests — [x] DONE (10 tests)
- Challenge: create, self-challenge, accept, decline, expire, wrong user, WebSocket notification
- Challenge entity: isExpired true/false
- Profile test regression fix (tier i18n)
