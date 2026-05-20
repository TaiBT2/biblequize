import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStomp } from '../hooks/useStomp';
import { api } from '../api/client';
import { QRCodeSVG } from 'qrcode.react';
import { soundManager } from '../services/soundManager';
import { haptic } from '../utils/haptics';
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
  /** Owning group when room was spawned from a group quiz set; null otherwise.
   *  Server-side fallback so "back to group" works for users who joined via
   *  room code (no fromGroupId in nav state) or after a page refresh. */
  groupId?: string | null;
  /** Group quiz set context — populated when room.groupQuizSetId is set.
   *  Lobby + quiz screens render "📚 Đang chơi: {name}" pill. */
  groupQuizSetId?: string | null;
  groupQuizSetName?: string | null;
  quizSetTotalQuestions?: number | null;
  /** Sprint 4: false = Quản trò mode (host orchestrates only). Defaults
   *  true on the FE for legacy rooms whose payload omits the field. */
  hostPlaysGame?: boolean;
  /** QP-10 (Đấu Nhanh): true = soft-host quick match room. No Quản trò,
   *  any player can hit Start once ≥2 players are ready. */
  quickMatch?: boolean;
};
type ChatMessage = {
  sender: string; text: string;
  isHost?: boolean; isSystem?: boolean; time?: string;
};
type ActivityTone = 'info' | 'ok' | 'warn';
type ActivityEntry = { text: string; time: string; tone: ActivityTone };

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
    label: 'Đấu vương', icon: 'swords',
    ruleTitle: 'Luật Đấu vương',
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

