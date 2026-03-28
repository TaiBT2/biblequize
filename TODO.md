# TODO

## v1.5 — Notification System [DONE]

### Database
- [x] V14__notifications.sql — table + index

### Backend
- [x] NotificationEntity (modules/notification/entity/)
- [x] NotificationRepository (modules/notification/repository/)
- [x] NotificationService — create, markAsRead, markAllAsRead, getUnread, getUnreadCount
- [x] NotificationController — GET /api/notifications, PATCH /{id}/read, PATCH /read-all
- [x] Tier-up notification integration (RankedController)
- [x] CORS — added PATCH to allowed methods

### Frontend
- [x] Notification bell icon + badge count (Header.tsx)
- [x] Dropdown panel — list, mark as read, mark all as read
- [x] Polling every 30s

### Tests
- [x] NotificationServiceTest — 7 tests pass
- [x] NotificationControllerTest — 4 tests pass

### Cron Jobs
- [x] @EnableScheduling on ApiApplication
- [x] NotificationScheduler — streak warning (hourly), daily reminder (8AM)
- [x] UserRepository.findUsersWithStreakAtRisk query
- [x] NotificationSchedulerTest — 3 tests pass

### Frontend Navigation
- [x] Click notification → navigate to relevant page (ranked, daily, leaderboard, groups, multiplayer)
