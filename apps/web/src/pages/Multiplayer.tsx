import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
    color: 'from-blue-500 to-cyan-500',
    border: 'border-blue-500/50',
    available: true,
  },
  {
    id: 'BATTLE_ROYALE',
    name: 'Battle Royale',
    icon: '⚔️',
    players: '5–100 người',
    desc: 'Trả lời sai bị loại ngay. Top 3 người còn lại nhận huy chương!',
    color: 'from-red-500 to-orange-500',
    border: 'border-red-500/50',
    available: true,
  },
  {
    id: 'TEAM_VS_TEAM',
    name: 'Team vs Team',
    icon: '🫂',
    players: '4–40 người',
    desc: 'Chia 2 đội, cộng điểm theo đội. Bonus khi cả đội trả lời đúng!',
    color: 'from-green-500 to-teal-500',
    border: 'border-green-500/50',
    available: true,
  },
  {
    id: 'SUDDEN_DEATH',
    name: 'Sudden Death 1v1',
    icon: '🎯',
    players: '2+ người',
    desc: 'King of the Hill: ai sai trước thua, người thắng giữ ghế chờ đối thủ tiếp theo!',
    color: 'from-purple-500 to-pink-500',
    border: 'border-purple-500/50',
    available: true,
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

  const handleCreate = (modeId: string) => {
    navigate(`/room/create?mode=${modeId}`);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6 relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-10 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1 mx-auto transition-colors"
          >
            ← Trang chủ
          </button>
          <h1 className="text-4xl font-bold neon-text mb-3">🎮 CHƠI NHIỀU NGƯỜI</h1>
          <p className="text-gray-300 text-base">Chọn chế độ chơi và thách đấu bạn bè</p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className={`relative bg-black/40 backdrop-blur-lg rounded-2xl p-6 border ${mode.border} shadow-xl transition-all duration-300 ${
                mode.available ? 'hover:scale-[1.02] hover:shadow-2xl' : 'opacity-60'
              }`}
            >
              {!mode.available && (
                <div className="absolute top-3 right-3 bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                  Sắp ra mắt
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl">{mode.icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{mode.name}</h2>
                  <span className="text-xs text-gray-400">{mode.players}</span>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-5 leading-relaxed">{mode.desc}</p>

              <div className="flex gap-3">
                <button
                  onClick={() => mode.available && handleCreate(mode.id)}
                  disabled={!mode.available}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white text-sm transition-all duration-300 ${
                    mode.available
                      ? `bg-gradient-to-r ${mode.color} hover:opacity-90 neon-btn`
                      : 'bg-gray-700 cursor-not-allowed'
                  }`}
                >
                  Tạo phòng
                </button>
                {mode.available && (
                  <button
                    onClick={() => navigate('/room/join')}
                    className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white text-sm bg-black/50 border border-gray-600 hover:border-gray-400 transition-all duration-300"
                  >
                    Nhập mã
                  </button>
                )}
                {!mode.available && (
                  <button
                    disabled
                    className="flex-1 py-2.5 px-4 rounded-lg font-medium text-sm bg-gray-700 text-gray-500 cursor-not-allowed"
                  >
                    Nhập mã
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Public Rooms */}
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">🌐 Phòng công khai đang mở</h2>
            <button
              onClick={fetchPublicRooms}
              className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
            >
              {loadingRooms ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          {publicRooms.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              Chưa có phòng nào đang chờ. Hãy tạo phòng đầu tiên!
            </p>
          ) : (
            <div className="space-y-3">
              {publicRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3 border border-gray-700"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{room.roomName}</p>
                    <p className="text-gray-400 text-xs">
                      {room.mode.replace('_', ' ')} · {room.currentPlayers}/{room.maxPlayers} người
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/room/${room.id}/lobby`)}
                    className="py-1.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg font-medium transition-colors"
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