const QUICK_EMOJIS = ['👏', '😂', '😱', '🔥', '💪', '🙏'];

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
  const initialViewerUserId: string | null = location.state?.viewerUserId ?? null;
  const [room, setRoom] = useState<RoomDetails | null>(initialRoom ?? null);
  // viewerUserId is per-viewer context, NOT part of the room snapshot — kept
  // separate so WS ROOM_STATE broadcasts (which carry no viewer identity)
  // can't overwrite it. Sourced from the REST wrapper.
  const [viewerUserId, setViewerUserId] = useState<string | null>(initialViewerUserId);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [switchingTeam, setSwitchingTeam] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    sender: 'SYSTEM',
    text: 'Phòng đã được tạo. Đang chờ người chơi tham gia...',
    isSystem: true,
    time: nowTime(),
  }]);
  const [activity, setActivity] = useState<ActivityEntry[]>([
    { text: 'Phòng được tạo', time: nowTime(), tone: 'info' },
  ]);
  const appendActivity = (text: string, tone: ActivityTone = 'info') =>
    setActivity(prev => [...prev, { text, time: nowTime(), tone }]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [showInvite, setShowInvite] = useState(false);
  const [showRulesDetail, setShowRulesDetail] = useState(false);
  const [kickMenuFor, setKickMenuFor] = useState<string | null>(null);
  const [heroCopied, setHeroCopied] = useState<'code' | 'link' | null>(null);
  const copyToClipboard = async (kind: 'code' | 'link', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setHeroCopied(kind);
      setTimeout(() => setHeroCopied(null), 1500);
    } catch { /* ignore */ }
  };

  const { connected, reconnecting, send } = useStomp({
    roomId,
    onReconnect: () => { fetchRoom(); },
    onMessage: (msg) => {
      switch (msg.type) {
        case 'ROOM_STATE': {
          // Sprint 2 S2-8: atomic snapshot from BE. Use it instead of the
          // per-event fetchRoom REST round-trips that used to flicker the
          // player list with multi-join races.
          setRoom(msg.data as RoomDetails);
          break;
        }
        case 'PLAYER_KICKED': {
          const d = msg.data as { userId?: string } | undefined;
          if (d?.userId && d.userId === viewerUserId) {
            navigate('/multiplayer', { replace: true, state: { kickedFromRoom: true } });
            return;
          }
          if (d?.userId) {
            const name = room?.players?.find(p => p.userId === d.userId)?.username ?? 'Người chơi';
            appendActivity(`${name} đã bị kick`, 'warn');
          }
          // ROOM_STATE will follow with the post-kick snapshot.
          break;
        }
        case 'PLAYER_JOINED': {
          const d = msg.data as { username?: string } | undefined;
          if (d?.username) appendActivity(`${d.username} đã tham gia 👋`);
          // S2-9 hook: subtle audio cue when someone enters the lobby.
          soundManager.play('playerJoin');
          // ROOM_STATE will follow with the new player list.
          break;
        }
        case 'PLAYER_LEFT': {
          const d = msg.data as { userId?: string } | undefined;
          if (d?.userId) {
            const name = room?.players?.find(p => p.userId === d.userId)?.username ?? 'Người chơi';
            appendActivity(`${name} đã rời phòng`);
          }
          // ROOM_STATE will follow.
          break;
        }
        case 'PLAYER_READY': {
          const d = msg.data as { username?: string; isReady?: boolean } | undefined;
          if (d?.username) appendActivity(`${d.username} sẵn sàng ✓`, 'ok');
          // ROOM_STATE will follow.
          break;
        }
        case 'PLAYER_UNREADY': {
          const d = msg.data as { username?: string } | undefined;
          if (d?.username) appendActivity(`${d.username} hủy sẵn sàng`);
          // ROOM_STATE will follow.
          break;
        }
        case 'CHAT_MESSAGE': {
          const d = msg.data as { sender: string; text: string; isSystem?: boolean };
          setChatMessages(prev => [...prev, {
            sender: d.sender, text: d.text,
            isHost: d.sender === room?.hostName,
            isSystem: d.isSystem === true,
            time: nowTime(),
          }]);
          if (isMobile && !chatOpen && !d.isSystem) setUnreadChat(c => c + 1);
          break;
        }
        case 'GAME_STARTING': {
          // Sprint 2 S2-4: cinematic countdown. Just seed the state — the
          // overlay's own useEffect ticks it down per second with sound +
          // haptic, then navigates after the "BẮT ĐẦU!" beat.
          const d = msg.data as { countdown: number };
          setCountdown(d.countdown);
          break;
        }
        case 'QUESTION_START': {
          const navState = location.state as { fromGroupId?: string } | null;
          const fromGroupId = navState?.fromGroupId ?? room?.groupId ?? undefined;
          // Sprint 4: Quản trò goes to the host spectator route; players go to /quiz.
          const dest = isOrganizerMode ? `/room/${roomId}/host` : `/room/${roomId}/quiz`;
          navigate(dest, {
            replace: true,
            state: { mode: room?.mode, myTeam: room?.players?.find(p => p.userId === viewerUserId)?.team ?? null, isHost, hostId: room?.hostId, hostName: room?.hostName, hostPlaysGame, fromGroupId, groupQuizSetName: room?.groupQuizSetName ?? null, quizSetTotalQuestions: room?.quizSetTotalQuestions ?? null }
          });
          break;
        }
        case 'QUIZ_END':
          fetchRoom();
          break;
        case 'ROOM_ENDED': {
          // SPEC §5.4.0 R1/R2/R5 — backend cleanup forced the room to end.
          // Stash the reason in nav state so /multiplayer can toast it.
          const d = msg.data as { reason?: string } | undefined;
          navigate('/multiplayer', { replace: true, state: { roomEndedReason: d?.reason ?? 'GENERIC' } });
          break;
        }
        case 'HOST_CHANGED': {
          // SPEC §5.4.0 R4 — old host's grace expired; backend promoted
          // a successor. Refetch room details so the crown + start
          // button move to the new host.
          const d = msg.data as { newHostId?: string; newHostName?: string } | undefined;
          if (d?.newHostName) {
            appendActivity(`${d.newHostName} đã trở thành chủ phòng mới`, 'ok');
          }
          fetchRoom();
          break;
        }
      }
    },
  });

  const fetchRoom = async () => {
    if (!roomId) return;
    try {
      const res = await api.get(`/api/rooms/${roomId}`);
      if (res.data.success) {
        setRoom(res.data.room);
        if (res.data.viewerUserId) setViewerUserId(res.data.viewerUserId);
      }
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

  // Reset desktop unread when chat is visible (always on desktop); mobile resets when drawer opens.
  useEffect(() => {
    if (!isMobile) setUnreadChat(0);
    else if (chatOpen) setUnreadChat(0);
  }, [chatOpen, isMobile]);

  // Sprint 2 S2-4: Cinematic countdown effect. Once GAME_STARTING seeds
  // `countdown` we tick down per second with sound + haptic, render
  // "BẮT ĐẦU!" at zero with the gameStart flourish, and navigate ~800ms
  // later so the moment lands before the quiz UI appears.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      // Per-tick beats: louder warning beep on the last second.
      soundManager.play(countdown === 1 ? 'timerWarning' : 'timerTick');
      haptic.tap();
      const t = setTimeout(() => setCountdown(c => (c === null ? null : c - 1)), 1000);
      return () => clearTimeout(t);
    }
    // countdown === 0 → the "BẮT ĐẦU!" beat
    soundManager.play('gameStart');
    haptic.combo();
    const myTeam = room?.players?.find(p => p.userId === viewerUserId)?.team ?? null;
    const navState = location.state as { fromGroupId?: string } | null;
    const fromGroupId = navState?.fromGroupId ?? room?.groupId ?? undefined;
    const t = setTimeout(() => {
      const dest = isOrganizerMode ? `/room/${roomId}/host` : `/room/${roomId}/quiz`;
      navigate(dest, {
        replace: true,
        state: { mode: room?.mode, myTeam, isHost, hostId: room?.hostId, hostName: room?.hostName, hostPlaysGame, fromGroupId, groupQuizSetName: room?.groupQuizSetName ?? null, quizSetTotalQuestions: room?.quizSetTotalQuestions ?? null },
      });
    }, 800);
    return () => clearTimeout(t);
    // isHost / room can change underneath but the countdown is short
    // enough that capturing them on first mount is fine; ESLint
    // dependency exhaustive disabled intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

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
    haptic.tap(); // Sprint 2 S2-10 — subtle tap on ready toggle.
    send(`/app/room/${roomId}/ready`, {});
    setTimeout(() => { togglingReadyRef.current = false; }, 600);
  };
  const handleStart = async () => {
    if (!roomId) return;
    try {
      await api.post(`/api/rooms/${roomId}/start`);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('room.errorStartRoom'));
    }
  };
  const handleSwitchTeam = async () => {
    if (!roomId) return;
    setSwitchingTeam(true);
    try {
      const res = await api.post(`/api/rooms/${roomId}/switch-team`);
      if (res.data.success) {
        setRoom(res.data.room);
        if (res.data.viewerUserId) setViewerUserId(res.data.viewerUserId);
      }
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
    // Prefer the explicit fromGroupId nav state (set when entering via the
    // group's "Chơi cùng nhau" flow); fall back to room.groupId for direct
    // co-play deep-links so leader returns to the group page they came from.
    // Standalone /multiplayer rooms (no group affiliation) go back to /multiplayer.
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
    viewerUserId ? p.userId === viewerUserId : p.username === myUsername()
  );
  // Sprint 4: in Quản trò mode the host is NOT a RoomPlayer, so myPlayer
  // would be undefined for them. Fall back to comparing against viewerUserId
  // so the host still resolves as host in the lobby UI.
  const hostPlaysGame = room?.hostPlaysGame !== false; // defaults true (legacy)
  const isQuickMatch = !!room?.quickMatch;
  const isHost = (myPlayer?.userId === room?.hostId)
      || (!hostPlaysGame && viewerUserId != null && viewerUserId === room?.hostId);
  const isOrganizerMode = isHost && !hostPlaysGame;
  const emptySlots = room ? Math.max(0, room.maxPlayers - room.currentPlayers) : 0;
  const modeInfo = MODE_INFO[room?.mode ?? ''] ?? {
    label: room?.mode ?? '', icon: 'sports_esports',
    ruleTitle: 'Luật chơi', ruleText: '', ruleDetail: '',
    chipColor: '#e8a832', chipBg: 'rgba(232,168,50,0.15)', chipBorder: 'rgba(232,168,50,0.4)',
  };

  const nonHostPlayers = useMemo(() => room?.players?.filter(p => p.userId !== room?.hostId) ?? [], [room]);
  const readyNonHostCount = useMemo(() => nonHostPlayers.filter(p => p.isReady).length, [nonHostPlayers]);
  const isGroupLive = room?.mode === 'GROUP_LIVE_SEQUENTIAL';
  // Sprint 4: Quan Tro mode requires ≥2 non-host players (host doesn't play);
  // legacy mode keeps ≥1 non-host (host + 1 = 2 total).
  const minNonHost = !hostPlaysGame ? 2 : 1;
  // QP-10: Quick Match has no Quản trò; require ≥2 ready players
  // (host displayed as auto-ready via PlayerSlot) instead of host-driven start.
  const quickMatchReadyCount = useMemo(
    () => room?.players?.filter(p => p.isReady || p.userId === room?.hostId).length ?? 0,
    [room],
  );
  const canStart = room?.status === 'LOBBY' && (
    isQuickMatch
      ? quickMatchReadyCount >= 2
      : nonHostPlayers.length >= minNonHost
        && (isGroupLive || readyNonHostCount === nonHostPlayers.length)
  );

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

  /* ── BẮT ĐẦU! countdown overlay (per MOCKUP_GAME_START_CEREMONY states c5/c3/c1/go) ── */
  if (countdown !== null) {
    const orderedForOverlay = room
      ? [
          ...(room.players?.filter(p => p.userId === room.hostId) ?? []),
          ...(room.players?.filter(p => p.userId !== room.hostId) ?? []),
        ].slice(0, 6)
      : [];
    const modeLabel = MODE_INFO[room?.mode ?? '']?.label ?? room?.mode ?? '';
    const isGo = countdown === 0;
    return (
      <div
        className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-6 overflow-hidden"
        style={{
          // GO! state: brighter gold radiating; ticking states: dimmer.
          background: isGo
            ? 'radial-gradient(circle at center, rgba(232,168,50,0.55) 0%, rgba(212,148,31,0.30) 35%, #11131e 75%)'
            : 'radial-gradient(circle at center, rgba(212,148,31,0.30) 0%, #11131e 70%)',
          fontFamily: "'Be Vietnam Pro', sans-serif",
          transition: 'background 200ms ease-out',
        }}
        data-testid="lobby-countdown"
      >
        {/* Header label flips between "BẮT ĐẦU TRONG" while ticking and
            an empty placeholder during the GO! beat (the slammed text
            owns the screen). */}
        {!isGo && (
          <div
            className="text-xs lg:text-sm font-bold uppercase mb-6 lg:mb-8 fade-in"
            style={{ color: '#e8a832', letterSpacing: '0.4em' }}
          >
            BẮT ĐẦU TRONG
          </div>
        )}

        {/* Number circle (ticking) OR slammed text (GO) */}
        {isGo ? (
          <div
            data-testid="lobby-countdown-go"
            className="text-center go-slam"
            style={{
              fontSize: 'clamp(72px, 18vw, 192px)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              textShadow: '0 8px 60px rgba(0,0,0,0.6), 0 0 80px rgba(232,168,50,0.4)',
            }}
          >
            BẮT ĐẦU!
          </div>
        ) : (
          <div className="relative" data-testid={`lobby-countdown-${countdown}`}>
            {/* Pulsing gold ring sized 8px outside the circle */}
            <div
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{
                border: '2px solid #e8a832',
                animation: 'countdownRingPulse 1s ease-in-out infinite',
              }}
              aria-hidden="true"
            />
            {/* Glass-strong circle wrapper */}
            <div
              className="grid place-items-center rounded-full"
              style={{
                width: 'clamp(180px, 32vw, 240px)',
                height: 'clamp(180px, 32vw, 240px)',
                background: 'rgba(50,52,64,0.78)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(232,168,50,0.3)',
                boxShadow: '0 0 60px rgba(232,168,50,0.25), inset 0 2px 20px rgba(255,255,255,0.05)',
              }}
            >
              <div
                key={countdown}
                style={{
                  fontSize: 'clamp(96px, 14vw, 160px)',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  background: 'linear-gradient(135deg, #fbbf24 0%, #e8a832 50%, #d4941f 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'countdownNumberPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                {countdown}
              </div>
            </div>
          </div>
        )}

        {/* Mode chip (under the circle) — only on ticking states */}
        {!isGo && modeLabel && (
          <div
            className="mt-8 lg:mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full fade-in"
            style={{
              background: 'rgba(50,52,64,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="text-base">{modeInfo.icon === 'bolt' ? '⚡' : modeInfo.icon === 'favorite' ? '❤️' : modeInfo.icon === 'groups_2' ? '👥' : '👑'}</span>
            <span className="text-sm font-semibold text-white">
              {modeLabel}{room?.questionCount ? ` · ${room.questionCount} câu` : ''}
            </span>
          </div>
        )}
        {isGo && (
          <div className="mt-6 lg:mt-8 text-base lg:text-xl font-semibold fade-in" style={{ color: 'rgba(255,255,255,0.9)', animationDelay: '0.4s' }}>
            Câu hỏi đầu tiên đang đến...
          </div>
        )}
        {orderedForOverlay.length > 0 && (
          <div
            className="mt-6 lg:mt-8 flex items-center justify-center fade-in"
            style={{ animationDelay: isGo ? '0.6s' : '0.2s' }}
          >
            <div className="flex items-center">
              {orderedForOverlay.map((p, i) => (
                <div
                  key={p.id}
                  className="grid place-items-center rounded-full font-bold flex-shrink-0"
                  style={{
                    width: 36, height: 36,
                    fontSize: 13,
                    marginLeft: i === 0 ? 0 : -8,
                    background: i === 0
                      ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                      : i === 1
                      ? 'linear-gradient(135deg, #4ade80 0%, #047857 100%)'
                      : 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
                    color: i === 0 ? '#11131e' : '#fff',
                    border: '2px solid #11131e',
                    zIndex: orderedForOverlay.length - i,
                  }}
                  aria-hidden="true"
                >
                  {p.username?.[0]?.toUpperCase() ?? '?'}
                </div>
              ))}
            </div>
            <span className="ml-3 text-xs lg:text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {room?.currentPlayers ?? 0} người chơi
            </span>
          </div>
        )}
      </div>
    );
  }

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

  // Desktop: chat panel is always visible per mockup. Mobile: drawer toggle (chatOpen).
  const showChatPanel = !isMobile;

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
        className="flex items-center justify-between gap-3 px-4 lg:px-6 py-3 border-b"
        style={{ background: '#0d0f17', borderColor: 'rgba(255,255,255,0.04)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/multiplayer')}
            className="text-xs font-semibold inline-flex items-center gap-1.5 hover:text-on-surface flex-shrink-0"
            style={{ color: '#9ca3af' }}
            data-testid="lobby-back-btn"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span className="hidden sm:inline">Đa người chơi</span>
          </button>
          <div className="hidden sm:block h-5 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0"
            style={{ color: modeInfo.chipColor, background: modeInfo.chipBg, border: `1px solid ${modeInfo.chipBorder}` }}
            data-testid="lobby-topbar-mode"
          >
            <span className="material-symbols-outlined text-[12px]">{modeInfo.icon}</span>
            {modeInfo.label}
          </span>
          {room.groupQuizSetName && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 max-w-[180px] truncate"
              style={{
                color: '#e8a832',
                background: 'rgba(232, 168, 50, 0.1)',
                border: '1px solid rgba(232, 168, 50, 0.3)',
              }}
              data-testid="lobby-topbar-quizset"
              title={room.groupQuizSetName}
            >
              <span className="material-symbols-outlined text-[12px]">menu_book</span>
              <span className="truncate">{room.groupQuizSetName}</span>
            </span>
          )}
          <span className="text-xs font-mono truncate" style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }} data-testid="lobby-topbar-code">
            Phòng {room.roomCode}
          </span>
        </div>
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs" style={{ color: '#9ca3af' }}>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: connected ? '#4ade80' : '#f87171' }}
            />
            {connected ? 'Đã kết nối' : 'Mất kết nối'}
          </div>
          <button
            onClick={handleLeave}
            data-testid="lobby-leave-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: 'rgba(248,113,113,0.08)',
              color: '#f87171',
              border: '1px solid rgba(248,113,113,0.25)',
            }}
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            <span className="hidden sm:inline">Rời phòng</span>
          </button>
        </div>
      </header>

      {/* ─── Main: activity log + content + (optional) chat panel ─── */}
      <div className="flex-1 grid lg:grid-cols-[280px_1fr_320px] overflow-hidden" style={{ minHeight: 0 }}>
        <ActivityLogPanel entries={activity} statusHint={statusSecondary} />
        <div className="overflow-y-auto px-4 lg:px-7 py-4 lg:py-5 pb-24 lg:pb-5" data-testid="lobby-scroll-content">

          {/* ─── QP-10: Quick Match indigo banner (no Quản trò) ─── */}
          {isQuickMatch && (
            <div
              className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
              data-testid="lobby-quickmatch-banner"
            >
              <span className="material-symbols-outlined flex-shrink-0" style={{ color: '#818cf8', fontSize: 20 }}>
                rocket_launch
              </span>
              <div className="text-xs leading-relaxed" style={{ color: '#d1d5db' }}>
                <span className="font-bold" style={{ color: '#a5b4fc' }}>Đấu Nhanh — Không có Quản trò.</span>{' '}
                Bất kỳ ai cũng có thể bấm <strong>Bắt đầu</strong> khi đủ 2 người sẵn sàng.
              </div>
            </div>
          )}

          {/* ─── Sprint 4: Quản trò badge / host info card ─── */}
          {!isQuickMatch && isOrganizerMode && (
            <div
              className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
              style={{
                background: 'rgba(232,168,50,0.08)',
                border: '1px solid rgba(232,168,50,0.3)',
              }}
              data-testid="lobby-organizer-badge"
            >
              <span className="text-xl flex-shrink-0">👑</span>
              <div className="text-xs leading-relaxed" style={{ color: '#d1d5db' }}>
                <span className="font-bold" style={{ color: '#e8a832' }}>Bạn là Quản trò.</span>{' '}
                Bạn điều phối trận đấu, không trả lời câu hỏi để đảm bảo công bằng cho người chơi.
              </div>
            </div>
          )}
          {!isQuickMatch && !isOrganizerMode && !hostPlaysGame && room.hostName && (
            <div
              className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
              style={{
                background: 'rgba(232,168,50,0.05)',
                border: '1px solid rgba(232,168,50,0.2)',
              }}
              data-testid="lobby-host-info-card"
            >
              <div
                className="w-10 h-10 rounded-full grid place-items-center font-bold text-base flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #e8a832, #d4941f)',
                  color: '#11131e',
                }}
              >
                {room.hostName[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#9ca3af' }}>
                  👑 Quản trò
                </div>
                <div className="text-sm font-bold text-white truncate">{room.hostName}</div>
              </div>
              <span className="text-[10px] flex-shrink-0" style={{ color: '#9ca3af' }}>Không chơi</span>
            </div>
          )}

          {/* ─── HERO BLOCK ─── */}
          <section
            className="relative rounded-2xl p-4 lg:p-6 mb-4 overflow-hidden"
            style={{
              background: 'rgba(50,52,64,0.78)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(232,168,50,0.15)',
            }}
            data-testid="lobby-hero"
          >
            {/* Decorative gold gradient */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(232,168,50,0.15) 0%, transparent 60%)' }}
            />
            <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:gap-6 items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {room.roomName && (
                    <span className="text-xs font-semibold truncate" style={{ color: '#d1d5db' }}>
                      {room.roomName}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      color: room.isPublic ? '#4ade80' : '#ff8c42',
                      background: room.isPublic ? 'rgba(74,222,128,0.1)' : 'rgba(255,140,66,0.1)',
                      border: `1px solid ${room.isPublic ? 'rgba(74,222,128,0.25)' : 'rgba(255,140,66,0.25)'}`,
                    }}
                  >
                    <span className="material-symbols-outlined text-[10px]">{room.isPublic ? 'public' : 'lock'}</span>
                    {room.isPublic ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>Mã phòng</div>
                <div
                  className="font-black leading-none mb-3"
                  style={{
                    color: '#e8a832',
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    letterSpacing: '0.25em',
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontVariantNumeric: 'tabular-nums',
                    background: 'linear-gradient(135deg, #e8a832 0%, #fbbf24 50%, #e7c268 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                  data-testid="lobby-room-code"
                >
                  {room.roomCode}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => copyToClipboard('code', room.roomCode)}
                    data-testid="lobby-hero-copy-code"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                    style={{
                      background: 'rgba(50,52,64,0.55)',
                      color: '#fbbf24',
                      border: '1px solid rgba(232,168,50,0.3)',
                    }}
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    {heroCopied === 'code' ? 'Đã copy' : 'Sao chép'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('link', `${window.location.origin}/join?code=${room.roomCode}`)}
                    data-testid="lobby-hero-copy-link"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                    style={{
                      background: 'rgba(50,52,64,0.55)',
                      color: '#fbbf24',
                      border: '1px solid rgba(232,168,50,0.3)',
                    }}
                  >
                    <span className="material-symbols-outlined text-[14px]">link</span>
                    {heroCopied === 'link' ? 'Đã copy' : 'Sao chép link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInvite(true)}
                    data-testid="lobby-share-btn"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                    style={{
                      background: 'rgba(50,52,64,0.55)',
                      color: '#fbbf24',
                      border: '1px solid rgba(232,168,50,0.3)',
                    }}
                  >
                    <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                    Mã QR
                  </button>
                </div>
              </div>
              {/* Inline QR (desktop) */}
              <div
                className="hidden lg:flex w-32 h-32 rounded-lg bg-white p-2 items-center justify-center flex-shrink-0"
                aria-hidden="true"
                data-testid="lobby-hero-qr"
              >
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${room.roomCode}`}
                  size={112}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
            {/* Stats grid bottom */}
            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mt-5 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <HeroStat label="Câu hỏi" value={`${room.questionCount}`} />
              <HeroStat label="Thời gian/câu" value={`${room.timePerQuestion}s`} />
              <HeroStat label="Độ khó" value={DIFFICULTY_LABEL[room.difficulty ?? ''] ?? 'Hỗn hợp'} />
              <HeroStat label="Người chơi" value={`${room.currentPlayers} / ${room.maxPlayers}`} />
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
                myUserId={viewerUserId ?? undefined}
                isHost={isHost && !isQuickMatch}
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
                    myUserId={viewerUserId ?? undefined}
                    suddenDeathOrder={isSuddenDeath ? idx : undefined}
                    canKick={isHost && !isQuickMatch && p.userId !== room.hostId}
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
            chatEndRef={chatEndRef}
            onlineCount={room?.currentPlayers}
            cta={
              <LobbyCTA
                isHost={isHost}
                canStart={canStart}
                statusSecondary={statusSecondary}
                myReady={!!myPlayer?.isReady}
                onStart={handleStart}
                onToggleReady={handleToggleReady}
                isQuickMatch={isQuickMatch}
              />
            }
          />
        )}
      </div>

      {/* ─── MOBILE BOTTOM CTA ─── (desktop CTA lives inside ChatPanel) */}
      {isMobile && (
        <footer
          className="lg:hidden px-4 py-3 border-t"
          style={{
            background: 'rgba(13,15,23,0.95)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(232,168,50,0.1)',
          }}
        >
          <div className="text-[10px] mb-2 text-center" style={{ color: canStart ? '#4ade80' : '#fbbf24' }}>
            {statusPrimary}
          </div>
          <LobbyCTA
            isHost={isHost}
            canStart={canStart}
            statusSecondary={statusSecondary}
            myReady={!!myPlayer?.isReady}
            onStart={handleStart}
            onToggleReady={handleToggleReady}
            isQuickMatch={isQuickMatch}
          />
        </footer>
      )}

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

const LobbyCTA: React.FC<{
  isHost: boolean;
  canStart: boolean;
  statusSecondary: string;
  myReady: boolean;
  onStart: () => void;
  onToggleReady: () => void;
  /** QP-10: Đấu Nhanh — any player sees Start button once canStart is true. */
  isQuickMatch?: boolean;
}> = ({ isHost, canStart, statusSecondary, myReady, onStart, onToggleReady, isQuickMatch }) => {
  // QP-10: in Quick Match, once ≥2 players are ready, the start button is
  // exposed to every player (no Quản trò). Players still toggle Ready below.
  if (isQuickMatch && canStart) {
    return (
      <button
        onClick={onStart}
        data-testid="lobby-start-btn"
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
          color: '#fff',
          boxShadow: '0 6px 20px rgba(99,102,241,0.3)',
        }}
      >
        <span className="material-symbols-outlined text-lg">rocket_launch</span>
        <span>BẮT ĐẦU TRẬN ĐẤU</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    );
  }
  if (isHost && !isQuickMatch) {
    return (
      <button
        onClick={onStart}
        disabled={!canStart}
        title={!canStart ? statusSecondary : undefined}
        data-testid="lobby-start-btn"
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold disabled:cursor-not-allowed"
        style={{
          background: canStart
            ? 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)'
            : 'rgba(50,52,64,0.5)',
          color: canStart ? '#11131e' : '#6b7280',
          boxShadow: canStart ? '0 6px 20px rgba(232,168,50,0.3)' : 'none',
        }}
      >
        <span>👑</span>
        <span>{canStart ? 'BẮT ĐẦU TRẬN ĐẤU' : 'ĐANG CHỜ...'}</span>
        {canStart && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </button>
    );
  }
  return (
    <button
      data-testid="lobby-ready-btn"
      onClick={onToggleReady}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold"
      style={{
        background: myReady
          ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
          : 'linear-gradient(135deg, #e8a832 0%, #d97706 100%)',
        color: '#11131e',
        boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
      }}
    >
      <span className="material-symbols-outlined text-lg">
        {myReady ? 'check_circle' : 'radio_button_unchecked'}
      </span>
      {/* Sprint 2 S2-10: distinct label per state so the user reads
          their current status off the button instead of inferring it
          from the icon alone. */}
      {myReady ? 'Hủy sẵn sàng' : 'Sẵn sàng'}
    </button>
  );
};

const HeroStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</div>
    <div className="font-extrabold text-white text-base lg:text-lg leading-tight mt-0.5">{value}</div>
  </div>
);

const ActivityLogPanel: React.FC<{ entries: ActivityEntry[]; statusHint: string }> = ({ entries, statusHint }) => (
  <aside
    className="hidden lg:flex flex-col border-r p-4 overflow-hidden"
    style={{ background: '#0d0f17', borderColor: 'rgba(255,255,255,0.04)' }}
    data-testid="lobby-activity-log"
  >
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
        📜 Hoạt động phòng
      </span>
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
    <div className="space-y-2 flex-1 overflow-y-auto">
      {entries.map((e, i) => (
        <div
          key={i}
          className="text-xs italic"
          style={{
            color: e.tone === 'ok' ? 'rgba(74,222,128,0.85)'
              : e.tone === 'warn' ? 'rgba(248,113,113,0.85)'
              : '#6b7280',
          }}
        >
          {e.time} · {e.text}
        </div>
      ))}
      {statusHint && (
        <div className="text-xs font-semibold mt-2" style={{ color: '#fbbf24' }}>
          {statusHint}
        </div>
      )}
    </div>
  </aside>
);

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

type ChatPanelProps = Omit<ChatViewProps, 'onClose'> & {
  onlineCount?: number;
  cta?: React.ReactNode;
};

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, input, setInput, onSend, chatEndRef, onlineCount, cta }) => (
  <aside
    className="flex flex-col border-l"
    style={{ background: '#0d0f17', borderColor: 'rgba(255,255,255,0.04)' }}
    data-testid="lobby-chat-panel"
  >
    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="inline-flex items-center gap-1.5 text-[13px] font-bold">
        <span className="text-sm">💬</span>
        <span className="uppercase tracking-wider text-xs" style={{ color: '#d1d5db' }}>Trò chuyện</span>
      </div>
      {typeof onlineCount === 'number' && (
        <span className="text-[10px]" style={{ color: '#6b7280' }}>{onlineCount} online</span>
      )}
    </div>
    <ChatBody messages={messages} chatEndRef={chatEndRef} />
    <ChatReactionsRow onSend={onSend} />
    <ChatInputRow value={input} onChange={setInput} onSend={() => onSend(input)} />
    {cta && (
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {cta}
      </div>
    )}
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
