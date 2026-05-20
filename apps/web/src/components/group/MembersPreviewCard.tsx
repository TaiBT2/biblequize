import { useTranslation } from 'react-i18next';
import { resolveAvatar } from '../../utils/avatar';

export interface MemberPreview {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  lastActiveAt?: string | null;
}

interface Props {
  members: MemberPreview[];
  total: number;
  onViewAll: () => void;
}

// GD-FIX-3 — until real presence (BL-17) ships, treat a member as "online"
// when GroupMember.lastActiveAt is within ONLINE_WINDOW_MS. This is a
// degraded heuristic: the field is bumped on Ranked / scheduled-quiz /
// daily-mission completions (see RankedController.java:328 etc.), so it
// trends upward with use but won't reflect "tab open" presence. Acceptable
// trade-off until Redis presence lands.
const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isOnline(member: MemberPreview): boolean {
  if (!member.lastActiveAt) return false;
  const ts = Date.parse(member.lastActiveAt);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < ONLINE_WINDOW_MS;
}

function Avatar({ member, withOnlineDot }: { member: MemberPreview; withOnlineDot?: boolean }) {
  return (
    <div
      title={`${member.name}${member.role === 'LEADER' ? ' · 👑 Leader' : member.role === 'MOD' ? ' · 🛡️ Mod' : ''}`}
      className="relative w-9 h-9 rounded-full bg-[rgba(232,168,50,0.15)] border border-[rgba(232,168,50,0.3)] flex items-center justify-center text-[12px] font-bold text-secondary overflow-hidden shrink-0"
    >
      {(() => {
        const r = resolveAvatar(member.avatarUrl, member.name);
        if (r.kind === 'img')    return <img src={r.src} alt={member.name} className="w-full h-full object-cover" />;
        if (r.kind === 'preset') return <span className="w-full h-full flex items-center justify-center text-base" style={{ background: r.preset.bg }} aria-hidden>{r.preset.emoji}</span>;
        return r.initial;
      })()}
      {member.role === 'LEADER' && (
        <span className="absolute -top-0.5 -right-0.5 text-[8px]">👑</span>
      )}
      {member.role === 'MOD' && (
        <span className="absolute -top-0.5 -right-0.5 text-[8px]">🛡️</span>
      )}
      {withOnlineDot && (
        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#11131e]" />
      )}
    </div>
  );
}

export default function MembersPreviewCard({ members, total, onViewAll }: Props) {
  const { t } = useTranslation();
  const onlineMembers = members.filter(isOnline);
  const offlineMembers = members.filter((m) => !isOnline(m));
  const isEmpty = members.length === 0;

  return (
    <section
      data-testid="group-members-preview"
      className="bg-[rgba(50,52,64,0.55)] border border-white/10 rounded-xl p-4 backdrop-blur-md"
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
      {isEmpty ? (
        <p className="text-[12px] text-on-surface/55 text-center py-4">
          {t('groups.noMembers')}
        </p>
      ) : (
        <>
          {onlineMembers.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t('groups.membersPreview.onlineHeader', { count: onlineMembers.length })}
              </div>
              <ul className="space-y-1.5">
                {onlineMembers.slice(0, 5).map((m) => (
                  <li key={m.userId} className="flex items-center gap-2">
                    <Avatar member={m} withOnlineDot />
                    <span className="text-[12px] text-on-surface font-semibold truncate flex-1">{m.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {offlineMembers.length > 0 && (
            <div className={onlineMembers.length > 0 ? 'pt-3 border-t border-white/5' : ''}>
              {/* GD-FIX-R2-1: only render the "Khác (N)" sub-header when an
                  online section above it exists — otherwise the main h2
                  ("Thành viên (total)") already labels the row, and a second
                  "Thành viên (N)" sub-header duplicates the count. */}
              {onlineMembers.length > 0 && (
                <div className="text-[9px] font-bold text-on-surface/55 uppercase tracking-wider mb-2">
                  {t('groups.membersPreview.othersHeader', { count: offlineMembers.length })}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {offlineMembers.slice(0, 8).map((m) => (
                  <Avatar key={m.userId} member={m} />
                ))}
                {offlineMembers.length > 8 && (
                  <button
                    onClick={onViewAll}
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-[10px] text-on-surface/55 hover:text-secondary hover:border-secondary/40 transition-colors"
                  >
                    +{offlineMembers.length - 8}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
