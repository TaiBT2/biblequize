import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';

interface ActiveRoom {
  id: string;
  roomCode: string;
  roomName: string;
  mode: string;
  status: 'LOBBY' | 'IN_PROGRESS';
  currentPlayers: number;
  maxPlayers: number;
  createdAt: string;
}

function formatRelative(iso: string, t: (k: string, v?: any) => string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '';
  const diffMin = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 1) return t('groups.timeJustNow');
  if (diffMin < 60) return t('groups.timeMinutesAgo', { count: diffMin });
  return t('groups.timeHoursAgo', { count: Math.round(diffMin / 60) });
}

export default function LiveNowBanner({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get(`/api/groups/${groupId}/live-rooms`);
        if (!cancelled && res.data.success) setRooms(res.data.rooms || []);
      } catch { /* ignore */ }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [groupId]);

  if (rooms.length === 0) return null;
  const room = rooms[0];

  return (
    <div
      data-testid="group-live-now-banner"
      className="rounded-xl p-3 border border-emerald-400/40 bg-emerald-500/10"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-base shrink-0">🎮</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold text-emerald-400 uppercase animate-pulse">● {t('groups.liveNow.label')}</span>
            <span className="text-[10px] text-on-surface/55">{formatRelative(room.createdAt, t)}</span>
          </div>
          <div className="text-sm font-bold text-on-surface mt-0.5 truncate">{room.roomName}</div>
          <div className="text-[10px] text-on-surface/70 mt-0.5 truncate">
            {t('groups.liveNow.meta', { mode: room.mode, players: room.currentPlayers, max: room.maxPlayers })}
          </div>
        </div>
        <button
          onClick={() => navigate(`/room/${room.roomCode}`)}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-[#11131e] text-xs font-bold whitespace-nowrap"
        >
          {t('groups.liveNow.join')} →
        </button>
      </div>
      {rooms.length > 1 && (
        <div className="text-[10px] text-on-surface/55 mt-1.5 pl-12">
          {t('groups.liveNow.more', { count: rooms.length - 1 })}
        </div>
      )}
    </div>
  );
}
