import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import styles from './JoinRoom.module.css';

const JoinRoom: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');

  React.useEffect(() => {
    if (!isAuthenticated) navigate('/login');
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
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ roomCode: roomCode.trim().toUpperCase() }),
      });
      const result = await response.json();
      if (result.success) {
        navigate(`/room/${result.room.id}/lobby`, { state: { room: result.room } });
      } else {
        setError(result.message || 'Có lỗi xảy ra khi vào phòng');
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
              🚪 Vào phòng chơi
            </h1>
            <p className={styles.subtitle}>
              Nhập mã phòng để tham gia cùng bạn bè
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <label className={styles.fieldLabel}>
                Mã phòng (6 ký tự)
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  className={`form-input ${styles.codeInput}`}
                />
                <span className={styles.charCounter}>
                  {roomCode.length}/6
                </span>
              </div>

              {/* Code preview */}
              {roomCode && (
                <div className={styles.codePreview}>
                  {roomCode.padEnd(6, '-').split('').map((char, i) => (
                    <div
                      key={i}
                      className={styles.codeChar}
                      data-filled={char !== '-'}
                    >
                      {char !== '-' ? char : ''}
                    </div>
                  ))}
                </div>
              )}
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
                disabled={loading || roomCode.trim().length < 1}
                className={`practice-start-btn ${styles.submitBtn}`}
              >
                {loading ? 'Đang kết nối...' : 'Vào phòng'}
              </button>
            </div>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerHint}>
              Bạn có thể nhận mã phòng từ người tạo phòng
            </p>
            <button
              onClick={() => navigate('/room/create')}
              className={styles.createLink}
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
