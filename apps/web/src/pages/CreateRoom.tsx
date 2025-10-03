import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    roomName: '',
    maxPlayers: 4,
    questionCount: 10,
    timePerQuestion: 30
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to room lobby
        navigate(`/room/${result.room.id}/lobby`, {
          state: { room: result.room }
        });
      } else {
        setError(result.message || 'Có lỗi xảy ra khi tạo phòng');
      }
    } catch (err) {
      console.error('Error creating room:', err);
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
              🎮 TẠO PHÒNG CHƠI
            </h1>
            <p className="text-gray-300 text-sm">
              Tạo phòng và mời bạn bè tham gia quiz cùng bạn
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Name */}
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium neon-pink mb-2">
                Tên phòng
              </label>
              <input
                id="roomName"
                name="roomName"
                type="text"
                required
                value={formData.roomName}
                onChange={handleTextChange}
                placeholder="Nhập tên phòng..."
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300 neon-input"
              />
            </div>

            {/* Max Players */}
            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium neon-pink mb-2">
                Số người chơi tối đa
              </label>
              <select
                id="maxPlayers"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300"
              >
                <option value={2}>2 người</option>
                <option value={4}>4 người</option>
                <option value={6}>6 người</option>
                <option value={8}>8 người</option>
              </select>
            </div>

            {/* Question Count */}
            <div>
              <label htmlFor="questionCount" className="block text-sm font-medium neon-pink mb-2">
                Số câu hỏi
              </label>
              <select
                id="questionCount"
                name="questionCount"
                value={formData.questionCount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300"
              >
                <option value={5}>5 câu</option>
                <option value={10}>10 câu</option>
                <option value={15}>15 câu</option>
                <option value={20}>20 câu</option>
              </select>
            </div>

            {/* Time Per Question */}
            <div>
              <label htmlFor="timePerQuestion" className="block text-sm font-medium neon-pink mb-2">
                Thời gian mỗi câu (giây)
              </label>
              <select
                id="timePerQuestion"
                name="timePerQuestion"
                value={formData.timePerQuestion}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-300"
              >
                <option value={15}>15 giây</option>
                <option value={30}>30 giây</option>
                <option value={45}>45 giây</option>
                <option value={60}>60 giây</option>
              </select>
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
