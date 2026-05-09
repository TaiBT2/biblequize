-- Hourly NotificationScheduler used to create a new streak_warning /
-- daily_reminder notification on every tick before the 24h dedup gate
-- landed in NotificationService (commit 3b766f6). Some users
-- accumulated tens of identical unread rows, inflating the bell badge
-- and spamming the panel.
--
-- This migration marks duplicate unread rows as read for each user ×
-- gated-type pair, keeping the most recent. The future-side gate in
-- NotificationService.createStreakWarning / createDailyReminder
-- prevents new accumulation. We mark-as-read rather than delete so
-- the audit trail is preserved.

UPDATE notifications n
JOIN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, type
                   ORDER BY created_at DESC
               ) AS rn
        FROM notifications
        WHERE type IN ('streak_warning', 'daily_reminder')
          AND is_read = false
    ) ranked
    WHERE rn > 1
) dups ON n.id = dups.id
SET n.is_read = true,
    n.updated_at = NOW();
