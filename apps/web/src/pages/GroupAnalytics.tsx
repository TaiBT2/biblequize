import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { api } from '../api/client';
import styles from './GroupDetail.module.css';

interface Analytics {
  totalMembers: number;
  activeToday: number;
  totalQuizzes: number;
  avgScore: number;
}

const GroupAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/groups/${id}/analytics`);
      if (res.data.success) {
        setAnalytics(res.data.analytics || res.data);
      } else {
        setError(res.data.message || 'Không thể tải dữ liệu');
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Bạn không có quyền xem phân tích nhóm này');
      } else {
        setError(err.response?.data?.message || 'Lỗi kết nối');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAnalytics();
  }, [isAuthenticated, navigate, fetchAnalytics]);

  if (loading) {
    return (
      <div className={`min-h-screen page-bg ${styles.page}`}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen page-bg ${styles.page}`}>
        <div className={styles.inner}>
          <div className={styles.errorWrap}>
            <p className={styles.errorMsg}>{error}</p>
            <button className={styles.retryBtn} onClick={fetchAnalytics}>Thử lại</button>
            <div style={{ marginTop: '1rem' }}>
              <button className={styles.backBtn} onClick={() => navigate(`/groups/${id}`)}>
                ← Quay lại nhóm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Tổng thành viên', value: analytics?.totalMembers ?? 0, icon: '👥', color: 'rgba(184,245,90,.15)', border: 'rgba(184,245,90,.3)' },
    { label: 'Hoạt động hôm nay', value: analytics?.activeToday ?? 0, icon: '🟢', color: 'rgba(91,155,242,.12)', border: 'rgba(91,155,242,.3)' },
    { label: 'Tổng bài quiz', value: analytics?.totalQuizzes ?? 0, icon: '📝', color: 'rgba(212,168,67,.1)', border: 'rgba(212,168,67,.25)' },
    { label: 'Điểm trung bình', value: analytics?.avgScore ?? 0, icon: '📊', color: 'rgba(255,107,91,.1)', border: 'rgba(255,107,91,.25)' },
  ];

  return (
    <div className={`min-h-screen page-bg ${styles.page}`}>
      <div className={styles.inner}>
        <div className={styles.headerSection}>
          <button onClick={() => navigate(`/groups/${id}`)} className={styles.backBtn}>
            ← Quay lại nhóm
          </button>
          <h1 className={styles.groupName} style={{ marginTop: '12px' }}>📊 Phân tích nhóm</h1>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '24px',
        }}>
          {cards.map(card => (
            <div
              key={card.label}
              className="page-card"
              style={{
                padding: '24px 20px',
                background: `linear-gradient(135deg, var(--hp-card), ${card.color})`,
                border: `1px solid ${card.border}`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{card.icon}</div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '1.75rem',
                color: 'var(--hp-text)',
                marginBottom: '4px',
              }}>
                {card.value}
              </div>
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: '.8rem',
                color: 'var(--hp-muted)',
              }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupAnalytics;
