import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ActionCardProps {
  icon: string;
  label: string;
  hint: string;
  onClick?: () => void;
  highlight?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  testId?: string;
}

function ActionCard({ icon, label, hint, onClick, highlight, disabled, disabledReason, testId }: ActionCardProps) {
  const base = 'rounded-xl p-3 border text-left transition-all flex flex-col gap-1 min-h-[88px] backdrop-blur-md';
  // GD-FIX-9: primary "Bắt đầu Live" action wears the emerald accent;
  // neutral cards stay charcoal with subtle borders. Emerald hint text
  // when highlight reinforces the primary affordance.
  const enabled = highlight
    ? 'bg-[rgba(74,222,128,0.06)] border-[rgba(74,222,128,0.35)] hover:bg-[rgba(74,222,128,0.1)] hover:border-[rgba(74,222,128,0.55)] hover:-translate-y-0.5 shadow-[0_0_16px_rgba(74,222,128,0.08)]'
    : 'bg-[rgba(50,52,64,0.55)] border-white/10 hover:bg-[rgba(50,52,64,0.7)] hover:border-white/20';
  const off = 'bg-white/[0.02] border-white/5 cursor-not-allowed opacity-50';
  return (
    <button
      data-testid={testId}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled && disabledReason ? disabledReason : undefined}
      aria-disabled={disabled || undefined}
      className={`${base} ${disabled ? off : enabled}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[12px] font-bold text-on-surface leading-tight">{label}</span>
      <span
        className={`text-[10px] leading-snug ${
          highlight && !disabled ? 'text-emerald-400 font-semibold' : 'text-on-surface/55'
        }`}
      >
        {disabled && disabledReason ? disabledReason : hint}
      </span>
    </button>
  );
}

export interface QuickActionsPanelProps {
  groupId: string;
  memberCount: number;
  quizSetsCount: number;
  isLeader: boolean;
  hasActiveScheduledQuiz: boolean;
  scheduledCount: number;
  onCreateQuizSet: () => void;
  onPostAnnouncement: () => void;
  onSwitchToQuizSets: () => void;
}

export default function QuickActionsPanel(props: QuickActionsPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const heading = (
    <h2 className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-3">
      ⚡ {t('groups.quickActions.title')}
    </h2>
  );

  if (props.isLeader) {
    const tournamentNeedsMembers = props.memberCount < 4;
    return (
      <section data-testid="group-quick-actions-leader">
        {heading}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionCard
            icon="📚"
            label={t('groups.action.createQuizSet')}
            hint={t('groups.action.createQuizSet.hint')}
            onClick={props.onCreateQuizSet}
            testId="qa-create-quizset"
          />
          <ActionCard
            icon="🎮"
            label={t('groups.action.startLive')}
            hint={t('groups.action.startLive.hint')}
            highlight
            onClick={props.onSwitchToQuizSets}
            testId="qa-start-live"
          />
          <ActionCard
            icon="🏆"
            label={t('groups.action.tournament')}
            hint={t('groups.action.tournament.hint')}
            disabled={tournamentNeedsMembers}
            disabledReason={t('groups.action.tournament.needMembers', { current: props.memberCount, min: 4 })}
            onClick={() => navigate(`/tournaments?groupId=${props.groupId}`)}
            testId="qa-tournament"
          />
          <ActionCard
            icon="📢"
            label={t('groups.action.announce')}
            hint={t('groups.action.announce.hint', { count: props.memberCount })}
            onClick={props.onPostAnnouncement}
            testId="qa-announce"
          />
        </div>
      </section>
    );
  }

  return (
    <section data-testid="group-quick-actions-member">
      {heading}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ActionCard
          icon="📚"
          label={t('groups.action.practice')}
          hint={t('groups.action.practice.hint', { count: props.quizSetsCount })}
          onClick={props.onSwitchToQuizSets}
          testId="qa-practice"
        />
        {props.hasActiveScheduledQuiz && (
          <ActionCard
            icon="📅"
            label={t('groups.action.scheduledQuiz')}
            hint={t('groups.action.scheduledQuiz.hint', { count: props.scheduledCount })}
            highlight
            onClick={() => navigate('/scheduled-quiz')}
            testId="qa-scheduled"
          />
        )}
      </div>
    </section>
  );
}
