import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { api } from '../api/client';
import styles from './Tournaments.module.css';

interface SavedTournament {
  id: string;
  name: string;
  bracketSize?: number;
}

const STORAGE_KEY = 'biblequiz_my_tournaments';

function getSavedTournaments(): SavedTournament[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTournament(t: SavedTournament) {
  const list = getSavedTournaments().filter(x => x.id !== t.id);
  list.unshift(t);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function removeTournament(id: string) {
  const list = getSavedTournaments().filter(x => x.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const Tournaments: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savedTournaments, setSavedTournaments] = useState<SavedTournament[]>([]);

  // Create form
  const [createName, setCreateName] = useState('');
  const [bracketSize, setBracketSize] = useState(8);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Navigate by ID
  const [navId, setNavId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSavedTournaments(getSavedTournaments());
  }, [isAuthenticated, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await api.post('/api/tournaments', {
        name: createName.trim(),
        bracketSize,
      });
      const data = res.data;
      const id = data.tournamentId || data.id;
      saveTournament({ id, name: createName.trim(), bracketSize });
      setShowCreateModal(false);
      setCreateName('');
      navigate(`/tournaments/${id}`);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || err.response?.data?.error || 'Lỗi kết nối');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleNavigateById = () => {
    const id = navId.trim();
    if (!id) return;
    navigate(`/tournaments/${id}`);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeTournament(id);
    setSavedTournaments(getSavedTournaments());
  };

  if (!isAuthenticated) return null;

  return (
    <div className={`min-h-screen page-bg ${styles.page}`}>
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <button onClick={() => navigate('/')} className={styles.backBtn}>
            ← Trang chủ
          </button>
          <h1 className={styles.title}>🏆 Tournament</h1>
          <p className={styles.subtitle}>
            Tạo hoặc tham gia giải đấu loại trực tiếp
          </p>
        </div>

        {/* Action Cards */}
        <div className={styles.cardsGrid}>
          <div
            className={`page-card ${styles.actionCard}`}
            style={{
              border: '1px solid rgba(212,168,67,.35)',
              background: 'linear-gradient(135deg, var(--hp-card), rgba(212,168,67,.08))',
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <div className={styles.actionCardTop}>
              <span className={styles.actionIcon}>👑</span>
              <div>
                <h2 className={styles.actionName}>Tạo Tournament</h2>
                <p className={styles.actionDesc}>
                  Tạo giải đấu mới với bracket 4, 8 hoặc 16 người chơi. Chia sẻ ID để mời bạn bè.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`page-card ${styles.actionCard}`}
            style={{
              border: '1px solid rgba(0,245,212,.3)',
              background: 'linear-gradient(135deg, var(--hp-card), rgba(0,245,212,.08))',
            }}
            onClick={() => document.getElementById('nav-id-input')?.focus()}
          >
            <div className={styles.actionCardTop}>
              <span className={styles.actionIcon}>⚔️</span>
              <div>
                <h2 className={styles.actionName}>Tham gia Tournament</h2>
                <p className={styles.actionDesc}>
                  Nhập ID tournament để xem bracket và tham gia giải đấu.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigate by ID */}
        <div className={`page-card ${styles.savedCard}`}>
          <h2 className={styles.savedTitle}>🔍 Nhập ID Tournament</h2>
          <div className={styles.navigateSection}>
            <div className={styles.navigateRow}>
              <input
                id="nav-id-input"
                className={styles.formInput}
                value={navId}
                onChange={e => setNavId(e.target.value)}
                placeholder="VD: t-abc123"
                onKeyDown={e => e.key === 'Enter' && handleNavigateById()}
              />
              <button
                className={styles.goBtn}
                onClick={handleNavigateById}
                disabled={!navId.trim()}
              >
                Xem →
              </button>
            </div>
          </div>
        </div>

        {/* Saved Tournaments */}
        <div className={`page-card ${styles.savedCard}`} style={{ marginTop: 20 }}>
          <div className={styles.savedHeader}>
            <h2 className={styles.savedTitle}>📋 Tournament của bạn</h2>
          </div>

          {savedTournaments.length === 0 ? (
            <p className={styles.emptyList}>
              Bạn chưa tham gia tournament nào. Hãy tạo hoặc tham gia giải đấu đầu tiên!
            </p>
          ) : (
            savedTournaments.map(t => (
              <div
                key={t.id}
                className={styles.tournamentRow}
                onClick={() => navigate(`/tournaments/${t.id}`)}
              >
                <div>
                  <p className={styles.tournamentRowName}>{t.name}</p>
                  <p className={styles.tournamentRowMeta}>ID: {t.id}{t.bracketSize ? ` · ${t.bracketSize} người` : ''}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    className={styles.removeBtn}
                    onClick={e => handleRemove(e, t.id)}
                    title="Xoá khỏi danh sách"
                  >
                    ✕
                  </button>
                  <span className={styles.tournamentRowArrow}>→</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)} />
          <div className={styles.modalContent}>
            <button className={styles.modalClose} onClick={() => setShowCreateModal(false)}>✕</button>
            <h3 className={styles.modalTitle}>👑 Tạo Tournament mới</h3>
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên giải đấu *</label>
                <input
                  className={styles.formInput}
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="VD: Giải Kinh Thánh Mùa Hè"
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số người chơi (bracket size)</label>
                <select
                  className={styles.formSelect}
                  value={bracketSize}
                  onChange={e => setBracketSize(Number(e.target.value))}
                >
                  <option value={4}>4 người chơi</option>
                  <option value={8}>8 người chơi</option>
                  <option value={16}>16 người chơi</option>
                </select>
              </div>
              {createError && <p className={styles.errorMsg}>{createError}</p>}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={createLoading || !createName.trim()}
              >
                {createLoading ? 'Đang tạo...' : 'Tạo Tournament'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tournaments;
