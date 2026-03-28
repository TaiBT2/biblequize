import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { api } from '../api/client';
import styles from './Groups.module.css';

interface SavedGroup {
  id: string;
  name: string;
  code?: string;
}

const STORAGE_KEY = 'biblequiz_my_groups';

function getSavedGroups(): SavedGroup[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveGroup(group: SavedGroup) {
  const groups = getSavedGroups().filter(g => g.id !== group.id);
  groups.unshift(group);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

function removeGroup(id: string) {
  const groups = getSavedGroups().filter(g => g.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([]);

  // Create form
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join form
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSavedGroups(getSavedGroups());
  }, [isAuthenticated, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await api.post('/api/groups', {
        name: createName.trim(),
        description: createDesc.trim(),
      });
      if (res.data.success) {
        const group = res.data.group;
        saveGroup({ id: group.id, name: group.name, code: group.code });
        setShowCreateModal(false);
        setCreateName('');
        setCreateDesc('');
        navigate(`/groups/${group.id}`);
      } else {
        setCreateError(res.data.message || 'Tạo nhóm thất bại');
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError('');
    try {
      const res = await api.post('/api/groups/join', { code: joinCode.trim().toUpperCase() });
      if (res.data.success) {
        const group = res.data.group;
        saveGroup({ id: group.id, name: group.name, code: group.code });
        setShowJoinModal(false);
        setJoinCode('');
        navigate(`/groups/${group.id}`);
      } else {
        setJoinError(res.data.message || 'Tham gia thất bại');
      }
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Mã nhóm không hợp lệ');
    } finally {
      setJoinLoading(false);
    }
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
          <h1 className={styles.title}>⛪ Nhóm Hội thánh</h1>
          <p className={styles.subtitle}>
            Tạo hoặc tham gia nhóm để cùng nhau học Kinh Thánh
          </p>
        </div>

        {/* Action Cards */}
        <div className={styles.cardsGrid}>
          <div
            className={`page-card ${styles.actionCard}`}
            style={{
              border: '1px solid rgba(184,245,90,.35)',
              background: 'linear-gradient(135deg, var(--hp-card), rgba(184,245,90,.08))',
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <div className={styles.actionCardTop}>
              <span className={styles.actionIcon}>➕</span>
              <div>
                <h2 className={styles.actionName}>Tạo nhóm mới</h2>
                <p className={styles.actionDesc}>
                  Tạo nhóm cho hội thánh, lớp học, hoặc nhóm bạn bè. Chia sẻ mã mời để mọi người tham gia.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`page-card ${styles.actionCard}`}
            style={{
              border: '1px solid rgba(91,155,242,.4)',
              background: 'linear-gradient(135deg, var(--hp-card), rgba(91,155,242,.08))',
            }}
            onClick={() => setShowJoinModal(true)}
          >
            <div className={styles.actionCardTop}>
              <span className={styles.actionIcon}>🔑</span>
              <div>
                <h2 className={styles.actionName}>Tham gia nhóm</h2>
                <p className={styles.actionDesc}>
                  Nhập mã mời từ trưởng nhóm để tham gia nhóm hiện có.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Groups */}
        <div className={`page-card ${styles.savedGroupsCard}`}>
          <div className={styles.savedGroupsHeader}>
            <h2 className={styles.savedGroupsTitle}>👥 Nhóm của bạn</h2>
          </div>

          {savedGroups.length === 0 ? (
            <p className={styles.emptyGroups}>
              Bạn chưa tham gia nhóm nào. Hãy tạo hoặc tham gia nhóm đầu tiên!
            </p>
          ) : (
            savedGroups.map(g => (
              <div
                key={g.id}
                className={styles.groupRow}
                onClick={() => navigate(`/groups/${g.id}`)}
              >
                <div>
                  <p className={styles.groupRowName}>{g.name}</p>
                  {g.code && <p className={styles.groupRowCode}>Mã: {g.code}</p>}
                </div>
                <span className={styles.groupRowArrow}>→</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)} />
          <div className={styles.modalContent}>
            <button className={styles.modalClose} onClick={() => setShowCreateModal(false)}>✕</button>
            <h3 className={styles.modalTitle}>➕ Tạo nhóm mới</h3>
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên nhóm *</label>
                <input
                  className={styles.formInput}
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="VD: Hội thánh Tin Lành ABC"
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mô tả</label>
                <textarea
                  className={styles.formTextarea}
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  placeholder="Mô tả ngắn về nhóm (tuỳ chọn)"
                  maxLength={500}
                />
              </div>
              {createError && <p className={styles.errorMsg}>{createError}</p>}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={createLoading || !createName.trim()}
              >
                {createLoading ? 'Đang tạo...' : 'Tạo nhóm'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className={styles.modal}>
          <div className={styles.modalOverlay} onClick={() => setShowJoinModal(false)} />
          <div className={styles.modalContent}>
            <button className={styles.modalClose} onClick={() => setShowJoinModal(false)}>✕</button>
            <h3 className={styles.modalTitle}>🔑 Tham gia nhóm</h3>
            <form onSubmit={handleJoin}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mã mời nhóm</label>
                <input
                  className={styles.formInput}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="VD: ABC123"
                  maxLength={20}
                  autoFocus
                  style={{ letterSpacing: '.1em', textAlign: 'center', fontSize: '1.1rem' }}
                />
              </div>
              {joinError && <p className={styles.errorMsg}>{joinError}</p>}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={joinLoading || !joinCode.trim()}
              >
                {joinLoading ? 'Đang tham gia...' : 'Tham gia'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
