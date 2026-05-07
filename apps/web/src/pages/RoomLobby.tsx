import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStomp } from '../hooks/useStomp';
import { api } from '../api/client';
import SequentialLobbyView from './room/SequentialLobbyView';
import InviteShareModal from '../components/room/InviteShareModal';

type Player = {
  id: string; userId: string; username: string; avatarUrl?: string;
  isReady: boolean; score: number; team?: string; playerStatus?: string;
  tier?: string;
};
type RoomDetails = {
  id: string; roomCode: string; roomName: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'ENDED' | 'CANCELLED';
  mode: string; isPublic: boolean;
  maxPlayers: number; currentPlayers: number;
  questionCount: number; timePerQuestion: number;
  hostId: string; hostName: string; players: Player[];
  questionSource?: 'DATABASE' | 'CUSTOM';
  questionSetId?: string | null;
  bookScope?: string;
  difficulty?: string;
  createdAt?: string;
  myUserId?: string;
  /** Owning group when room was spawned from a group quiz set; null otherwise.
   *  Server-side fallback so "back to group" works for users who joined via
   *  room code (no fromGroupId in nav state) or after a page refresh. */
  groupId?: string | null;
};
type ChatMessage = {
  sender: string; text: string;
  isHost?: boolean; isSystem?: boolean; time?: string;
};

type ModeInfo = {
  label: string; icon: string;
  ruleTitle: string; ruleText: string; ruleDetail?: string;
  chipColor: string; chipBg: string; chipBorder: string;
};

const MODE_INFO: Record<string, ModeInfo> = {
  SPEED_RACE: {
    label: 'Speed Race', icon: 'bolt',
    ruleTitle: 'Luật Speed Race',
    ruleText: 'Trả lời nhanh + đúng để ghi điểm cao nhất.',
    ruleDetail: 'Tốc độ + chính xác cùng quyết định thứ hạng. Ai trả lời nhanh hơn và đúng hơn sẽ giành điểm cao nhất.',
    chipColor: '#fbbf24', chipBg: 'rgba(232,168,50,0.15)', chipBorder: 'rgba(232,168,50,0.4)',
  },
  BATTLE_ROYALE: {
    label: 'Battle Royale', icon: 'favorite',
    ruleTitle: 'Luật Battle Royale',
    ruleText: 'Sai = Loại. Người đúng cuối cùng thắng.',
    ruleDetail: 'Mỗi câu sai sẽ bị loại khỏi vòng tiếp theo. Tối đa 30 câu/trận. Khi cả nhóm cùng sai 1 câu, không ai bị loại.',
    chipColor: '#f87171', chipBg: 'rgba(239,68,68,0.15)', chipBorder: 'rgba(239,68,68,0.4)',
  },
  TEAM_VS_TEAM: {
    label: 'Team vs Team', icon: 'groups_2',
    ruleTitle: 'Luật Team vs Team',
    ruleText: 'Hai đội cạnh tranh — đội nhiều điểm hơn thắng.',
    ruleDetail: 'Hai đội cạnh tranh nhau. Đội nào ghi nhiều điểm hơn sau tất cả câu hỏi sẽ thắng. Phối hợp với đồng đội!',
    chipColor: '#60a5fa', chipBg: 'rgba(96,165,250,0.15)', chipBorder: 'rgba(96,165,250,0.4)',
  },
  SUDDEN_DEATH: {
    label: 'Sudden Death', icon: 'swords',
    ruleTitle: 'Luật Sudden Death',
    ruleText: 'Sai một câu là thua. Hai người đấu tay đôi.',
    ruleDetail: 'Chỉ 2 người đấu cùng lúc. Sai 1 câu là thua. Người chiến thắng sẽ đấu tiếp người tiếp theo trong hàng đợi.',
    chipColor: '#c084fc', chipBg: 'rgba(192,132,252,0.15)', chipBorder: 'rgba(192,132,252,0.4)',
  },
  GROUP_LIVE_SEQUENTIAL: {
    label: 'Chơi cùng nhau', icon: 'group',
    ruleTitle: 'Luật Chơi cùng nhau',
    ruleText: 'Mọi người trả lời tuần tự — chờ tất cả xong mới hiện đáp án.',
    chipColor: '#a78bfa', chipBg: 'rgba(167,139,250,0.15)', chipBorder: 'rgba(167,139,250,0.4)',
  },
};

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó', MIXED: 'Hỗn hợp',
};

const QUICK_EMOJIS = ['🙏', '🔥', '👏', '💡', '✨'];

const myUsername = () => localStorage.getItem('userName') ?? '';

const fmtTime = (iso?: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch { return ''; }
};

const nowTime = () => fmtTime(new Date().toISOString());

// ─────────────────────────────────────────────────────────────────────────────

