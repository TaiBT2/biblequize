import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Multiplayer.module.css';

interface PublicRoom {
  id: string;
  roomCode: string;
  roomName: string;
  mode: string;
  currentPlayers: number;
  maxPlayers: number;
}

const MODES = [
  {
    id: 'SPEED_RACE',
    name: 'Speed Race',
    icon: '🏃',
    players: '2–20 người',
    desc: 'Trả lời đúng và nhanh để ghi điểm cao hơn. Không ai bị loại — ai nhiều điểm nhất thắng!',
    accent: 'rgba(91,155,242,.2)',
    accentBorder: 'rgba(91,155,242,.4)',
  },
  {
    id: 'BATTLE_ROYALE',
    name: 'Battle Royale',
    icon: '⚔️',
    players: '5–100 người',
    desc: 'Trả lời sai bị loại ngay. Top 3 người còn lại nhận huy chương!',
    accent: 'rgba(255,107,91,.15)',
    accentBorder: 'rgba(255,107,91,.4)',
  },
  {
    id: 'TEAM_VS_TEAM',
    name: 'Team vs Team',
    icon: '🫂',
    players: '4–40 người',
    desc: 'Chia 2 đội, cộng điểm theo đội. Bonus khi cả đội trả lời đúng!',
    accent: 'rgba(184,245,90,.1)',
    accentBorder: 'rgba(184,245,90,.35)',
  },
  {
    id: 'SUDDEN_DEATH',
    name: 'Sudden Death 1v1',
    icon: '🎯',
    players: '2+ người',
    desc: 'King of the Hill: ai sai trước thua, người thắng giữ ghế chờ đối thủ tiếp theo!',
    accent: 'rgba(212,168,67,.12)',
    accentBorder: 'rgba(212,168,67,.4)',
  },
];

const Multiplayer: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

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

  return (
    <div className={`min-h-screen page-bg ${styles.page}`}>
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <button
            onClick={() => navigate('/')}
            className={styles.backBtn}
          >
            ← Trang chủ
          </button>
          <h1 className={styles.title}>
            🎮 Chơi nhiều người
          </h1>
          <p className={styles.subtitle}>
            Chọn chế độ chơi và thách đấu bạn bè
          </p>
        </div>

        {/* Mode Cards */}
        <div className={styles.modesGrid}>
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className={`page-card ${styles.modeCard}`}
              style={{ border: `1px solid ${mode.accentBorder}`, background: `linear-gradient(135deg, var(--hp-card), ${mode.accent})` }}
            >
              <div className={styles.modeCardTop}>
                <span className={styles.modeIcon}>{mode.icon}</span>
                <div>
                  <h2 className={styles.modeName}>{mode.name}</h2>
                  <span className={styles.modePlayers}>{mode.players}</span>
                </div>
              </div>
              <p className={styles.modeDesc}>{mode.desc}</p>
              <div className={styles.modeActions}>
                <button
                  onClick={() => navigate(`/room/create?mode=${mode.id}`)}
                  className={`practice-start-btn ${styles.createBtn}`}
                >
                  Tạo phòng
                </button>
                <button
                  onClick={() => navigate('/room/join')}
                  className={styles.joinBtn}
                >
                  Nhập mã
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Public Rooms */}
        <div className={`page-card ${styles.publicRoomsCard}`}>
          <div className={styles.publicRoomsHeader}>
            <h2 className={styles.publicRoomsTitle}>
              🌐 Phòng công khai đang mở
            </h2>
            <button
              onClick={fetchPublicRooms}
              className={styles.refreshBtn}
            >
              {loadingRooms ? 'Đang tải...' : 'Làm mới ↻'}
            </button>
          </div>

          {publicRooms.length === 0 ? (
            <p className={styles.emptyRooms}>
              Chưa có phòng nào đang chờ. Hãy tạo phòng đầu tiên!
            </p>
          ) : (
            <div className={styles.roomList}>
              {publicRooms.map((room) => (
                <div key={room.id} className={styles.roomRow}>
                  <div>
                    <p className={styles.roomName}>{room.roomName}</p>
                    <p className={styles.roomMeta}>
                      {room.mode.replace(/_/g, ' ')} · {room.currentPlayers}/{room.maxPlayers} người
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/room/${room.id}/lobby`)}
                    className={`practice-start-btn ${styles.joinRoomBtn}`}
                  >
                    Vào
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Multiplayer;
