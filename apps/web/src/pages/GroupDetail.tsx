import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { api } from '../api/client';
import styles from './GroupDetail.module.css';

interface Member {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
}

interface Group {
  id: string;
  name: string;
  code: string;
  description?: string;
  isPublic: boolean;
  maxMembers: number;
  members: Member[];
  leaderUserId: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  score: number;
  role?: string;
}

interface Announcement {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface QuizSet {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
}

type TabKey = 'leaderboard' | 'members' | 'announcements' | 'quizsets';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'leaderboard', label: 'Bảng xếp hạng', icon: '🏆' },
  { key: 'members', label: 'Thành viên', icon: '👥' },
  { key: 'announcements', label: 'Thông báo', icon: '📢' },
  { key: 'quizsets', label: 'Quiz Sets', icon: '📝' },
];

const STORAGE_KEY = 'biblequiz_my_groups';

function updateSavedGroup(group: { id: string; name: string; code: string }) {
  try {
    const groups = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const existing = groups.findIndex((g: any) => g.id === group.id);
    if (existing >= 0) {
      groups[existing] = { id: group.id, name: group.name, code: group.code };
    } else {
      groups.unshift({ id: group.id, name: group.name, code: group.code });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch { /* ignore */ }
}

function removeSavedGroup(id: string) {
  try {
    const groups = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups.filter((g: any) => g.id !== id)));
  } catch { /* ignore */ }
}

