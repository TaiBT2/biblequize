import UserDropdown from './UserDropdown'

/**
 * Sidebar foot identity slot — a single 40px gold-gradient avatar
 * with the user's first initial. Click opens the existing
 * {@link UserDropdown} menu (Profile / Achievements / Help / Quiz
 * language / Logout) anchored above the avatar so it doesn't clip
 * off the bottom of the viewport.
 *
 * Per Bui 2026-05-14: replaces the wide name+tier+chevron card with
 * the minimal Slack/Discord/Notion pattern.
 */
export default function SidebarUserCard() {
  return (
    <div
      data-testid="sidebar-user-card"
      className="px-4 pt-3 pb-4 flex items-center justify-start border-t border-bq-hair"
    >
      <UserDropdown align="left" trigger="compact" dropPosition="top" />
    </div>
  )
}