const RoomLobby: React.FC = () => {
  const { t } = useTranslation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialRoom: RoomDetails | undefined = location.state?.room;
  const [room, setRoom] = useState<RoomDetails | null>(initialRoom ?? null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [switchingTeam, setSwitchingTeam] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    sender: 'SYSTEM',
    text: 'Phòng đã được tạo. Đang chờ người chơi tham gia...',
    isSystem: true,
    time: nowTime(),
  }]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [showInvite, setShowInvite] = useState(false);
  const [showRulesDetail, setShowRulesDetail] = useState(false);
  const [kickMenuFor, setKickMenuFor] = useState<string | null>(null);

  const { connected, reconnecting, send } = useStomp({
    roomId,
    onReconnect: () => { fetchRoom(); },
    onMessage: (msg) => {
      switch (msg.type) {
        case 'PLAYER_JOINED':
        case 'PLAYER_LEFT':
        case 'PLAYER_READY':
        case 'PLAYER_UNREADY':
        case 'PLAYER_KICKED':
          fetchRoom();
          break;
        case 'CHAT_MESSAGE': {
          const d = msg.data as { sender: string; text: string };
          setChatMessages(prev => [...prev, {
            sender: d.sender, text: d.text,
            isHost: d.sender === room?.hostName,
            time: nowTime(),
          }]);
          if (!chatOpen) setUnreadChat(c => c + 1);
          break;
        }
        case 'GAME_STARTING': {
          const d = msg.data as { countdown: number };
          setCountdown(d.countdown);
          const myTeam = room?.players?.find(p => p.userId === room?.myUserId)?.team ?? null;
          const navState = location.state as { fromGroupId?: string } | null;
          const fromGroupId = navState?.fromGroupId ?? room?.groupId ?? undefined;
          setTimeout(() => navigate(`/room/${roomId}/quiz`, {
            replace: true, state: { mode: room?.mode, myTeam, isHost, hostId: room?.hostId, fromGroupId }
          }), d.countdown * 1000);
          break;
        }
        case 'ROOM_STARTING':
        case 'QUESTION_START': {
          const navState = location.state as { fromGroupId?: string } | null;
          const fromGroupId = navState?.fromGroupId ?? room?.groupId ?? undefined;
          navigate(`/room/${roomId}/quiz`, {
            replace: true,
            state: { mode: room?.mode, myTeam: room?.players?.find(p => p.userId === room?.myUserId)?.team ?? null, isHost, hostId: room?.hostId, fromGroupId }
          });
          break;
        }
        case 'QUIZ_END':
          fetchRoom();
          break;
      }
    },
  });

  const fetchRoom = async () => {
    if (!roomId) return;
    try {
      const res = await api.get(`/api/rooms/${roomId}`);
      if (res.data.success) setRoom(res.data.room);
      else setError(res.data.message || t('room.errorFetchRoom'));
    } catch {
      setError(t('room.errorNetwork'));
    }
  };

  useEffect(() => { fetchRoom(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Auto-open chat panel on desktop when ≥2 players join (one-time per session)
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (!autoOpenedRef.current && !isMobile && (room?.currentPlayers ?? 0) >= 2) {
      setChatOpen(true);
      autoOpenedRef.current = true;
    }
  }, [room?.currentPlayers, isMobile]);

  // Reset unread when chat opens
  useEffect(() => { if (chatOpen) setUnreadChat(0); }, [chatOpen]);

  // Close kick menu on outside click
  useEffect(() => {
    if (!kickMenuFor) return;
    const onDoc = () => setKickMenuFor(null);
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [kickMenuFor]);

  // Throttle 600ms — WS round-trip is ~200-500ms so a fast double-click
  // would otherwise toggle ready twice and confuse the lobby state.
  const togglingReadyRef = useRef(false);
  const handleToggleReady = () => {
    if (!roomId || togglingReadyRef.current) return;
    togglingReadyRef.current = true;
    send(`/app/room/${roomId}/ready`, {});
    setTimeout(() => { togglingReadyRef.current = false; }, 600);
  };
  const handleStart = async () => {
    if (!roomId) return;
    try {
      await api.post(`/api/rooms/${roomId}/start`);
      send(`/app/room/${roomId}/start`, {});
    } catch (err: any) {
      setError(err?.response?.data?.message || t('room.errorStartRoom'));
    }
  };
  const handleSwitchTeam = async () => {
    if (!roomId) return;
    setSwitchingTeam(true);
    try {
      const res = await api.post(`/api/rooms/${roomId}/switch-team`);
      if (res.data.success) setRoom(res.data.room);
    } catch { setError(t('room.errorSwitchTeam')); }
    finally { setSwitchingTeam(false); }
  };
  const handleSendChat = (text: string) => {
    if (!text.trim() || !roomId) return;
    send(`/app/room/${roomId}/chat`, { text: text.trim() });
    setChatInput('');
  };
  const handleLeave = async () => {
    if (roomId) { try { await api.post(`/api/rooms/${roomId}/leave`); } catch { /* ignore */ } }
    const navState = location.state as { fromGroupId?: string } | null;
    const fromGroupId = navState?.fromGroupId ?? room?.groupId ?? undefined;
    navigate(fromGroupId ? `/groups/${fromGroupId}` : '/multiplayer');
  };
  const handleKick = async (userId: string) => {
    if (!roomId) return;
    setKickMenuFor(null);
    try {
      await api.post(`/api/rooms/${roomId}/kick`, { userId });
      fetchRoom();
    } catch { /* server emits PLAYER_KICKED on success */ }
  };

  const isTeamVsTeam = room?.mode === 'TEAM_VS_TEAM';
  const isSuddenDeath = room?.mode === 'SUDDEN_DEATH';
  const isSequential = room?.mode === 'GROUP_LIVE_SEQUENTIAL';
  const teamAPlayers = room?.players?.filter(p => p.team === 'A') ?? [];
  const teamBPlayers = room?.players?.filter(p => p.team === 'B') ?? [];
  const myPlayer = room?.players?.find(p =>
    room?.myUserId ? p.userId === room.myUserId : p.username === myUsername()
  );
  const isHost = myPlayer?.userId === room?.hostId;
  const emptySlots = room ? Math.max(0, room.maxPlayers - room.currentPlayers) : 0;
  const modeInfo = MODE_INFO[room?.mode ?? ''] ?? {
    label: room?.mode ?? '', icon: 'sports_esports',
    ruleTitle: 'Luật chơi', ruleText: '', ruleDetail: '',
    chipColor: '#e8a832', chipBg: 'rgba(232,168,50,0.15)', chipBorder: 'rgba(232,168,50,0.4)',
  };

  const nonHostPlayers = useMemo(() => room?.players?.filter(p => p.userId !== room?.hostId) ?? [], [room]);
  const readyNonHostCount = useMemo(() => nonHostPlayers.filter(p => p.isReady).length, [nonHostPlayers]);
  const isGroupLive = room?.mode === 'GROUP_LIVE_SEQUENTIAL';
  const canStart = room?.status === 'LOBBY'
    && nonHostPlayers.length >= 1
    && (isGroupLive || readyNonHostCount === nonHostPlayers.length);

  const statusPrimary = (() => {
    if (!room) return '';
    if (room.currentPlayers < 2) return 'Đang chờ thêm người chơi...';
    if (isGroupLive) return 'Sẵn sàng bắt đầu';
    if (readyNonHostCount < nonHostPlayers.length) return 'Đang chờ tất cả sẵn sàng';
    return 'Đủ người · Có thể bắt đầu';
  })();
  const statusSecondary = (() => {
    if (!room) return '';
    const need = Math.max(0, 2 - room.currentPlayers);
    if (room.currentPlayers < 2) return `Cần thêm ${need} người để bắt đầu`;
    if (isGroupLive) return `${room.currentPlayers}/${room.maxPlayers} người · Trưởng nhóm có thể bắt đầu`;
    if (readyNonHostCount < nonHostPlayers.length) return `${readyNonHostCount}/${nonHostPlayers.length} người chơi đã sẵn sàng`;
    return `${room.currentPlayers}/${room.maxPlayers} người · Có thể bắt đầu`;
  })();

  /* ── Countdown overlay ── */
  if (countdown !== null) return (
    <div className="min-h-screen bg-surface-dim flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-bold text-secondary animate-bounce-in">{countdown}</div>
        <p className="text-xl text-on-surface-variant mt-4">{t('room.gameStarting')}</p>
      </div>
    </div>
  );

  /* ── Sequential mode lobby (Feature A "Chơi cùng nhau") ── */
  if (isSequential && room) {
    return (
      <SequentialLobbyView
        roomCode={room.roomCode}
        roomName={room.roomName}
        questionCount={room.questionCount}
        timePerQuestion={room.timePerQuestion}
        maxPlayers={room.maxPlayers}
        players={room.players ?? []}
        hostId={room.hostId}
        isHost={isHost}
        onStart={handleStart}
        onLeave={handleLeave}
        connected={connected}
        reconnecting={reconnecting}
        error={error}
      />
    );
  }

  /* ── Error state ── */
  if (error) return (
    <div className="min-h-screen bg-surface-dim flex items-center justify-center">
      <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-error text-5xl">error</span>
        <p className="text-error text-lg">{error}</p>
        <button onClick={() => navigate('/multiplayer')} className="text-secondary underline text-sm">{t('common.back')}</button>
      </div>
    </div>
  );

  /* ── Loading state ── */
  if (!room) return (
    <div className="min-h-screen bg-surface-dim flex items-center justify-center">
      <p className="text-on-surface-variant animate-pulse text-lg">{t('room.loadingRoom')}</p>
    </div>
  );

  // ─── Build the slot list (host first, others, then invite slot, then empty padding) ───
  const orderedPlayers: Player[] = [
    ...(room.players?.filter(p => p.userId === room.hostId) ?? []),
    ...(room.players?.filter(p => p.userId !== room.hostId) ?? []),
  ];

  const showChatPanel = !isMobile && chatOpen;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0a0b13', color: '#f3f4f6', fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {reconnecting && (
        <div className="fixed top-0 left-0 right-0 z-[70] bg-error-container/90 text-on-error-container text-center py-2 text-sm font-medium">
          <span className="material-symbols-outlined text-sm align-middle mr-1">wifi_off</span>
          {t('room.reconnecting')}
        </div>
      )}

      {/* ─── Topbar ─── */}
      <header
        className="flex items-center justify-between px-4 lg:px-6 py-3 border-b"
        style={{ background: '#0d0f17', borderColor: 'rgba(255,255,255,0.04)' }}
      >
        <button
          onClick={() => navigate('/multiplayer')}
          className="text-xs font-semibold inline-flex items-center gap-1.5 hover:text-on-surface"
          style={{ color: '#9ca3af' }}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Đa người chơi
        </button>
        <div className="inline-flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: connected ? '#4ade80' : '#f87171' }}
          />
          {connected ? 'Đã kết nối' : 'Mất kết nối'}
        </div>
        <button
          aria-label="Cài đặt"
          className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/5"
          style={{ background: 'rgba(50,52,64,0.5)', color: '#9ca3af' }}
        >
          <span className="material-symbols-outlined text-base">settings</span>
        </button>
      </header>

      {/* ─── Main: content + (optional) chat panel ─── */}
      <div className="flex-1 grid lg:grid-cols-[1fr_320px] overflow-hidden" style={{ minHeight: 0 }}>
        <div className="overflow-y-auto px-4 lg:px-7 py-4 lg:py-5 pb-24 lg:pb-28" data-testid="lobby-scroll-content">

          {/* ─── HERO BLOCK ─── */}
          <section
            className="rounded-2xl p-4 lg:p-6 mb-4 grid lg:grid-cols-[1fr_auto] gap-4 lg:gap-6 items-center"
            style={{
              background: 'rgba(50,52,64,0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(232,168,50,0.2)',
            }}
            data-testid="lobby-hero"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border"
                  style={{ color: modeInfo.chipColor, background: modeInfo.chipBg, borderColor: modeInfo.chipBorder }}
                >
                  <span className="material-symbols-outlined text-[13px]">{modeInfo.icon}</span>
                  {modeInfo.label}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border"
                  style={{
                    color: room.isPublic ? '#4ade80' : '#ff8c42',
                    background: room.isPublic ? 'rgba(74,222,128,0.1)' : 'rgba(255,140,66,0.1)',
                    borderColor: room.isPublic ? 'rgba(74,222,128,0.25)' : 'rgba(255,140,66,0.25)',
                  }}
                >
                  <span className="material-symbols-outlined text-[12px]">{room.isPublic ? 'public' : 'lock'}</span>
                  {room.isPublic ? 'Công khai' : 'Riêng tư'}
                </span>
              </div>
              <h1 className="text-[18px] lg:text-[22px] font-extrabold leading-tight mb-2 truncate">
                {room.roomName}
              </h1>
              <div className="flex items-center gap-2 lg:gap-4 text-[11px] lg:text-xs flex-wrap" style={{ color: '#9ca3af' }}>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ color: '#fbbf24' }}>quiz</span>
                  {room.questionCount} câu
                </span>
                <span style={{ color: '#4b5563' }}>·</span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ color: '#fbbf24' }}>timer</span>
                  {room.timePerQuestion}s/câu
                </span>
                <span style={{ color: '#4b5563' }}>·</span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ color: '#fbbf24' }}>tune</span>
                  {DIFFICULTY_LABEL[room.difficulty ?? ''] ?? 'Hỗn hợp'}
                </span>
                <span style={{ color: '#4b5563' }}>·</span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ color: '#fbbf24' }}>groups</span>
                  Tối đa {room.maxPlayers} người
                </span>
              </div>
            </div>

            {/* Code block */}
            <div
              className="rounded-2xl px-4 py-3 lg:py-4 text-center w-full lg:min-w-[220px]"
              style={{
                background: 'rgba(17,19,30,0.6)',
                border: '2px solid rgba(232,168,50,0.3)',
              }}
            >
              <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#9ca3af' }}>
                Mã phòng · Chia sẻ với bạn bè
              </div>
              <div
                className="font-extrabold mb-3"
                style={{
                  color: '#e8a832',
                  fontSize: 'clamp(24px, 4vw, 32px)',
                  letterSpacing: 6,
                  fontFamily: "'Courier New', monospace",
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
                data-testid="lobby-room-code"
              >
                {room.roomCode}
              </div>
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold"
                style={{
                  background: 'rgba(232,168,50,0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(232,168,50,0.3)',
                }}
                data-testid="lobby-share-btn"
              >
                <span className="material-symbols-outlined text-[15px]">share</span>
                Mời bạn bè · Copy / Link / QR
              </button>
            </div>
          </section>

          {/* ─── PLAYERS ─── */}
          <section className="mb-4" data-testid="lobby-player-grid">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 text-sm font-bold">
                <span className="material-symbols-outlined text-[17px]" style={{ color: '#e8a832' }}>groups</span>
                Người chơi
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{ color: '#fbbf24', background: 'rgba(232,168,50,0.12)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {room.currentPlayers}/{room.maxPlayers}
                </span>
              </div>
              {room.currentPlayers < 2 ? (
                <span className="text-[11px] font-semibold" style={{ color: '#fbbf24', opacity: 0.85 }}>
                  Cần thêm {2 - room.currentPlayers} người để bắt đầu
                </span>
              ) : canStart ? (
                <span className="text-[11px] font-bold inline-flex items-center gap-1" style={{ color: '#4ade80' }}>
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Đủ người · Sẵn sàng
                </span>
              ) : null}
            </div>

            {isTeamVsTeam ? (
              <TeamSplit
                teamAPlayers={teamAPlayers}
                teamBPlayers={teamBPlayers}
                hostId={room.hostId}
                myUserId={room.myUserId}
                isHost={isHost}
                myTeam={myPlayer?.team}
                kickMenuFor={kickMenuFor}
                setKickMenuFor={setKickMenuFor}
                onKick={handleKick}
                onSwitchTeam={handleSwitchTeam}
                switchingTeam={switchingTeam}
                onInvite={() => setShowInvite(true)}
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-2.5">
                {orderedPlayers.map((p, idx) => (
                  <PlayerSlot
                    key={p.id}
                    player={p}
                    hostId={room.hostId}
                    myUserId={room.myUserId}
                    suddenDeathOrder={isSuddenDeath ? idx : undefined}
                    canKick={isHost && p.userId !== room.hostId}
                    kickOpen={kickMenuFor === p.userId}
                    onKickToggle={() => setKickMenuFor(kickMenuFor === p.userId ? null : p.userId)}
                    onKickConfirm={() => handleKick(p.userId)}
                  />
                ))}
                {emptySlots > 0 && (
                  <InviteSlot onClick={() => setShowInvite(true)} />
                )}
                {Array.from({ length: Math.max(0, emptySlots - 1) }).map((_, i) => (
                  <EmptySlot key={`empty-${i}`} index={room.currentPlayers + 1 + i + 1} />
                ))}
              </div>
            )}
          </section>

          {/* ─── RULES ─── */}
          {modeInfo.ruleText && (
            <section
              className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
              style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.15)' }}
            >
              <div
                className="w-9 h-9 grid place-items-center rounded-lg flex-shrink-0"
                style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}
              >
                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
              </div>
              <div className="flex-1 min-w-0 text-xs" style={{ color: '#d1d5db', lineHeight: 1.5 }}>
                <div
                  className="text-[10px] uppercase tracking-wider font-bold mb-0.5"
                  style={{ color: '#93c5fd' }}
                >
                  {modeInfo.ruleTitle}
                </div>
                {modeInfo.ruleText}
              </div>
              {modeInfo.ruleDetail && (
                <button
                  type="button"
                  onClick={() => setShowRulesDetail(true)}
                  className="text-[11px] font-bold inline-flex items-center gap-0.5 flex-shrink-0"
                  style={{ color: '#60a5fa' }}
                  data-testid="lobby-rules-detail-btn"
                >
                  Chi tiết
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </button>
              )}
            </section>
          )}
        </div>

        {/* ─── CHAT PANEL (desktop, ≥2 players, opened) ─── */}
        {showChatPanel && (
          <ChatPanel
            messages={chatMessages}
            input={chatInput}
            setInput={setChatInput}
            onSend={handleSendChat}
            onClose={() => setChatOpen(false)}
            chatEndRef={chatEndRef}
          />
        )}
      </div>

      {/* ─── BOTTOM BAR ─── */}
      <footer
        className="grid grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] gap-3 lg:gap-4 items-center px-4 lg:px-6 py-3 lg:py-3.5 border-t"
        style={{
          background: 'rgba(13,15,23,0.95)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(232,168,50,0.1)',
        }}
      >
        <button
          data-testid="lobby-leave-btn"
          onClick={handleLeave}
          className="inline-flex items-center gap-1.5 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-xs lg:text-[13px] font-bold"
          style={{ background: 'transparent', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
        >
          <span className="material-symbols-outlined text-base">logout</span>
          {isMobile ? 'Rời' : 'Rời phòng'}
        </button>

        <div className="hidden lg:block text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: canStart ? '#4ade80' : '#fbbf24' }}>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: canStart ? '#4ade80' : '#fbbf24' }}
            />
            {statusPrimary}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>{statusSecondary}</div>
        </div>

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={!canStart}
            title={!canStart ? statusSecondary : undefined}
            data-testid="lobby-start-btn"
            className="inline-flex items-center justify-center gap-2 px-4 lg:px-7 py-3 lg:py-3.5 rounded-xl text-xs lg:text-sm font-extrabold disabled:cursor-not-allowed"
            style={{
              background: canStart
                ? 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)'
                : 'rgba(50,52,64,0.5)',
              color: canStart ? '#11131e' : '#6b7280',
              boxShadow: canStart ? '0 6px 20px rgba(232,168,50,0.3)' : 'none',
            }}
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            {canStart ? 'Bắt đầu' : (isMobile ? 'Chờ thêm' : 'Đang chờ...')}
          </button>
        ) : (
          <button
            data-testid="lobby-ready-btn"
            onClick={handleToggleReady}
            className="inline-flex items-center justify-center gap-1.5 px-4 lg:px-7 py-3 lg:py-3.5 rounded-xl text-xs lg:text-sm font-extrabold"
            style={{
              background: myPlayer?.isReady
                ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                : 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)',
              color: '#11131e',
              boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            }}
          >
            <span className="material-symbols-outlined text-lg">
              {myPlayer?.isReady ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            {myPlayer?.isReady ? 'Sẵn sàng' : 'Sẵn sàng'}
          </button>
        )}
      </footer>

      {/* ─── CHAT FAB (when chat panel hidden) ─── */}
      {!showChatPanel && (
        <button
          onClick={() => setChatOpen(true)}
          aria-label="Mở trò chuyện"
          data-testid="lobby-chat-fab"
          className="fixed right-4 lg:right-6 bottom-20 lg:bottom-24 w-12 h-12 grid place-items-center rounded-full z-40"
          style={{
            background: 'rgba(50,52,64,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(232,168,50,0.3)',
            color: '#fbbf24',
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          }}
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          {unreadChat > 0 && (
            <span
              className="absolute -top-1 -right-1 px-1.5 rounded-full text-[9px] font-extrabold"
              style={{ background: '#f87171', color: '#fff', minWidth: 16, textAlign: 'center' }}
            >
              {unreadChat > 9 ? '9+' : unreadChat}
            </span>
          )}
        </button>
      )}

      {/* ─── MOBILE CHAT DRAWER ─── */}
      {isMobile && chatOpen && (
        <ChatDrawer
          messages={chatMessages}
          input={chatInput}
          setInput={setChatInput}
          onSend={handleSendChat}
          onClose={() => setChatOpen(false)}
          chatEndRef={chatEndRef}
        />
      )}

      {/* ─── INVITE MODAL ─── */}
      <InviteShareModal
        open={showInvite}
        roomCode={room.roomCode}
        onClose={() => setShowInvite(false)}
      />

      {/* ─── RULES DETAIL MODAL ─── */}
      {showRulesDetail && modeInfo.ruleDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết luật chơi"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowRulesDetail(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'rgba(30,33,46,0.95)', border: '1px solid rgba(96,165,250,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold" style={{ color: '#93c5fd' }}>{modeInfo.ruleTitle}</h3>
              <button
                onClick={() => setShowRulesDetail(false)}
                aria-label="Đóng"
                className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#d1d5db' }}>{modeInfo.ruleDetail}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Player slot

const PlayerSlot: React.FC<{
  player: Player;
  hostId: string;
  myUserId?: string;
  suddenDeathOrder?: number;
  canKick: boolean;
  kickOpen: boolean;
  onKickToggle: () => void;
  onKickConfirm: () => void;
}> = ({ player, hostId, myUserId, suddenDeathOrder, canKick, kickOpen, onKickToggle, onKickConfirm }) => {
  const isHost = player.userId === hostId;
  const isMe = myUserId ? player.userId === myUserId : player.username === myUsername();
  const isReady = isHost ? true : player.isReady;
  const variant: 'host' | 'ready' | 'waiting' =
    isHost ? 'host' : (isReady ? 'ready' : 'waiting');

  const colors = {
    host:    { border: 'rgba(232,168,50,0.4)', avatarBg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', avatarText: '#11131e', avatarBorder: '#fbbf24', statusBg: 'rgba(232,168,50,0.15)', statusText: '#fbbf24', statusLabel: 'Chủ phòng' },
    ready:   { border: 'rgba(74,222,128,0.4)',  avatarBg: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)', avatarText: '#11131e', avatarBorder: '#4ade80', statusBg: 'rgba(74,222,128,0.12)', statusText: '#4ade80', statusLabel: 'Sẵn sàng' },
    waiting: { border: 'rgba(167,139,250,0.3)', avatarBg: 'linear-gradient(135deg, #c084fc 0%, #9333ea 100%)', avatarText: '#fff',    avatarBorder: '#c084fc', statusBg: 'rgba(167,139,250,0.12)', statusText: '#c4b5fd', statusLabel: 'Chưa sẵn sàng' },
  }[variant];

  const bg = variant === 'host'
    ? 'linear-gradient(180deg, rgba(232,168,50,0.08) 0%, rgba(50,52,64,0.4) 60%)'
    : variant === 'ready'
    ? 'linear-gradient(180deg, rgba(74,222,128,0.06) 0%, rgba(50,52,64,0.4) 60%)'
    : 'linear-gradient(180deg, rgba(167,139,250,0.04) 0%, rgba(50,52,64,0.4) 60%)';

  return (
    <div
      className="relative text-center px-2.5 py-3 rounded-xl"
      style={{ background: bg, border: `1.5px solid ${colors.border}`, minHeight: 130 }}
      data-testid={`lobby-slot-${player.userId}`}
    >
      {isHost && (
        <div className="absolute top-1.5 right-2 text-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(251,191,36,0.4))' }}>
          👑
        </div>
      )}
      {canKick && (
        <div className="absolute top-1.5 left-1.5">
          <button
            type="button"
            aria-label="Tùy chọn"
            onClick={(e) => { e.stopPropagation(); onKickToggle(); }}
            className="w-6 h-6 grid place-items-center rounded-md hover:bg-white/10"
            style={{ color: '#9ca3af' }}
            data-testid={`lobby-slot-menu-${player.userId}`}
          >
            <span className="material-symbols-outlined text-[16px]">more_vert</span>
          </button>
          {kickOpen && (
            <div
              className="absolute left-0 top-7 z-20 rounded-lg overflow-hidden"
              style={{ background: '#1d1f2a', border: '1px solid rgba(248,113,113,0.3)', minWidth: 110 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onKickConfirm}
                className="block w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5"
                style={{ color: '#f87171' }}
                data-testid={`lobby-kick-${player.userId}`}
              >
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">person_remove</span>
                Kick
              </button>
            </div>
          )}
        </div>
      )}

      <div
        className="mx-auto mb-2 grid place-items-center rounded-full text-lg font-extrabold"
        style={{
          width: 48, height: 48,
          background: colors.avatarBg, color: colors.avatarText,
          border: `2px solid ${colors.avatarBorder}`,
        }}
      >
        {player.avatarUrl
          ? <img src={player.avatarUrl} alt={player.username} className="w-full h-full rounded-full object-cover" />
          : (player.username?.[0]?.toUpperCase() ?? 'U')}
      </div>

      <div className="text-xs font-bold mb-0.5 truncate" style={{ color: '#f3f4f6' }}>
        {player.username}{isMe ? ' (bạn)' : ''}
      </div>
      <div className="text-[10px] mb-1.5" style={{ color: '#9ca3af' }}>
        {player.tier ?? 'Tân Tín Hữu'}
      </div>
      <div
        className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
        style={{ background: colors.statusBg, color: colors.statusText }}
      >
        {suddenDeathOrder !== undefined && suddenDeathOrder >= 2
          ? `Chờ #${suddenDeathOrder + 1}`
          : suddenDeathOrder === 1
          ? 'Đối thủ'
          : suddenDeathOrder === 0
          ? 'Hot seat'
          : colors.statusLabel}
      </div>
    </div>
  );
};

const InviteSlot: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid="lobby-invite-slot"
    className="text-center px-2.5 py-3 rounded-xl hover:opacity-90 transition-opacity"
    style={{
      background: 'rgba(232,168,50,0.04)',
      border: '1.5px dashed rgba(232,168,50,0.3)',
      minHeight: 130,
      cursor: 'pointer',
    }}
  >
    <div
      className="mx-auto mb-2 grid place-items-center rounded-full"
      style={{
        width: 48, height: 48,
        background: 'rgba(232,168,50,0.1)',
        border: '2px dashed rgba(232,168,50,0.4)',
        color: '#e8a832',
      }}
    >
      <span className="material-symbols-outlined">person_add</span>
    </div>
    <div className="text-xs font-bold" style={{ color: '#fbbf24' }}>Mời bạn bè</div>
    <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>Chia sẻ mã / Link / QR</div>
  </button>
);

const EmptySlot: React.FC<{ index: number }> = ({ index }) => (
  <div
    className="text-center px-2.5 py-3 rounded-xl"
    style={{
      background: 'rgba(50,52,64,0.15)',
      border: '1.5px dashed rgba(255,255,255,0.06)',
      minHeight: 130,
      opacity: 0.5,
    }}
  >
    <div
      className="mx-auto mb-2 grid place-items-center rounded-full"
      style={{
        width: 48, height: 48,
        background: 'transparent',
        border: '2px dashed rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.15)',
      }}
    >
      <span className="material-symbols-outlined">hourglass_empty</span>
    </div>
    <div className="text-[11px]" style={{ color: '#6b7280' }}>Slot {index}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Team vs Team layout

const TeamSplit: React.FC<{
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  hostId: string;
  myUserId?: string;
  isHost: boolean;
  myTeam?: string;
  kickMenuFor: string | null;
  setKickMenuFor: (id: string | null) => void;
  onKick: (id: string) => void;
  onSwitchTeam: () => void;
  switchingTeam: boolean;
  onInvite: () => void;
}> = ({ teamAPlayers, teamBPlayers, hostId, myUserId, isHost, myTeam, kickMenuFor, setKickMenuFor, onKick, onSwitchTeam, switchingTeam, onInvite }) => {
  const renderTeam = (label: string, color: string, players: Player[]) => (
    <div>
      <div className="text-xs font-extrabold uppercase tracking-wider mb-2 inline-flex items-center gap-2" style={{ color }}>
        <span className="material-symbols-outlined text-[15px]">shield</span>
        {label}
        {myTeam && players.some(p => p.userId === myUserId) && (
          <span className="text-[10px] font-semibold" style={{ color: '#9ca3af' }}>(bạn)</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {players.map(p => (
          <PlayerSlot
            key={p.id}
            player={p}
            hostId={hostId}
            myUserId={myUserId}
            canKick={isHost && p.userId !== hostId}
            kickOpen={kickMenuFor === p.userId}
            onKickToggle={() => setKickMenuFor(kickMenuFor === p.userId ? null : p.userId)}
            onKickConfirm={() => onKick(p.userId)}
          />
        ))}
        {players.length === 0 && (
          <button
            type="button"
            onClick={onInvite}
            className="text-center px-2.5 py-3 rounded-xl col-span-2"
            style={{ background: 'rgba(50,52,64,0.2)', border: `1.5px dashed ${color}66`, minHeight: 80, color }}
          >
            <span className="material-symbols-outlined">person_add</span>
            <div className="text-[11px] mt-1 font-semibold">Mời vào đội</div>
          </button>
        )}
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      {renderTeam('Đội A', '#60a5fa', teamAPlayers)}
      {renderTeam('Đội B', '#f87171', teamBPlayers)}
      {myUserId && (
        <button
          onClick={onSwitchTeam}
          disabled={switchingTeam}
          className="text-xs px-3 py-2 rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
          style={{ color: '#e8a832', border: '1px solid rgba(232,168,50,0.3)' }}
        >
          <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
          Đổi đội
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Chat: panel (desktop) + drawer (mobile)

type ChatViewProps = {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSend: (v: string) => void;
  onClose: () => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
};

const ChatBody: React.FC<{ messages: ChatMessage[]; chatEndRef: React.RefObject<HTMLDivElement> }> = ({ messages, chatEndRef }) => (
  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5" style={{ minHeight: 0 }}>
    {messages.length === 1 && messages[0].isSystem && (
      <div className="text-center py-4" style={{ color: '#6b7280', fontSize: 11 }}>
        <span className="material-symbols-outlined text-[28px] block mb-1.5" style={{ color: 'rgba(255,255,255,0.1)' }}>chat</span>
        Hãy chào hỏi để bắt đầu!
      </div>
    )}
    {messages.map((msg, i) => (
      msg.isSystem ? (
        <div
          key={i}
          className="rounded-lg px-3 py-2 text-xs"
          style={{
            background: 'rgba(96,165,250,0.06)',
            borderLeft: '2px solid rgba(96,165,250,0.4)',
            color: '#93c5fd',
            lineHeight: 1.5,
          }}
        >
          {msg.text}
          {msg.time && <div className="text-[9px] mt-1" style={{ color: '#6b7280' }}>{msg.time}</div>}
        </div>
      ) : (
        <div key={i} className="flex items-start gap-2">
          <div
            className="w-6 h-6 rounded-full grid place-items-center text-[11px] font-extrabold flex-shrink-0"
            style={{
              background: msg.isHost
                ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
              color: '#11131e',
            }}
          >
            {msg.sender?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold mb-0.5" style={{ color: msg.isHost ? '#fbbf24' : '#86efac' }}>{msg.sender}</div>
            <div className="text-xs" style={{ color: '#d1d5db' }}>{msg.text}</div>
            {msg.time && <div className="text-[9px] mt-0.5" style={{ color: '#6b7280' }}>{msg.time}</div>}
          </div>
        </div>
      )
    ))}
    <div ref={chatEndRef} />
  </div>
);

const ChatReactionsRow: React.FC<{ onSend: (e: string) => void }> = ({ onSend }) => (
  <div className="flex gap-1.5 px-4 py-2.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
    {QUICK_EMOJIS.map(e => (
      <button
        key={e}
        type="button"
        onClick={() => onSend(e)}
        className="w-8 h-8 grid place-items-center rounded-lg text-base hover:bg-white/5"
        style={{ background: 'rgba(50,52,64,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {e}
      </button>
    ))}
  </div>
);

const ChatInputRow: React.FC<{ value: string; onChange: (v: string) => void; onSend: () => void }> = ({ value, onChange, onSend }) => (
  <div className="flex gap-1.5 px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') onSend(); }}
      placeholder="Nhắn tin trong phòng..."
      className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
      style={{ background: 'rgba(50,52,64,0.4)', border: '1px solid rgba(255,255,255,0.06)', color: '#f3f4f6' }}
    />
    <button
      type="button"
      onClick={onSend}
      aria-label="Gửi"
      className="w-9 h-9 grid place-items-center rounded-lg"
      style={{ background: 'rgba(232,168,50,0.15)', color: '#fbbf24', border: '1px solid rgba(232,168,50,0.3)' }}
    >
      <span className="material-symbols-outlined text-[15px]">send</span>
    </button>
  </div>
);

const ChatPanel: React.FC<ChatViewProps> = ({ messages, input, setInput, onSend, onClose, chatEndRef }) => (
  <aside
    className="flex flex-col border-l"
    style={{ background: '#0d0f17', borderColor: 'rgba(255,255,255,0.04)' }}
    data-testid="lobby-chat-panel"
  >
    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="inline-flex items-center gap-1.5 text-[13px] font-bold">
        <span className="material-symbols-outlined text-base" style={{ color: '#9ca3af' }}>chat</span>
        Trò chuyện
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng chat"
        className="w-7 h-7 grid place-items-center rounded-lg hover:bg-white/5"
        style={{ background: 'rgba(50,52,64,0.5)', color: '#9ca3af' }}
      >
        <span className="material-symbols-outlined text-[14px]">close</span>
      </button>
    </div>
    <ChatBody messages={messages} chatEndRef={chatEndRef} />
    <ChatReactionsRow onSend={onSend} />
    <ChatInputRow value={input} onChange={setInput} onSend={() => onSend(input)} />
  </aside>
);

const ChatDrawer: React.FC<ChatViewProps> = ({ messages, input, setInput, onSend, onClose, chatEndRef }) => (
  <div
    className="fixed inset-0 z-50 flex justify-end"
    style={{ background: 'rgba(0,0,0,0.5)' }}
    onClick={onClose}
    data-testid="lobby-chat-drawer"
  >
    <div
      className="flex flex-col w-full max-w-sm h-full"
      style={{ background: '#0d0f17' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="inline-flex items-center gap-1.5 text-[13px] font-bold">
          <span className="material-symbols-outlined text-base" style={{ color: '#9ca3af' }}>chat</span>
          Trò chuyện
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chat"
          className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/5"
          style={{ color: '#9ca3af' }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <ChatBody messages={messages} chatEndRef={chatEndRef} />
      <ChatReactionsRow onSend={onSend} />
      <ChatInputRow value={input} onChange={setInput} onSend={() => onSend(input)} />
    </div>
  </div>
);

export default RoomLobby;