const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<TabKey>('leaderboard');

  // Leaderboard
  const [period, setPeriod] = useState<'weekly' | 'all_time'>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  // Quiz Sets
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [quizSetsLoading, setQuizSetsLoading] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPublic, setEditPublic] = useState(false);
  const [editMaxMembers, setEditMaxMembers] = useState(50);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Copy state
  const [copied, setCopied] = useState(false);

  const isLeader = group?.leaderUserId === user?.email ||
    group?.members?.some(m => m.role === 'LEADER' && m.name === user?.name);

  const isLeaderOrMod = isLeader ||
    group?.members?.some(m => (m.role === 'LEADER' || m.role === 'MODERATOR') && m.name === user?.name);

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/groups/${id}`);
      if (res.data.success) {
        setGroup(res.data.group);
        updateSavedGroup(res.data.group);
      } else {
        setError(res.data.message || 'Không thể tải thông tin nhóm');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true);
    try {
      const res = await api.get(`/api/groups/${id}/leaderboard?period=${period}`);
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard || res.data.entries || []);
      }
    } catch { /* ignore */ }
    finally { setLbLoading(false); }
  }, [id, period]);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const res = await api.get(`/api/groups/${id}/announcements?limit=20&offset=0`);
      if (res.data.success) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch { /* ignore */ }
    finally { setAnnouncementsLoading(false); }
  }, [id]);

  const fetchQuizSets = useCallback(async () => {
    setQuizSetsLoading(true);
    try {
      const res = await api.get(`/api/groups/${id}/quiz-sets`);
      if (res.data.success) {
        setQuizSets(res.data.quizSets || []);
      }
    } catch { /* ignore */ }
    finally { setQuizSetsLoading(false); }
  }, [id]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  useEffect(() => {
    if (!group) return;
    if (activeTab === 'leaderboard') fetchLeaderboard();
    else if (activeTab === 'announcements') fetchAnnouncements();
    else if (activeTab === 'quizsets') fetchQuizSets();
  }, [activeTab, group, fetchLeaderboard, fetchAnnouncements, fetchQuizSets]);

  useEffect(() => {
    if (activeTab === 'leaderboard' && group) fetchLeaderboard();
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyCode = async () => {
    if (!group) return;
    try {
      await navigator.clipboard.writeText(group.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = group.code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKick = async (userId: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá ${name} khỏi nhóm?`)) return;
    try {
      await api.delete(`/api/groups/${id}/members/${userId}`);
      fetchGroup();
    } catch { /* ignore */ }
  };

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    setPostingAnnouncement(true);
    try {
      const res = await api.post(`/api/groups/${id}/announcements`, {
        content: newAnnouncement.trim(),
      });
      if (res.data.success) {
        setNewAnnouncement('');
        fetchAnnouncements();
      }
    } catch { /* ignore */ }
    finally { setPostingAnnouncement(false); }
  };

  const handleLeave = async () => {
    if (!confirm('Bạn có chắc muốn rời khỏi nhóm này?')) return;
    try {
      await api.delete(`/api/groups/${id}/leave`);
      removeSavedGroup(id!);
      navigate('/groups');
    } catch { /* ignore */ }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await api.patch(`/api/groups/${id}`, {
        name: editName.trim(),
        description: editDesc.trim(),
        isPublic: editPublic,
        maxMembers: editMaxMembers,
      });
      if (res.data.success) {
        setShowEditModal(false);
        fetchGroup();
      } else {
        setEditError(res.data.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDesc(group.description || '');
    setEditPublic(group.isPublic);
    setEditMaxMembers(group.maxMembers);
    setEditError('');
    setShowEditModal(true);
  };

  // ── Render ──

  if (loading) {
    return (
      <div className={`min-h-screen page-bg ${styles.page}`}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className={`min-h-screen page-bg ${styles.page}`}>
        <div className={styles.inner}>
          <div className={styles.errorWrap}>
            <p className={styles.errorMsg}>{error || 'Không tìm thấy nhóm'}</p>
            <button className={styles.retryBtn} onClick={fetchGroup}>Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen page-bg ${styles.page}`}>
      <div className={styles.inner}>

        {/* ── Header ── */}
        <div className={styles.headerSection}>
          <div className={styles.topRow}>
            <button onClick={() => navigate('/groups')} className={styles.backBtn}>
              ← Danh sách nhóm
            </button>
            {isLeader && (
              <button className={styles.settingsBtn} onClick={openEditModal} title="Cài đặt nhóm">
                ⚙️
              </button>
            )}
          </div>

          <h1 className={styles.groupName}>{group.name}</h1>

          <div className={styles.groupMeta}>
            <div className={styles.codeWrap}>
              <span className={styles.codeLabel}>Mã mời:</span>
              <span className={styles.codeValue}>{group.code}</span>
              <button className={styles.copyBtn} onClick={handleCopyCode} title="Sao chép mã">
                {copied ? '✅' : '📋'}
              </button>
            </div>
            <span className={styles.metaItem}>👥 {group.members?.length || 0} thành viên</span>
            {isLeader && (
              <Link to={`/groups/${id}/analytics`} className={styles.analyticsLink}>
                📊 Phân tích
              </Link>
            )}
          </div>

          {group.description && (
            <p className={styles.groupDesc}>{group.description}</p>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className={styles.periodToggle}>
              <button
                className={`${styles.periodBtn} ${period === 'weekly' ? styles.periodBtnActive : ''}`}
                onClick={() => setPeriod('weekly')}
              >
                Tuần này
              </button>
              <button
                className={`${styles.periodBtn} ${period === 'all_time' ? styles.periodBtnActive : ''}`}
                onClick={() => setPeriod('all_time')}
              >
                Tất cả
              </button>
            </div>

            {lbLoading ? (
              <div className={styles.loadingWrap}><div className={styles.spinner} /></div>
            ) : leaderboard.length === 0 ? (
              <p className={styles.emptyState}>Chưa có dữ liệu xếp hạng</p>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={entry.userId} className={styles.leaderboardRow}>
                  <span className={`${styles.lbRank} ${i < 3 ? styles.lbRankGold : ''}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.rank || i + 1}
                  </span>
                  <div className={styles.lbAvatar}>
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      entry.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <span className={styles.lbName}>{entry.name}</span>
                  {entry.role && entry.role !== 'MEMBER' && (
                    <span className={styles.lbRoleBadge}>{entry.role}</span>
                  )}
                  <span className={styles.lbScore}>{entry.score}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Members */}
        {activeTab === 'members' && (
          <div>
            {(!group.members || group.members.length === 0) ? (
              <p className={styles.emptyState}>Chưa có thành viên</p>
            ) : (
              group.members.map(member => (
                <div key={member.userId} className={styles.memberRow}>
                  <div className={styles.memberAvatar}>
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      member.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <div className={styles.memberInfo}>
                    <p className={styles.memberName}>{member.name}</p>
                    <p className={styles.memberRole}>
                      {member.role === 'LEADER' ? '👑 Trưởng nhóm' :
                       member.role === 'MODERATOR' ? '🛡️ Quản lý' :
                       '👤 Thành viên'}
                    </p>
                  </div>
                  {isLeader && member.role !== 'LEADER' && (
                    <button
                      className={styles.kickBtn}
                      onClick={() => handleKick(member.userId, member.name)}
                    >
                      Xoá
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Announcements */}
        {activeTab === 'announcements' && (
          <div>
            {isLeaderOrMod && (
              <div className={styles.createAnnouncementWrap}>
                <input
                  className={styles.announcementInput}
                  value={newAnnouncement}
                  onChange={e => setNewAnnouncement(e.target.value)}
                  placeholder="Viết thông báo mới..."
                  onKeyDown={e => e.key === 'Enter' && handlePostAnnouncement()}
                />
                <button
                  className={styles.announcementSendBtn}
                  onClick={handlePostAnnouncement}
                  disabled={postingAnnouncement || !newAnnouncement.trim()}
                >
                  {postingAnnouncement ? '...' : 'Gửi'}
                </button>
              </div>
            )}

            {announcementsLoading ? (
              <div className={styles.loadingWrap}><div className={styles.spinner} /></div>
            ) : announcements.length === 0 ? (
              <p className={styles.emptyState}>Chưa có thông báo nào</p>
            ) : (
              announcements.map(a => (
                <div key={a.id} className={styles.announcementCard}>
                  <p className={styles.announcementContent}>{a.content}</p>
                  <p className={styles.announcementMeta}>
                    {a.authorName} · {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Quiz Sets */}
        {activeTab === 'quizsets' && (
          <div>
            {quizSetsLoading ? (
              <div className={styles.loadingWrap}><div className={styles.spinner} /></div>
            ) : quizSets.length === 0 ? (
              <p className={styles.emptyState}>Chưa có bộ câu hỏi nào</p>
            ) : (
              quizSets.map(qs => (
                <div key={qs.id} className={styles.quizSetRow}>
                  <div>
                    <p className={styles.quizSetName}>{qs.name}</p>
                    <p className={styles.quizSetCount}>{qs.questionCount} câu hỏi</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Leave */}
        <div className={styles.footerActions}>
          <button className={styles.leaveBtn} onClick={handleLeave}>
            Rời nhóm
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className={styles.modal}>
          <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)} />
          <div className={styles.modalContent}>
            <button className={styles.modalClose} onClick={() => setShowEditModal(false)}>✕</button>
            <h3 className={styles.modalTitle}>⚙️ Cài đặt nhóm</h3>
            <form onSubmit={handleEdit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên nhóm</label>
                <input
                  className={styles.formInput}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mô tả</label>
                <textarea
                  className={styles.formTextarea}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className={styles.formCheckbox}>
                <input
                  type="checkbox"
                  id="editPublic"
                  checked={editPublic}
                  onChange={e => setEditPublic(e.target.checked)}
                />
                <label htmlFor="editPublic">Nhóm công khai</label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số thành viên tối đa</label>
                <input
                  className={styles.formInput}
                  type="number"
                  value={editMaxMembers}
                  onChange={e => setEditMaxMembers(Number(e.target.value))}
                  min={2}
                  max={500}
                />
              </div>
              {editError && <p className={styles.formError}>{editError}</p>}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={editLoading || !editName.trim()}
              >
                {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
