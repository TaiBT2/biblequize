import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const FILL_1: React.CSSProperties = { fontVariationSettings: "'FILL' 1" }

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

interface ActivityFeedProps {
  /**
   * ISO timestamp of when the user signed up. Used to decide whether
   * to show the launch-week welcome banner. When undefined the user
   * is treated as new — at v1 launch every user is < 7 days old, so
   * the default behaviour is correct without a backend change. v1.1
   * can populate this from {@code /api/me} once the field is exposed.
   */
  userCreatedAt?: string
}

/**
 * Right-rail activity feed on Home. v1 has no backend feed yet — the
 * component always renders the empty state (pioneer messaging + invite
 * CTA), optionally prepended with a system welcome banner for launch-
 * week users. v1.1 will fetch from {@code /api/activity} and fall back
 * to this empty state when the response is empty.
 *
 * Replaces three hard-coded dummy rows that would have been visibly
 * fake at launch. See step 4 of docs/prompts/PROMPT_HOME_REFACTOR_FIXES.md.
 */
export default function ActivityFeed({ userCreatedAt }: ActivityFeedProps) {
  const { t } = useTranslation()

  const isNewUser =
    !userCreatedAt ||
    Date.now() - new Date(userCreatedAt).getTime() < SEVEN_DAYS_MS

  return (
    <div
      data-testid="activity-feed"
      className="bg-bq-white rounded-2xl p-4 md:p-4 border border-bq-hair shadow-bq-soft flex flex-col"
    >
      <h4 className="font-medium text-bq-ink text-[12px] md:text-[13px]">
        {t('home.activityFeed.title')}
      </h4>
      <span className="text-bq-ink2/60 text-[10px] mb-3">
        {t('home.activityFeed.subtitle')}
      </span>

      {/* System welcome — only for launch-week users */}
      {isNewUser && (
        <div
          data-testid="activity-system-welcome"
          className="flex gap-3 mb-3 pb-3 border-b border-bq-hair"
        >
          <div className="w-8 h-8 rounded-full bg-bq-amber/10 border border-bq-amber/20 flex items-center justify-center shrink-0">
            <span className="text-base">🎉</span>
          </div>
          <p className="text-[11px] text-bq-ink leading-relaxed">
            {t('home.activityFeed.systemWelcome')}
          </p>
        </div>
      )}

      {/* Empty state — pioneer messaging + invite CTA */}
      <div
        data-testid="activity-empty-state"
        className="flex-1 flex flex-col items-center text-center py-2 md:py-4 gap-2"
      >
        <div className="text-xl md:text-2xl mb-1" style={FILL_1}>
          🌱
        </div>
        <p className="text-[11px] md:text-[12px] font-medium text-bq-ink/85">
          {t('home.activityFeed.emptyTitle')}
        </p>
        <p className="text-[10px] text-bq-ink2/60 leading-relaxed">
          {t('home.activityFeed.emptyBody')}
        </p>
        <Link
          to="/groups"
          data-testid="activity-empty-cta"
          className="inline-flex items-center gap-1 mt-2 px-3 py-2 rounded-md bg-bq-amber/10 border border-bq-amber/40 text-[10px] md:text-[11px] font-medium text-bq-amberd hover:bg-bq-amber/15 transition-colors"
        >
          {t('home.activityFeed.emptyCta')} →
        </Link>
      </div>
    </div>
  )
}
