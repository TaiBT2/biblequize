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
      className="px-3 py-4 flex items-center justify-center border-t border-outline-variant/10"
    >
      <UserDropdown align="left" trigger="compact" dropPosition="top" />
    </div>
  )
}
