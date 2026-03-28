import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './CreateRoom.module.css';

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
    <div className={`min-h-screen page-bg ${styles.pageWrapper}`}>
      <div className={styles.inner}>
        <div className={`page-card ${styles.card}`}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              🎮 Tạo phòng chơi
            </h1>
            <p className={styles.subtitle}>
              Tạo phòng và mời bạn bè tham gia quiz cùng bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Room Name */}
            <div>
              <label className={styles.fieldLabel}>Tên phòng</label>
              <input
                name="roomName"
                type="text"
                required
                value={formData.roomName}
                onChange={handleTextChange}
                placeholder="Nhập tên phòng..."
                className="form-input"
              />
            </div>

            {/* Mode Selection */}
            <div>
              <label className={styles.fieldLabel}>Chế độ chơi</label>
              <div className={styles.modeGrid}>
                {Object.entries(MODE_INFO).map(([id, info]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mode: id }))}
                    className={styles.modeBtn}
                    data-active={formData.mode === id}
                  >
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Players */}
            <div>
              <label className={styles.fieldLabel}>Số người chơi tối đa</label>
              <select name="maxPlayers" value={formData.maxPlayers} onChange={handleInputChange} className="form-select">
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
              <label className={styles.fieldLabel}>Số câu hỏi</label>
              <select name="questionCount" value={formData.questionCount} onChange={handleInputChange} className="form-select">
                <option value={5}>5 câu</option>
                <option value={10}>10 câu</option>
                <option value={15}>15 câu</option>
                <option value={20}>20 câu</option>
                <option value={30}>30 câu</option>
              </select>
            </div>

            {/* Time Per Question */}
            <div>
              <label className={styles.fieldLabel}>Thời gian mỗi câu (giây)</label>
              <select name="timePerQuestion" value={formData.timePerQuestion} onChange={handleInputChange} className="form-select">
                <option value={15}>15 giây</option>
                <option value={20}>20 giây</option>
                <option value={30}>30 giây</option>
                <option value={45}>45 giây</option>
                <option value={60}>60 giây</option>
              </select>
            </div>

            {/* Public toggle */}
            <div className={styles.toggleRow}>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                className={styles.toggleTrack}
                data-active={formData.isPublic}
              >
                <span className={styles.toggleThumb} />
              </button>
              <span className={styles.toggleLabel}>
                {formData.isPublic ? '🌐 Phòng công khai' : '🔒 Phòng riêng tư'}
              </span>
            </div>

            {error && (
              <div className={styles.errorBox}>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            <div className={styles.buttonRow}>
              <button
                type="button"
                onClick={() => navigate('/multiplayer')}
                className={styles.cancelBtn}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`practice-start-btn ${styles.submitBtn}`}
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
