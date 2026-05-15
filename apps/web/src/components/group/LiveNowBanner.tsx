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
  hostName?: string;
}

const MODE_LABELS: Record<string, string> = {
  GROUP_LIVE_SEQUENTIAL: '📚 Sequential',
  SPEED_RACE: '⚡ Speed Race',
  TEAM_VS_TEAM: '⚔️ Team vs Team',
  BATTLE_ROYALE: '💀 Battle Royale',
  SUDDEN_DEATH: '👑 Đấu vương',
  SEQUENTIAL: '📚 Sequential',
};

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
  const modeLabel = MODE_LABELS[room.mode] ?? room.mode;
  const meta = room.hostName
    ? t('groups.liveNow.metaWithHost', {
        mode: modeLabel,
        host: room.hostName,
        players: room.currentPlayers,
        max: room.maxPlayers,
      })
    : t('groups.liveNow.meta', {
        mode: modeLabel,
        players: room.currentPlayers,
        max: room.maxPlayers,
      });

  return (
    <div
      data-testid="group-live-now-banner"
      className="rounded-xl p-3 border-2 border-emerald-400/40 bg-emerald-500/10"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-base shrink-0">🎮</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold text-emerald-400 uppercase animate-pulse">● {t('groups.liveNow.label')}</span>
            <span className="text-[10px] text-on-surface/55">{formatRelative(room.createdAt, t)}</span>
            {rooms.length > 1 && (
              <span className="text-[10px] text-emerald-400 font-semibold ml-auto whitespace-nowrap">
                +{rooms.length - 1} {t('groups.liveNow.morePill')}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-on-surface mt-0.5 truncate">
            <span className="text-on-surface/55 font-normal">{t('groups.liveNow.roomLabel')}: </span>
            "{room.roomName}"
          </div>
          <div className="text-[10px] text-on-surface/70 mt-0.5 truncate">
            {meta}
          </div>
        </div>
        <button
          onClick={() => navigate(`/room/${room.roomCode}`)}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-[#11131e] text-xs font-bold whitespace-nowrap shadow-[0_0_12px_rgba(74,222,128,0.3)]"
        >
          {t('groups.liveNow.join')} →
        </button>
      </div>
    </div>
  );
}
