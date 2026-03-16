import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MODE_INFO: Record<string, { icon: string; label: string }> = {
  SPEED_RACE: { icon: '🏃', label: 'Speed Race' },
  BATTLE_ROYALE: { icon: '⚔️', label: 'Battle Royale' },
  TEAM_VS_TEAM: { icon: '🫂', label: 'Team vs Team' },
  SUDDEN_DEATH: { icon: '🎯', label: 'Sudden Death 1v1' },
};

const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    roomName: '',
    maxPlayers: 4,
    questionCount: 10,
    timePerQuestion: 30,
    mode: searchParams.get('mode') ?? 'SPEED_RACE',
    isPublic: false,
  });

  React.useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        navigate(`/room/${result.room.id}/lobby`, { state: { room: result.room } });
      } else {
        setError(result.message || 'Có lỗi xảy ra khi tạo phòng');
      }
    } catch {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s` }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold neon-text mb-4">🎮 TẠO PHÒNG CHƠI</h1>
            <p className="text-gray-300 text-sm">Tạo phòng và mời bạn bè tham gia quiz cùng bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium neon-pink mb-2">Tên phòng</label>
              <input
                name="roomName"
                type="text"
                required
                value={formData.roomName}
                onChange={handleTextChange}
                placeholder="Nhập tên phòng..."
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 neon-input"
              />
            </div>

            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium neon-pink mb-2">Chế độ chơi</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(MODE_INFO).map(([id, info]) => {
                  const isAvailable = true; // all modes available
                  const selected = formData.mode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => { if (isAvailable) setFormData(prev => ({ ...prev, mode: id })); }}
                      className={`relative flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        selected
                          ? 'bg-purple-600/40 border-purple-400 text-white'
                          : isAvailable
                          ? 'bg-black/30 border-gray-600 text-gray-300 hover:border-gray-400'
                          : 'bg-black/20 border-gray-700 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                      {!isAvailable && (
                        <span className="absolute top-1 right-1 text-xs text-gray-500">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-sm font-medium neon-pink mb-2">Số người chơi tối đa</label>
              <select
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300"
              >
                <option value={2}>2 người</option>
                <option value={4}>4 người</option>
                <option value={6}>6 người</option>
                <option value={8}>8 người</option>
                <option value={10}>10 người</option>
                <option value={20}>20 người</option>
                <option value={40}>40 người</option>
              </select>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-sm font-medium neon-pink mb-2">Số câu hỏi</label>
              <select
                name="questionCount"
                value={formData.questionCount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300"
              >
                <option value={5}>5 câu</option>
                <option value={10}>10 câu</option>
                <option value={15}>15 câu</option>
                <option value={20}>20 câu</option>
                <option value={30}>30 câu</option>
              </select>
            </div>

            {/* Time Per Question */}
            <div>
              <label className="block text-sm font-medium neon-pink mb-2">Thời gian mỗi câu (giây)</label>
              <select
                name="timePerQuestion"
                value={formData.timePerQuestion}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300"
              >
                <option value={15}>15 giây</option>
                <option value={20}>20 giây</option>
                <option value={30}>30 giây</option>
                <option value={45}>45 giây</option>
                <option value={60}>60 giây</option>
              </select>
            </div>

            {/* Public toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  formData.isPublic ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    formData.isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-300">
                {formData.isPublic ? '🌐 Phòng công khai' : '🔒 Phòng riêng tư'}
              </span>
            </div>

            {error && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/multiplayer')}
                className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-300"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-6 bg-purple-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed neon-btn"
              >
                {loading ? 'Đang tạo...' : 'Tạo phòng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
