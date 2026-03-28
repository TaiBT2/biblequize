import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useStomp } from '../hooks/useStomp';
import styles from './RoomLobby.module.css';

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
      <div className={`min-h-screen page-bg ${styles.centeredPage}`}>
        <div className={styles.countdownWrap}>
          <div className={styles.countdownNumber}>{countdown}</div>
          <p className={styles.countdownLabel}>Trò chơi bắt đầu!</p>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className={`min-h-screen page-bg ${styles.centeredPage}`}>
      <p className={styles.errorText}>{error}</p>
    </div>
  );

  if (!room) return (
    <div className={`min-h-screen page-bg ${styles.centeredPage}`}>
      <p className={styles.loadingText}>Đang tải phòng...</p>
    </div>
  );

  return (
    <div className="min-h-screen page-bg">
      <div className={styles.inner}>

        {/* Reconnecting banner */}
        {reconnecting && (
          <div className={styles.reconnectBanner}>
            ⚠️ Mất kết nối, đang kết nối lại...
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.roomName}>{room.roomName}</h1>
            <span className={styles.modeLabel}>{MODE_LABELS[room.mode] ?? room.mode}</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.roomCodeBadge}>
              Mã: <span className={styles.roomCodeValue}>{room.roomCode}</span>
            </div>
            <button onClick={handleCopyCode} className={styles.copyBtn}>
              Sao chép
            </button>
            <div
              className={styles.connectionDot}
              data-connected={String(connected)}
              title={connected ? 'Connected' : 'Disconnected'}
            />
          </div>
        </div>

        <div className={styles.mainGrid}>
          {/* Players list */}
          <div className={styles.card}>
            <div className={styles.playersHeader}>
              <span className={styles.playersHeaderText}>
                Người chơi ({room.currentPlayers}/{room.maxPlayers})
              </span>
              <span className={styles.playersHeaderText}>
                Sẵn sàng: {readyCount}/{room.currentPlayers}
              </span>
            </div>

            {/* Team vs Team: 2 columns */}
            {isTeamVsTeam ? (
              <div className={styles.teamGrid}>
                <div>
                  <div className={`${styles.teamLabel} ${styles.teamLabelBlue}`}>
                    🔵 TEAM A {myPlayer?.team === 'A' && <span className={styles.teamYouBadge}>(bạn)</span>}
                  </div>
                  <div className={styles.teamPlayerList}>
                    {teamAPlayers.map(p => (
                      <PlayerCard key={p.id} player={p} hostId={room.hostId} myUsername={myUsername()} teamColor="blue" />
                    ))}
                    {teamAPlayers.length === 0 && (
                      <div className={styles.emptyTeamSlot}>Chưa có ai</div>
                    )}
                  </div>
                </div>
                <div>
                  <div className={`${styles.teamLabel} ${styles.teamLabelRed}`}>
                    🔴 TEAM B {myPlayer?.team === 'B' && <span className={styles.teamYouBadge}>(bạn)</span>}
                  </div>
                  <div className={styles.teamPlayerList}>
                    {teamBPlayers.map(p => (
                      <PlayerCard key={p.id} player={p} hostId={room.hostId} myUsername={myUsername()} teamColor="red" />
                    ))}
                    {teamBPlayers.length === 0 && (
                      <div className={styles.emptyTeamSlot}>Chưa có ai</div>
                    )}
                  </div>
                </div>
              </div>
            ) : isSuddenDeath ? (
              <div>
                <div className={styles.sdTitle}>
                  👑 Thứ tự thi đấu (King of the Hill)
                </div>
                <div className={styles.sdList}>
                  {room.players.map((p, idx) => (
                    <div key={p.id} className={styles.sdRow} data-rank={idx < 2 ? String(idx) : 'other'}>
                      <div className={styles.sdBadge} data-rank={idx < 2 ? String(idx) : 'other'}>
                        {idx === 0 ? '👑' : idx === 1 ? '⚔️' : `#${idx + 1}`}
                      </div>
                      <div className={styles.sdPlayerInfo}>
                        <div className={styles.sdPlayerName}>{p.username}{p.username === myUsername() ? ' (bạn)' : ''}</div>
                        <div className={styles.sdPlayerRole}>{idx === 0 ? 'Giữ ghế nóng' : idx === 1 ? 'Challenger' : 'Đang chờ'}</div>
                      </div>
                      {p.userId === room.hostId && <span className={styles.sdHostBadge}>👑 Host</span>}
                      <div className={styles.sdReadyBadge} data-ready={String(p.isReady)}>
                        {p.isReady ? '✓' : 'WAIT'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Default grid */
              <div className={styles.defaultPlayerGrid}>
                {room.players.map((p) => (
                  <div
                    key={p.id}
                    className={styles.defaultPlayerRow}
                    data-ready={String(p.isReady)}
                  >
                    <div className={styles.defaultPlayerLeft}>
                      <div className={styles.defaultAvatar}>
                        {p.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className={styles.defaultPlayerName}>{p.username}</div>
                        {p.userId === room.hostId && <div className={styles.defaultHostBadge}>👑 Host</div>}
                      </div>
                    </div>
                    <div className={styles.defaultReadyBadge} data-ready={String(p.isReady)}>
                      {p.isReady ? '✓ READY' : 'WAIT'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room info + controls */}
          <div className={styles.cardSidebar}>
            <div className={styles.infoList}>
              {[
                { label: 'Chế độ', value: MODE_LABELS[room.mode] ?? room.mode },
                { label: 'Tổng câu', value: String(room.questionCount) },
                { label: 'Thời gian/câu', value: `${room.timePerQuestion}s` },
                { label: 'Chủ phòng', value: room.hostName },
              ].map(({ label, value }) => (
                <div key={label} className={styles.infoRow}>
                  <span className={styles.infoLabel}>{label}</span>
                  <span className={styles.infoValue}>{value}</span>
                </div>
              ))}
              <div className={styles.visibilityText}>
                {room.isPublic ? '🌐 Công khai' : '🔒 Riêng tư'}
              </div>
              {isTeamVsTeam && myPlayer && (
                <div className={styles.myTeamBox}>
                  Đội của bạn:{' '}
                  <strong className={styles.myTeamValue} data-team={myPlayer.team}>
                    {myPlayer.team === 'A' ? '🔵 Team A' : '🔴 Team B'}
                  </strong>
                </div>
              )}
            </div>

            <div className={styles.buttonGroup}>
              {isTeamVsTeam && (
                <button
                  onClick={handleSwitchTeam}
                  disabled={switchingTeam}
                  className={styles.switchTeamBtn}
                >
                  🔄 Đổi đội
                </button>
              )}
              <button
                onClick={handleToggleReady}
                className={styles.readyBtn}
                data-ready={String(myPlayer?.isReady ?? false)}
              >
                {myPlayer?.isReady ? '🔄 Hủy sẵn sàng' : '✅ Sẵn sàng'}
              </button>
              <button
                onClick={handleStart}
                disabled={room.status !== 'LOBBY' || readyCount < 2}
                className={`practice-start-btn ${styles.startBtn}`}
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
                className={styles.leaveBtn}
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
  <div
    className={styles.playerCard}
    data-ready={String(player.isReady)}
    data-team={teamColor}
  >
    <div className={styles.playerAvatar} data-team={teamColor}>
      {player.username?.[0]?.toUpperCase() || 'U'}
    </div>
    <div className={styles.playerInfo}>
      <div className={styles.playerName}>
        {player.username}{player.username === me ? ' (bạn)' : ''}
      </div>
      {player.userId === hostId && <div className={styles.playerHostBadge}>👑 Host</div>}
    </div>
    <div className={styles.readyBadge} data-ready={String(player.isReady)}>
      {player.isReady ? '✓' : '—'}
    </div>
  </div>
);

export default RoomLobby;
