import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useStomp } from '../hooks/useStomp';

type Player = {
  id: string; userId: string; username: string; avatarUrl?: string;
  isReady: boolean; score: number; team?: string; playerStatus?: string;
};
type RoomDetails = {
  id: string; roomCode: string; roomName: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'ENDED' | 'CANCELLED';
  mode: string; isPublic: boolean;
  maxPlayers: number; currentPlayers: number;
  questionCount: number; timePerQuestion: number;
  hostId: string; hostName: string; players: Player[];
};

const MODE_LABELS: Record<string, string> = {
  SPEED_RACE: '🏃 Speed Race',
  BATTLE_ROYALE: '⚔️ Battle Royale',
  TEAM_VS_TEAM: '🫂 Team vs Team',
  SUDDEN_DEATH: '🎯 Sudden Death',
};

const myUsername = () => localStorage.getItem('userName') ?? '';

const RoomLobby: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialRoom: RoomDetails | undefined = location.state?.room;
  const [room, setRoom] = useState<RoomDetails | null>(initialRoom ?? null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [switchingTeam, setSwitchingTeam] = useState(false);

  const { connected, reconnecting, send } = useStomp({
    roomId,
    onReconnect: () => { fetchRoom(); },
    onMessage: (msg) => {
      switch (msg.type) {
        case 'PLAYER_JOINED':
        case 'PLAYER_LEFT':
        case 'PLAYER_READY':
        case 'PLAYER_UNREADY':
          fetchRoom();
          break;
        case 'GAME_STARTING': {
          const d = msg.data as { countdown: number };
          setCountdown(d.countdown);
          const myTeam = room?.players.find(p => p.username === myUsername())?.team ?? null;
          setTimeout(() => navigate(`/room/${roomId}/quiz`, {
            replace: true,
            state: { mode: room?.mode, myTeam }
          }), d.countdown * 1000);
          break;
        }
        case 'ROOM_STARTING':
        case 'QUESTION_START':
          navigate(`/room/${roomId}/quiz`, {
            replace: true,
            state: { mode: room?.mode, myTeam: room?.players.find(p => p.username === myUsername())?.team ?? null }
          });
          break;
        case 'QUIZ_END':
          fetchRoom();
          break;
      }
    },
  });

  const fetchRoom = async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await res.json();
      if (data.success) setRoom(data.room);
      else setError(data.message || 'Không lấy được thông tin phòng');
    } catch {
      setError('Lỗi mạng khi tải thông tin phòng');
    }
  };

  useEffect(() => {
    if (!room) fetchRoom();
  }, []);

  const handleToggleReady = () => {
    if (!roomId) return;
    send(`/app/room/${roomId}/ready`, {});
  };

  const handleStart = async () => {
    if (!roomId) return;
    try {
      await fetch(`/api/rooms/${roomId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      send(`/app/room/${roomId}/start`, {});
    } catch {
      setError('Không thể bắt đầu phòng. Vui lòng thử lại.');
    }
  };

  const handleSwitchTeam = async () => {
    if (!roomId) return;
    setSwitchingTeam(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/switch-team`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await res.json();
      if (data.success) setRoom(data.room);
    } catch {
      setError('Không thể đổi đội');
    } finally {
      setSwitchingTeam(false);
    }
  };

  const handleCopyCode = () => {
    if (room?.roomCode) navigator.clipboard.writeText(room.roomCode);
  };

  const readyCount = useMemo(() => room?.players.filter((p) => p.isReady).length ?? 0, [room]);
  const isTeamVsTeam = room?.mode === 'TEAM_VS_TEAM';
  const isSuddenDeath = room?.mode === 'SUDDEN_DEATH';
  const teamAPlayers = room?.players.filter(p => p.team === 'A') ?? [];
  const teamBPlayers = room?.players.filter(p => p.team === 'B') ?? [];
  const myPlayer = room?.players.find(p => p.username === myUsername());

  if (countdown !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-bold neon-text animate-bounce">{countdown}</div>
          <p className="text-purple-300 text-xl mt-4">Trò chơi bắt đầu!</p>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!room) return <div className="min-h-screen flex items-center justify-center text-white">Đang tải phòng...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Reconnecting banner */}
        {reconnecting && (
          <div className="mb-4 px-4 py-2.5 bg-yellow-900/40 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm text-center animate-pulse">
            ⚠️ Mất kết nối, đang kết nối lại...
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold neon-text">{room.roomName}</h1>
            <span className="text-xs text-purple-300 mt-1">{MODE_LABELS[room.mode] ?? room.mode}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-purple-300 bg-black/30 px-3 py-1.5 rounded-lg border border-purple-500/30">
              Mã: <span className="font-mono font-bold text-white">{room.roomCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="text-xs bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 px-3 py-1.5 rounded-lg border border-purple-500/40 transition"
            >
              Sao chép
            </button>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} title={connected ? 'Connected' : 'Disconnected'} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Players list — mode-specific layout */}
          <div className="md:col-span-2 bg-black/40 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-purple-200 text-sm">
                Người chơi ({room.currentPlayers}/{room.maxPlayers})
              </div>
              <div className="text-purple-200 text-sm">
                Sẵn sàng: {readyCount}/{room.currentPlayers}
              </div>
            </div>

            {/* Team vs Team: 2 columns */}
            {isTeamVsTeam ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Team A */}
                <div>
                  <div className="text-blue-400 text-xs font-bold mb-2 flex items-center gap-1">
                    🔵 TEAM A
                    {myPlayer?.team === 'A' && <span className="text-yellow-400">(bạn)</span>}
                  </div>
                  <div className="space-y-2">
                    {teamAPlayers.map(p => (
                      <PlayerCard key={p.id} player={p} hostId={room.hostId} myUsername={myUsername()} teamColor="blue" />
                    ))}
                    {teamAPlayers.length === 0 && (
                      <div className="text-gray-500 text-xs text-center py-3 border border-dashed border-gray-700 rounded-lg">Chưa có ai</div>
                    )}
                  </div>
                </div>
                {/* Team B */}
                <div>
                  <div className="text-red-400 text-xs font-bold mb-2 flex items-center gap-1">
                    🔴 TEAM B
                    {myPlayer?.team === 'B' && <span className="text-yellow-400">(bạn)</span>}
                  </div>
                  <div className="space-y-2">
                    {teamBPlayers.map(p => (
                      <PlayerCard key={p.id} player={p} hostId={room.hostId} myUsername={myUsername()} teamColor="red" />
                    ))}
                    {teamBPlayers.length === 0 && (
                      <div className="text-gray-500 text-xs text-center py-3 border border-dashed border-gray-700 rounded-lg">Chưa có ai</div>
                    )}
                  </div>
                </div>
              </div>
            ) : isSuddenDeath ? (
              /* Sudden Death: show queue order */
              <div>
                <div className="text-yellow-400 text-xs font-bold mb-3">👑 Thứ tự thi đấu (King of the Hill)</div>
                <div className="space-y-2">
                  {room.players.map((p, idx) => (
                    <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                      idx === 0 ? 'border-yellow-400/60 bg-yellow-900/10' :
                      idx === 1 ? 'border-orange-400/60 bg-orange-900/10' :
                      'border-purple-500/30 bg-black/30'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-300' :
                        idx === 1 ? 'bg-orange-500/20 text-orange-300' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {idx === 0 ? '👑' : idx === 1 ? '⚔️' : `#${idx + 1}`}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{p.username}{p.username === myUsername() ? ' (bạn)' : ''}</div>
                        <div className="text-gray-400 text-xs">{idx === 0 ? 'Giữ ghế nóng' : idx === 1 ? 'Challenger' : 'Đang chờ'}</div>
                      </div>
                      {p.userId === room.hostId && <span className="ml-auto text-yellow-400 text-xs">👑 Host</span>}
                      <div className={`ml-auto text-xs px-2 py-0.5 rounded ${p.isReady ? 'bg-green-600/40 text-green-200' : 'bg-gray-600/40 text-gray-300'}`}>
                        {p.isReady ? '✓' : 'WAIT'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Default: grid */
              <div className="grid grid-cols-2 gap-3">
                {room.players.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-lg border ${p.isReady ? 'border-green-500/60 bg-green-900/10' : 'border-purple-500/30 bg-black/30'} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-800/40 border border-purple-500/40 flex items-center justify-center">
                        <span className="text-lg">{p.username?.[0]?.toUpperCase() || 'U'}</span>
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{p.username}</div>
                        {p.userId === room.hostId && <div className="text-xs text-yellow-400">👑 Host</div>}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${p.isReady ? 'bg-green-600/40 text-green-200' : 'bg-gray-600/40 text-gray-300'}`}>
                      {p.isReady ? '✓ READY' : 'WAIT'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room info + controls */}
          <div className="bg-black/40 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-2 text-sm text-purple-200 mb-4">
              <div>Chế độ: <b className="text-white">{MODE_LABELS[room.mode] ?? room.mode}</b></div>
              <div>Tổng câu: <b className="text-white">{room.questionCount}</b></div>
              <div>Thời gian/câu: <b className="text-white">{room.timePerQuestion}s</b></div>
              <div>Chủ phòng: <b className="text-white">{room.hostName}</b></div>
              <div>{room.isPublic ? '🌐 Công khai' : '🔒 Riêng tư'}</div>
              {isTeamVsTeam && myPlayer && (
                <div className="mt-1 p-2 rounded-lg border border-purple-500/30 bg-purple-900/10">
                  Đội của bạn:{' '}
                  <b className={myPlayer.team === 'A' ? 'text-blue-400' : 'text-red-400'}>
                    {myPlayer.team === 'A' ? '🔵 Team A' : '🔴 Team B'}
                  </b>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {/* Switch team button (Team vs Team only) */}
              {isTeamVsTeam && (
                <button
                  onClick={handleSwitchTeam}
                  disabled={switchingTeam}
                  className="w-full py-2 rounded-lg bg-blue-700/40 hover:bg-blue-700/60 transition text-blue-200 font-medium text-sm border border-blue-500/30"
                >
                  🔄 Đổi đội
                </button>
              )}
              <button
                onClick={handleToggleReady}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition text-white font-medium text-sm"
              >
                {myPlayer?.isReady ? '🔄 Hủy sẵn sàng' : '✅ Sẵn sàng'}
              </button>
              <button
                onClick={handleStart}
                disabled={room.status !== 'LOBBY' || readyCount < 2}
                className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 transition text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🚀 Bắt đầu
              </button>
              <button
                onClick={async () => {
                  if (roomId) {
                    try {
                      await fetch(`/api/rooms/${roomId}/leave`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                      });
                    } catch {}
                  }
                  navigate('/multiplayer');
                }}
                className="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition text-gray-300 text-sm"
              >
                ← Rời phòng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerCard: React.FC<{ player: Player; hostId: string; myUsername: string; teamColor: 'blue' | 'red' }> = ({ player, hostId, myUsername: me, teamColor }) => (
  <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${
    player.isReady
      ? teamColor === 'blue' ? 'border-blue-400/50 bg-blue-900/10' : 'border-red-400/50 bg-red-900/10'
      : 'border-gray-600/40 bg-black/20'
  }`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
      teamColor === 'blue' ? 'bg-blue-900/40 border-blue-500/40' : 'bg-red-900/40 border-red-500/40'
    }`}>
      {player.username?.[0]?.toUpperCase() || 'U'}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-white text-xs font-medium truncate">{player.username}{player.username === me ? ' (bạn)' : ''}</div>
      {player.userId === hostId && <div className="text-yellow-400 text-xs">👑 Host</div>}
    </div>
    <div className={`text-xs px-1.5 py-0.5 rounded ${player.isReady ? 'bg-green-600/40 text-green-200' : 'bg-gray-600/40 text-gray-400'}`}>
      {player.isReady ? '✓' : '—'}
    </div>
  </div>
);

export default RoomLobby;
