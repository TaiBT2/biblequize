import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';

interface GroupMember {
  userId: string;
  lastActiveAt?: string | null;
}

interface GroupSummary {
  id: string;
  name?: string;
  memberCount?: number;
  members?: GroupMember[];
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const isOnline = (m: GroupMember): boolean => {
  if (!m.lastActiveAt) return false;
  const ts = Date.parse(m.lastActiveAt);
  return Number.isFinite(ts) && Date.now() - ts < ONLINE_WINDOW_MS;
};

interface ActiveRoom {
  id: string;
  roomCode: string;
  roomName: string;
  status: 'LOBBY' | 'IN_PROGRESS';
  currentPlayers: number;
  maxPlayers: number;
}

// Sidebar widget shown only when the user is inside a specific group route
// (`/groups/:id*`). Replaces the personal Streak + Daily Mission widgets.
// Mirrors the "Group quick info" card in MOCKUP_GROUP_DETAIL_REDESIGN.html.
//
// Sources:
//  - GET /api/groups/:id            → name + memberCount
//  - GET /api/groups/:id/live-rooms → active rooms (LOBBY / IN_PROGRESS)
//
// The "Đang online N/total" count from the mockup needs presence tracking
// that doesn't exist yet (no `online` field on members). For now we surface
// totalMembers as the denominator and active-room players as a lightweight
// proxy for "currently active". Replace with real presence in BL-17 when
// Activity Feed lands.
export default function GroupQuickInfoSidebar({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/groups/${groupId}`).then((res) => {
      if (!cancelled && res.data?.success) setGroup(res.data.group);
    }).catch(() => { /* ignore */ });

    const loadRooms = () => {
      api.get(`/api/groups/${groupId}/live-rooms`).then((res) => {
        if (!cancelled && res.data?.success) setRooms(res.data.rooms || []);
      }).catch(() => { /* ignore */ });
    };
    loadRooms();
    const iv = setInterval(loadRooms, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [groupId]);

  const totalMembers = group?.memberCount ?? group?.members?.length ?? 0;
  const onlineCount = (group?.members ?? []).filter(isOnline).length;

  return (
    <div
      data-testid="group-quick-info-sidebar"
      className="rounded-xl p-3 border border-emerald-400/20"
      style={{ background: 'rgba(74,222,128,0.05)' }}
    >
      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className="text-base animate-pulse">🟢</span>
        <span>{t('groups.sidebarInfo.activeNow')}</span>
      </div>
      <div className="text-2xl font-extrabold text-on-surface leading-none">
        {onlineCount}
        <span className="text-xs text-on-surface/55 font-normal ml-1">/ {totalMembers}</span>
      </div>
      {group?.name && (
        <div className="text-[10px] text-on-surface/55 mt-1 truncate">{group.name}</div>
      )}

      {rooms.length > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-400/15">
          <div className="text-[9px] text-on-surface/55 uppercase font-semibold mb-1.5 flex items-center gap-1">
            🎮 <span>{t('groups.sidebarInfo.openRooms')}</span>
            <span className="ml-auto text-emerald-400 font-bold">{rooms.length}</span>
          </div>
          <div className="space-y-0.5">
            {rooms.slice(0, 3).map((room) => (
              <button
                key={room.id}
                onClick={() => navigate(`/room/${room.roomCode}`)}
                className="text-[11px] text-emerald-400 hover:underline block leading-tight text-left w-full truncate"
                title={room.roomName}
              >
                "{room.roomName}" →
              </button>
            ))}
            {rooms.length > 3 && (
              <div className="text-[10px] text-on-surface/40 mt-1">
                {t('groups.sidebarInfo.moreRooms', { count: rooms.length - 3 })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
