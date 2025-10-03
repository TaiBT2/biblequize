import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const JoinRoom: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!roomCode.trim()) {
      setError('Vui lòng nhập mã phòng');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ roomCode: roomCode.trim().toUpperCase() })
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to room lobby
        navigate(`/room/${result.room.id}/lobby`, {
          state: { room: result.room }
        });
      } else {
        setError(result.message || 'Có lỗi xảy ra khi vào phòng');
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animateDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold neon-text mb-4">
              ❤️ VÀO PHÒNG CHƠI
            </h1>
            <p className="text-gray-300 text-sm">
              Nhập mã phòng để tham gia cùng bạn bè
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Code Input */}
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium neon-pink mb-2">
                Mã phòng (6 ký tự)
              </label>
              <div className="relative">
                <input
                  id="roomCode"
                  name="roomCode"
                  type="text"
                  required
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã phòng..."
                  className="w-full px-4 py-3 bg-black/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 neon-input text-center text-lg font-medium tracking-widest"
                  style={{ letterSpacing: '0.3em' }}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-purple-400 text-sm font-mono">
                    {roomCode.length}/6
                  </span>
                </div>
              </div>
              
              {/* Room Code Preview */}
              {roomCode && (
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center space-x-2 bg-black/30 px-4 py-2 rounded-lg border border-purple-500/30">
                    <span className="text-sm text-gray-400">Mã phòng:</span>
                    <span className="font-mono text-lg font-bold neon-green tracking-wider">
                      {roomCode.padEnd(6, '-').split('').map((char, i) => (
                        <span key={i} className="inline-block w-6 text-center border border-purple-500/30 rounded mx-1">
                          {char}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-300"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading || !roomCode.trim()}
                className="flex-1 py-3 px-6 bg-purple-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed neon-btn"
              >
                {loading ? 'Đang kết nối...' : 'Vào phòng'}
              </button>
            </div>
          </form>

          {/* Helper Text */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs mb-2">
              Bạn có thể nhận mã phòng từ người tạo phòng
            </p>
            <button
              onClick={() => navigate('/room/create')}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-300"
            >
              Hoặc tạo phòng mới →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
