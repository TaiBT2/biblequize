import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  groupId: string;
  groupCreatedAt?: string;
  memberCount: number;
  quizSetsCount: number;
  announcementsCount: number;
  isLeader: boolean;
  onInvite: () => void;
  onCreateQuizSet: () => void;
  onPostAnnouncement: () => void;
}

function isNewGroup(createdAt?: string): boolean {
  if (!createdAt) return true;
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days < 7;
}

export default function NewGroupOnboarding(props: Props) {
  const { t } = useTranslation();
  const dismissKey = `bq_onboarding_dismissed_${props.groupId}`;
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(dismissKey) === '1'; } catch { return false; }
  });

  const isNew = isNewGroup(props.groupCreatedAt);
  const isSmall = props.memberCount < 5;
  const showBanner = props.isLeader && (isNew || isSmall) && !dismissed;
  if (!showBanner) return null;

  const tasks = [
    { icon: '👥', label: t('groups.onboarding.task1'), done: props.memberCount >= 5, action: props.onInvite },
    { icon: '📚', label: t('groups.onboarding.task2'), done: props.quizSetsCount > 0, action: props.onCreateQuizSet },
    { icon: '📢', label: t('groups.onboarding.task3'), done: props.announcementsCount > 0, action: props.onPostAnnouncement },
  ];
  const completed = tasks.filter((task) => task.done).length;

  const handleDismiss = () => {
    try { localStorage.setItem(dismissKey, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div
      data-testid="group-onboarding-banner"
      className="rounded-2xl p-4 sm:p-5 border border-[rgba(232,168,50,0.35)] mb-1"
      style={{ background: 'rgba(232,168,50,0.07)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
            👋 {t('groups.onboarding.title')}
          </div>
          <div className="text-[13px] text-on-surface">
            {t('groups.onboarding.subtitle', { completed, total: tasks.length })}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label={t('common.close')}
          className="text-on-surface/40 hover:text-on-surface w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-[18px] leading-none"
        >
          ×
        </button>
      </div>

      <ul className="space-y-2">
        {tasks.map((task, idx) => (
          <li key={idx}>
            <button
              type="button"
              onClick={task.done ? undefined : task.action}
              disabled={task.done}
              data-testid={`onboarding-task-${idx}`}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-colors text-left ${
                task.done
                  ? 'border-emerald-400/30 bg-emerald-500/5 cursor-default'
                  : 'border-white/10 hover:border-[rgba(232,168,50,0.4)] hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-[18px]">{task.done ? '✅' : task.icon}</span>
              <span className={`flex-1 text-[12px] ${task.done ? 'text-emerald-400 line-through' : 'text-on-surface'}`}>
                {task.label}
              </span>
              {!task.done && <span className="text-secondary text-[12px] font-semibold">→</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
