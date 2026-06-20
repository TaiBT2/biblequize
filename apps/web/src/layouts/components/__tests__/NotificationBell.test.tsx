import { describe, it, expect } from 'vitest'
import { resolveNotificationTarget } from '../NotificationBell'

describe('resolveNotificationTarget (notification deep-link)', () => {
  it('deep-links group_announcement to the group Announcements tab via metadata.groupId', () => {
    expect(
      resolveNotificationTarget({
        type: 'group_announcement',
        metadata: '{"groupId":"g-1","announcementId":"a-1"}',
      }),
    ).toBe('/groups/g-1?tab=announcements')
  })

  it('falls back to /groups when group_announcement metadata is missing or malformed', () => {
    expect(resolveNotificationTarget({ type: 'group_announcement' })).toBe('/groups')
    expect(resolveNotificationTarget({ type: 'group_announcement', metadata: 'not-json' })).toBe('/groups')
    expect(resolveNotificationTarget({ type: 'group_announcement', metadata: '{"announcementId":"a-1"}' })).toBe('/groups')
  })

  it('uses the static route for other known types, null for unknown', () => {
    expect(resolveNotificationTarget({ type: 'daily_reminder' })).toBe('/daily')
    expect(resolveNotificationTarget({ type: 'tier_up' })).toBe('/ranked')
    expect(resolveNotificationTarget({ type: 'totally_unknown' })).toBeNull()
  })
})
