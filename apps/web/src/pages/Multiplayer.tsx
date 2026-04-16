import { useState, useEffect, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/authStore';

interface PublicRoom {
  id: string;
  roomCode: string;
  roomName: string;
  hostName?: string;
  mode: string;
  difficulty?: string;
  currentPlayers: number;
  maxPlayers: number;
  status?: 'WAITING' | 'IN_GAME' | 'FINISHED';
  questionCount?: number;
  topic?: string;
}

const MODE_LABELS: Record<string, string> = {
  SPEED_RACE: 'Speed Race',
  BATTLE_ROYALE: 'Battle Royale',
  TEAM_VS_TEAM: 'Team vs Team',
  SUDDEN_DEATH: 'Sudden Death',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const ROOM_ICONS = ['auto_stories', 'menu_book', 'psychology', 'emoji_events'];

const FILL_1: CSSProperties = { fontVariationSettings: "'FILL' 1" };

const Multiplayer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchPublicRooms();
  }, [isAuthenticated, navigate]);

  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms/public', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await res.json();
      if (data.success) setPublicRooms(data.rooms || []);
    } catch {
      // silently ignore
    } finally {
      setLoadingRooms(false);
    }
  };

  if (!isAuthenticated) return null;

  const waitingRooms = publicRooms.filter(r => r.status === 'WAITING' || r.status === undefined);
  const activeGames = publicRooms.filter(r => r.status === 'IN_GAME');
  const finishedGames = publicRooms.filter(r => r.status === 'FINISHED');
  const allRooms = [...waitingRooms, ...activeGames, ...finishedGames];
  const liveCount = waitingRooms.length + activeGames.length;

  const getRoomIcon = (index: number) => ROOM_ICONS[index % ROOM_ICONS.length];

  const getStatusLabel = (room: PublicRoom) => {
    if (room.status === 'IN_GAME') return { text: t('multiplayer.statusPlaying'), className: 'text-error' };
    if (room.status === 'FINISHED') return { text: t('multiplayer.statusFinished'), className: 'text-on-surface-variant' };
    return { text: t('multiplayer.statusWaiting'), className: 'text-secondary' };
  };

  const isFull = (room: PublicRoom) => room.currentPlayers >= room.maxPlayers;

  return (
    <div className="space-y-8" data-testid="multiplayer-page">

      {/* -- Page Header -- */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-on-surface tracking-tight">{t('multiplayer.title')}</h2>
        <button
          data-testid="multiplayer-create-btn"
          onClick={() => navigate('/room/create')}
          className="flex items-center gap-2 py-2.5 px-6 rounded-lg gold-gradient text-on-secondary font-extrabold text-sm tracking-tight shadow-md hover:shadow-secondary/20 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          + {t('multiplayer.createRoom')}
        </button>
      </div>

      {/* -- Join Section: Code Input + Featured Card -- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Join by code */}
        <div className="md:col-span-2 p-8 rounded-2xl bg-surface-container flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-secondary">
          <div>
            <h3 className="text-xl font-bold text-on-surface mb-1">{t('multiplayer.joinByCode')}</h3>
            <p className="text-on-surface-variant text-sm">{t('multiplayer.joinByCodeDesc')}</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder={t('multiplayer.codePlaceholder')}
              maxLength={6}
              className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-center text-xl font-black tracking-[0.5em] text-secondary placeholder:text-outline/30 focus:ring-2 focus:ring-secondary/50 w-full md:w-48 outline-none"
              onKeyDown={e => { if (e.key === 'Enter' && joinCode.trim()) navigate(`/room/join?code=${joinCode.trim()}`); }}
            />
            <button
              data-testid="multiplayer-join-btn"
              onClick={() => { if (joinCode.trim()) navigate(`/room/join?code=${joinCode.trim()}`); }}
              disabled={!joinCode.trim()}
              className="bg-surface-container-highest hover:bg-surface-variant text-secondary font-bold py-3 px-8 rounded-xl transition-all border border-secondary/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('multiplayer.joinBtn')}
            </button>
          </div>
        </div>

        {/* Featured quiz card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-8xl text-secondary">auto_awesome</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold mb-2">{t('multiplayer.featuredToday')}</p>
          <h4 className="text-lg font-bold leading-tight">{t('multiplayer.featuredTitle')}</h4>
          <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span> {t('multiplayer.featuredTime')}
          </p>
        </div>
      </section>

      {/* -- Room List Section -- */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold">{t('multiplayer.waitingRooms')}</h3>
            <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest">
              Live {liveCount}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPublicRooms}
              disabled={loadingRooms}
              className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined ${loadingRooms ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <button className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>

        {allRooms.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
            <div className="w-24 h-24 rounded-full bg-surface-variant flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-outline-variant">sentiment_dissatisfied</span>
            </div>
            <h5 className="text-xl font-bold text-on-surface mb-2">{t('multiplayer.emptyTitle')}</h5>
            <p className="text-on-surface-variant max-w-xs text-center mb-8">
              {t('multiplayer.emptyDesc')}
            </p>
            <button
              onClick={() => navigate('/room/create')}
              className="py-3 px-8 rounded-xl gold-gradient text-on-secondary font-bold shadow-lg"
            >
              {t('multiplayer.createRoomNow')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {allRooms.map((room, index) => {
              const status = getStatusLabel(room);
              const roomFull = isFull(room);
              const isFinished = room.status === 'FINISHED';
              const isPlaying = room.status === 'IN_GAME';
              const isWaiting = !isFinished && !isPlaying;

              return (
                <div
                  key={room.id}
                  className="group bg-surface-container hover:bg-surface-container-high p-6 rounded-2xl transition-all duration-300 flex flex-col gap-4"
                >
                  {/* Room header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-3xl">{getRoomIcon(index)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-on-surface group-hover:text-secondary transition-colors">
                          {room.roomName}
                        </h4>
                        {room.hostName && (
                          <p className="text-xs text-on-surface-variant">
                            Host: <span className="text-on-surface">{room.hostName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 text-on-surface font-black ${roomFull || isFinished ? 'opacity-50' : ''}`}>
                        <span
                          className={`material-symbols-outlined text-sm ${isWaiting && !roomFull ? 'text-secondary' : 'text-outline'}`}
                          style={isWaiting && !roomFull ? FILL_1 : undefined}
                        >
                          person
                        </span>
                        {room.currentPlayers}/{room.maxPlayers}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${status.className}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>

                  {/* Settings pills */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {room.questionCount && (
                      <span className="px-3 py-1 rounded-full bg-surface-container-highest text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">quiz</span> {room.questionCount} {t('multiplayer.questions')}
                      </span>
                    )}
                    {room.difficulty && (
                      <span className="px-3 py-1 rounded-full bg-surface-container-highest text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">signal_cellular_alt</span> {DIFFICULTY_LABELS[room.difficulty] || room.difficulty}
                      </span>
                    )}
                    {room.mode && (
                      <span className="px-3 py-1 rounded-full bg-surface-container-highest text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">stadia_controller</span> {MODE_LABELS[room.mode] || room.mode.replace(/_/g, ' ')}
                      </span>
                    )}
                    {room.topic && (
                      <span className="px-3 py-1 rounded-full bg-secondary/10 text-[11px] text-secondary font-medium">
                        {room.topic}
                      </span>
                    )}
                  </div>

                  {/* Action button */}
                  {isWaiting && !roomFull && (
                    <button
                      onClick={() => navigate(`/room/${room.id}/lobby`)}
                      className="mt-2 w-full py-3 rounded-xl border border-outline-variant/30 hover:bg-secondary hover:text-on-secondary hover:border-transparent font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      {t('multiplayer.enterRoom')} <span className="material-symbols-outlined text-sm">login</span>
                    </button>
                  )}
                  {isWaiting && roomFull && (
                    <button
                      disabled
                      className="mt-2 w-full py-3 rounded-xl bg-surface-container-highest text-on-surface-variant/40 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {t('multiplayer.roomFull')} <span className="material-symbols-outlined text-sm">lock</span>
                    </button>
                  )}
                  {isPlaying && (
                    <button
                      onClick={() => navigate(`/room/${room.id}/spectate`)}
                      className="mt-2 w-full py-3 rounded-xl border border-outline-variant/30 hover:bg-secondary hover:text-on-secondary hover:border-transparent font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      {t('multiplayer.spectate')} <span className="material-symbols-outlined text-sm">visibility</span>
                    </button>
                  )}
                  {isFinished && (
                    <button
                      onClick={() => navigate(`/room/${room.id}/results`)}
                      className="mt-2 w-full py-3 rounded-xl bg-surface-container-highest text-secondary font-bold text-sm hover:bg-surface-variant transition-all flex items-center justify-center gap-2"
                    >
                      {t('multiplayer.viewResults')} <span className="material-symbols-outlined text-sm">leaderboard</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Multiplayer;
