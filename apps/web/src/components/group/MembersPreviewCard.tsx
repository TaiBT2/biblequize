import { useTranslation } from 'react-i18next';

export interface MemberPreview {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: string;
}

interface Props {
  members: MemberPreview[];
  total: number;
  onViewAll: () => void;
}

export default function MembersPreviewCard({ members, total, onViewAll }: Props) {
  const { t } = useTranslation();
  const top = members.slice(0, 8);

  return (
    <section
      data-testid="group-members-preview"
      className="bg-[rgba(50,52,64,0.4)] border border-white/10 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-bold text-secondary uppercase tracking-wider">
          👥 {t('groups.membersTitle')} ({total})
        </h2>
        <button
          onClick={onViewAll}
          className="text-[10px] text-on-surface/55 hover:text-secondary transition-colors"
        >
          {t('groups.viewAll')} →
        </button>
      </div>
      {top.length === 0 ? (
        <p className="text-[12px] text-on-surface/55 text-center py-4">
          {t('groups.noMembers')}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {top.map((m) => (
            <div
              key={m.userId}
              title={`${m.name}${m.role === 'LEADER' ? ' · 👑' : m.role === 'MOD' ? ' · 🛡️' : ''}`}
              className="relative w-10 h-10 rounded-full bg-[rgba(232,168,50,0.15)] border border-[rgba(232,168,50,0.3)] flex items-center justify-center text-[12px] font-bold text-secondary overflow-hidden"
            >
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                (m.name || '?').charAt(0).toUpperCase()
              )}
              {m.role === 'LEADER' && (
                <span className="absolute -top-0.5 -right-0.5 text-[8px]">👑</span>
              )}
              {m.role === 'MOD' && (
                <span className="absolute -top-0.5 -right-0.5 text-[8px]">🛡️</span>
              )}
            </div>
          ))}
          {total > top.length && (
            <button
              onClick={onViewAll}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-[10px] text-on-surface/55 hover:text-secondary hover:border-secondary/40 transition-colors"
            >
              +{total - top.length}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
