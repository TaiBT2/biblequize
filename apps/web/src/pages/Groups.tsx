import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { api } from '../api/client';

/* ─── Mock data ─── */

const TOP_3_MEMBERS = [
  {
    rank: 2,
    name: 'Trần An',
    points: '12.4k',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCOGPuJ6QyqZrUU3lTmwApQBlCHQQTGx_xpQ9GBnIXZAaabdcawrFJCS3belPf0t48GijiVnBglfZwFaRL4S-_1hCMKFnHUQOYvswHNmNLaKSc9eH_bJbvHjdsH4ElZIPHxXQDnh7oK3DeoEiHjxDzdi51xkD5uY0nnaWBDC5COHUG9FdhyORUaUH94OTBck2986QNwpkr0zZtQyA-5hXq5mhdxnRkVO7R21RB4G1cXED1KjFkakApqv86hk1e4iusjif9hUyI89k',
  },
  {
    rank: 1,
    name: 'Lê Minh',
    points: '15.8k',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmfBAqVNRot5_yZhIENRfm5nazGsfkD6blgQTIh-c9o8KxzXiw4ajNSAxU-yR1CJbcW84J8SyTt9LrNd44jHyMvSkLHggY1cgwdvOfJuneBhHiPhVwrEA2_D9YaWoqS7BGMBKIauYl84jeSSesY81KU3Ehw8wvqFQ2QRV8U4lmkt23o7g_reC1hq0X2crZztWe-o4t0p5cItU8xIASAoUJzKkKmdoAJmgKzetr2WQ571wsjTe8XAHmLF2XEfs3K8K-AiN8Xgwq4so',
  },
  {
    rank: 3,
    name: 'Phạm Hùng',
    points: '10.1k',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBFR9vI4UGCYOyQwvGEzTdNu0CVQPdIn8wJG-n2pn9C_K4fF98t1alD0hq8Cmbc2VaIpxTojALBLBydRtA_rM_i3YgzCPhk-FdPgdKdTn8VyolKmSoWiDejv-3a0rMANKK80UMW5NeFQSAHDhxF9-pY14MbKPmXuEXn_hENBTOlLg2v3Gt2-iCrfNfD2GzTsHrkXmzsbArxqX3Q_Q13sNsl9CwwniR4b3SGY_ZOIxGWas2BNj1yiBFqqw91kJ3qENGqI_kXvPse_o',
  },
];

const LIST_MEMBERS = [
  {
    rank: 4,
    name: 'Nguyễn Thu',
    points: '8,920',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjgfnG_9hhmKnmGEpmAOFYE065UjhPfLygJ6qpo2GQ1yE02ECO-KjRT3HH1CEv9QT41AClGpC8efEfBAtkglMYI-nxdDEBArhO1CXKPvcD_utHmfCRhzPXcctjocqq3eLRUf1Y86xZr5LgrqfWPBOepzM89vfYwxw7oy_l0fFg2wfoiGOEoXszxEiMdpdrWgWll7ugqJy38zoPDP6pkz3z1q3gZTnmEVPjyHi9-NQw4UWghPBKJqB1-9y1pP-AO9oc0oeHoyzZNf8',
  },
  {
    rank: 5,
    name: 'Đặng Hòa',
    points: '7,450',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDA6ElUQqdpf3NG_eGai0wXloEvFB8P2xNH5CyRFqp4IKLWszpD7zLFu6Z7dbWumOshkyhvQTI8vHZp-gJDW2MtEmW-tfw2jn2efZ0lRVoTyen0eqCRJo3_Igec28JQt38_5fu-yf_e_FBwOm5vOMwvYKeNvjFUmPF2Pl6wrk-FxdblJYodUuiIZRhW__-ZqhgmkOrZllk5Gp8tf6YshARzMj9NqV4xwJ553oe5r2xvqeYO4epT4zy2-5OVkDuHivbLJcwB2XJ_3Zk',
  },
  {
    rank: 6,
    name: 'Vũ Nam',
    points: '6,100',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyzwIVK14ENfuPFBKk_kFUbIMoSHCwxiaC1wHqo4l6wLBCo-4CGJ0QNsSKwroL2swtTrrIz3yEu56nzlHQhU6yMLP7pkqgi-OaX5t0WRo4bJRMgjXQbNUZMFinVKnhN6Rz-Q1Y43ZX4GTnbm2uGsGksSp_wIQMY9YPltkm2Bn_HiuAImDQH4cTbeipqFsQilOS1BgBGPqf75mQam1nbw5WETWV3DCIfn1_kLmE_cUFvlkEI0Dks2VdNi9IZb6sj56gsDFTcWBxnVQ',
  },
];

const WEEKLY_CHART_DATA = [
  { label: 'T2', height: '40%', opacity: 'opacity-60', tooltip: '6,000 pts' },
  { label: 'T3', height: '65%', opacity: 'opacity-70', tooltip: '9,750 pts' },
  { label: 'T4', height: '55%', opacity: 'opacity-80', tooltip: '8,250 pts' },
  { label: 'T5', height: '90%', opacity: 'opacity-90', tooltip: '13,500 pts' },
  { label: 'T6', height: '45%', opacity: 'opacity-75', tooltip: '6,750 pts' },
  { label: 'T7', height: '35%', opacity: 'opacity-85', tooltip: '5,250 pts' },
  { label: 'CN', height: '100%', opacity: 'opacity-100', tooltip: '15,000 pts' },
];

const ANNOUNCEMENTS = [
  {
    isNew: true,
    author: 'Quản trị viên',
    time: '2 giờ trước',
    title: 'Cuộc thi Đố Kinh Thánh Tuần 42',
    body: 'Chuẩn bị cho chủ đề "Các vị vua của Israel". Giải thưởng là 5,000 điểm cho người chiến thắng.',
    hasAction: true,
  },
  {
    isNew: false,
    author: 'Thông báo',
    time: '1 ngày trước',
    title: 'Cập nhật hạng hội viên mới',
    body: 'Hệ thống đã cập nhật hạng "Trung Tín" cho các thành viên duy trì học tập 30 ngày.',
    hasAction: false,
  },
];

const GROUP_BANNER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDem08oLVRdZLImin9qKleQczzKL-y5Z9PhH-E7uksJpiCKgXSFcw2eiD-t55orzayS6bQHmVleFKlOpyY2n9KNoUIGdR5WUkogyD4hEdL1RHquAMjIiM9-eHiJK88TA6-88w0JkCpUXtGM9uFsrxtUDBVD0wySDfzhUJG8QJOJnwk_7TMsu6uvZxGlpWw0o6u5KEK1IIOhuoP9jwkWFuzsZ47fPu3DydJ3ZcCpAQNLvWoUPG0pa4mk6LiKPnSDiSDsmZJjLFJYZLY';

const GROUP_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCftvliM4qg1y87Xzx16yOMQYBi0nzCXzy1EbDfW5jXDlWg1iSZubCAxitHgHvJi1kFyeHnq3d_3ET4JnVlY9kRlVyVn8oqKvrcGDP5HM3_L1NjNAFrzUnxi0BfyJ5cvo-H2dfifs2WQFnHmO8hCZcs6bSMYEGIP709xM7HXWLP9eC0TxXVO5Z_Wl2aZ05aNSJ0B1Rgjks4FZJ2Ka6gIqolfxknxO7zxCoY3Uj-yO3Kn8uHcc0Yn2C-TAGdUVF_yW464tHO_QGiPGc';

/* ─── Helper: SavedGroup localStorage ─── */

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
  const groups = getSavedGroups().filter((g) => g.id !== group.id);
  groups.unshift(group);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

/* ─── Component ─── */

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Create form
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join form
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

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
      const res = await api.post('/api/groups/join', {
        code: joinCode.trim().toUpperCase(),
      });
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
    <div className="max-w-6xl mx-auto space-y-12">
      {/* ── Group Hero Header ── */}
      <header className="relative rounded-[2.5rem] overflow-hidden bg-surface-container-lowest h-72 flex flex-col justify-end p-10 group shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img
            alt="Group Banner"
            className="w-full h-full object-cover opacity-30 transition-transform duration-1000 group-hover:scale-110"
            src={GROUP_BANNER}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] gold-gradient p-1 shadow-2xl">
              <div className="w-full h-full rounded-[1.75rem] bg-surface-container flex items-center justify-center overflow-hidden">
                <img
                  alt="Group Logo"
                  className="w-full h-full object-cover"
                  src={GROUP_LOGO}
                />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-on-surface mb-3">
                Nhóm Hội Thánh Tin Lành
              </h1>
              <div className="flex flex-wrap gap-5 text-xs font-black tracking-widest uppercase text-secondary">
                <span className="flex items-center gap-2 bg-surface-container/50 px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[16px]">groups</span> 128 Thành
                  viên
                </span>
                <span className="flex items-center gap-2 bg-surface-container/50 px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[16px]">workspace_premium</span>{' '}
                  452,800 Điểm
                </span>
                <span className="flex items-center gap-2 bg-surface-container/50 px-3 py-1 rounded-full text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">location_on</span> TP. Hồ
                  Chí Minh
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-4 gold-gradient text-on-secondary rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-[0_0_30px_rgba(232,168,50,0.4)] transition-all active:scale-95 shadow-lg">
              Rời Nhóm
            </button>
            <button className="px-8 py-4 bg-surface-container-highest/80 backdrop-blur text-on-surface rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-bright transition-all active:scale-95 border border-white/5">
              Mời Bạn
            </button>
          </div>
        </div>
      </header>

      {/* ── Bento Grid Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Leaderboard + Chart */}
        <section className="lg:col-span-2 space-y-10">
          {/* Member Leaderboard */}
          <div className="bg-surface-container rounded-[2.5rem] p-10 shadow-xl border border-white/5">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-3xl">
                  leaderboard
                </span>
                Bảng Xếp Hạng Thành Viên
              </h2>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant bg-surface-container-high px-4 py-2 rounded-full">
                Tháng 10
              </span>
            </div>

            <div className="space-y-6">
              {/* Top 3 Featured */}
              <div className="grid grid-cols-3 gap-6 mb-12 items-end">
                {/* Rank 2 (left) */}
                <div className="bg-surface-container-low rounded-3xl p-6 flex flex-col items-center text-center border-b-4 border-secondary/10 transition-transform hover:translate-y-[-4px]">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full border-2 border-secondary overflow-hidden shadow-lg">
                      <img alt="Rank 2" src={TOP_3_MEMBERS[0].avatar} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-[10px] font-black text-on-secondary shadow-md">
                      2
                    </div>
                  </div>
                  <p className="text-sm font-black truncate w-full mb-1">{TOP_3_MEMBERS[0].name}</p>
                  <p className="text-xs text-secondary font-black">{TOP_3_MEMBERS[0].points}</p>
                </div>

                {/* Rank 1 (center, elevated) */}
                <div className="bg-surface-container-high rounded-[2rem] p-8 flex flex-col items-center text-center border-b-8 border-secondary shadow-2xl relative z-10 scale-110 transition-transform hover:scale-[1.12]">
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-full border-4 border-secondary overflow-hidden shadow-xl">
                      <img alt="Rank 1" src={TOP_3_MEMBERS[1].avatar} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-black text-on-secondary shadow-lg ring-4 ring-surface-container-high">
                      1
                    </div>
                  </div>
                  <p className="text-base font-black truncate w-full mb-1">{TOP_3_MEMBERS[1].name}</p>
                  <p className="text-xs text-secondary font-black uppercase tracking-widest">
                    {TOP_3_MEMBERS[1].points}
                  </p>
                </div>

                {/* Rank 3 (right) */}
                <div className="bg-surface-container-low rounded-3xl p-6 flex flex-col items-center text-center border-b-4 border-secondary/10 transition-transform hover:translate-y-[-4px]">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full border-2 border-tertiary overflow-hidden shadow-lg">
                      <img alt="Rank 3" src={TOP_3_MEMBERS[2].avatar} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-tertiary rounded-full flex items-center justify-center text-[10px] font-black text-on-tertiary shadow-md">
                      3
                    </div>
                  </div>
                  <p className="text-sm font-black truncate w-full mb-1">{TOP_3_MEMBERS[2].name}</p>
                  <p className="text-xs text-tertiary font-black">{TOP_3_MEMBERS[2].points}</p>
                </div>
              </div>

              {/* List items (rank 4+) */}
              <div className="space-y-4">
                {LIST_MEMBERS.map((member) => (
                  <div
                    key={member.rank}
                    className="flex items-center justify-between p-6 bg-surface-container-low rounded-2xl hover:bg-surface-container-high transition-all border border-transparent hover:border-white/5 cursor-pointer"
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-xs font-black text-on-surface-variant w-4">
                        {member.rank}
                      </span>
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-inner">
                        <img
                          alt={`Member ${member.rank}`}
                          src={member.avatar}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-bold text-base">{member.name}</span>
                    </div>
                    <span className="text-base font-black text-secondary">{member.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Points Chart Mockup */}
          <div className="bg-surface-container rounded-[2.5rem] p-10 shadow-xl border border-white/5">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-3xl">bar_chart</span>
                Biểu đồ điểm tuần
              </h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Nhóm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-on-surface-variant/30" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Trung bình
                  </span>
                </div>
              </div>
            </div>
            <div className="flex h-72 gap-4">
              {/* Y-axis */}
              <div className="flex flex-col justify-between items-end pr-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter h-60">
                <span>15,000</span>
                <span>10,000</span>
                <span>5,000</span>
                <span>2,500</span>
                <span>0</span>
              </div>
              {/* Chart Area */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 relative flex items-end justify-between gap-2 md:gap-6 px-4 border-l border-b border-white/5 h-60">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-white/5 w-full h-0" />
                    <div className="border-t border-white/5 w-full h-0" />
                    <div className="border-t border-white/5 w-full h-0" />
                    <div className="border-t border-white/5 w-full h-0" />
                  </div>
                  {WEEKLY_CHART_DATA.map((day) => (
                    <div key={day.label} className="flex-1 flex flex-col items-center group relative">
                      <div
                        className={`w-full gold-gradient rounded-t-lg shadow-lg ${day.opacity} transition-all group-hover:opacity-100 group-hover:scale-x-105`}
                        style={{ height: day.height }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-[10px] font-bold text-secondary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.tooltip}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* X-axis Labels */}
                <div className="flex items-center justify-between px-4 pt-4 ml-0">
                  {WEEKLY_CHART_DATA.map((day) => (
                    <span key={day.label} className="flex-1 text-center text-[11px] font-black text-on-surface-variant">
                      {day.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Actions + Announcements + Stats */}
        <aside className="space-y-10">
          {/* Group Management */}
          <div className="bg-surface-container rounded-[2.5rem] p-8 border-b-8 border-secondary/10 shadow-xl border border-white/5">
            <h3 className="font-black text-xl mb-6">Quản lý nhóm</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-surface-container-low rounded-3xl hover:bg-surface-container-high transition-all text-secondary border border-white/5"
              >
                <span className="material-symbols-outlined text-4xl">add_circle</span>
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">Tạo Nhóm</span>
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-surface-container-low rounded-3xl hover:bg-surface-container-high transition-all text-tertiary border border-white/5"
              >
                <span className="material-symbols-outlined text-4xl">search</span>
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">Tìm Nhóm</span>
              </button>
            </div>
          </div>

          {/* Announcements Feed */}
          <section className="bg-surface-container rounded-[2.5rem] p-10 overflow-hidden shadow-xl border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight">Thông báo</h2>
              <button className="text-[10px] font-black uppercase tracking-widest text-secondary underline underline-offset-8">
                Xem tất cả
              </button>
            </div>
            <div className="space-y-10">
              {/* Scripture Quote Block */}
              <div className="relative bg-surface-container-low p-6 rounded-3xl border border-white/5">
                <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-secondary rounded-full shadow-[0_0_10px_rgba(232,168,50,0.5)]" />
                <p className="text-sm font-medium italic text-on-surface/90 leading-relaxed mb-4">
                  "Lời Chúa là ngọn đèn cho chân tôi, là ánh sáng cho đường lối tôi."
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary">
                  Thi Thiên 119:105
                </p>
              </div>

              {/* Announcement Items */}
              {ANNOUNCEMENTS.map((item, idx) => (
                <article key={idx} className="space-y-3 group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.isNew ? 'bg-secondary animate-pulse' : 'bg-on-surface-variant/30'
                      }`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      {item.author} &bull; {item.time}
                    </span>
                  </div>
                  <h4 className="font-black text-base group-hover:text-secondary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{item.body}</p>
                  {item.hasAction && (
                    <div className="pt-3">
                      <button className="text-[10px] font-black uppercase tracking-widest text-secondary border-2 border-secondary/20 px-5 py-2.5 rounded-xl hover:bg-secondary/10 transition-all active:scale-95">
                        Tham gia ngay
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          {/* Group Stats Summary Card */}
          <div className="relative rounded-[2.5rem] overflow-hidden glass-panel p-10 border border-white/10 shadow-2xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-secondary/10 rounded-full blur-[60px]" />
            <h3 className="font-black text-xl mb-6">Thống kê hội nhóm</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant font-bold uppercase tracking-wider">
                  Hoạt động tuần này
                </span>
                <span className="text-lg font-black text-secondary">+24%</span>
              </div>
              <div className="w-full h-3 bg-primary-container rounded-full overflow-hidden shadow-inner">
                <div className="h-full gold-gradient w-[75%] rounded-full shadow-[0_0_10px_rgba(232,168,50,0.3)]" />
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                Nhóm chúng ta đang dẫn đầu trong cụm khu vực miền Nam! Tiếp tục cố gắng nhé.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Create Group Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-surface-container rounded-[2rem] p-10 w-full max-w-md mx-4 border border-white/10 shadow-2xl">
            <button
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setShowCreateModal(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">add_circle</span>
              Tạo nhóm mới
            </h3>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">
                  Tên nhóm *
                </label>
                <input
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary/50 transition-colors"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="VD: Hội thánh Tin Lành ABC"
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">
                  Mô tả
                </label>
                <textarea
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary/50 transition-colors resize-none h-24"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Mô tả ngắn về nhóm (tuỳ chọn)"
                  maxLength={500}
                />
              </div>
              {createError && (
                <p className="text-sm text-error font-bold">{createError}</p>
              )}
              <button
                type="submit"
                className="w-full py-4 gold-gradient text-on-secondary rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-[0_4px_25px_rgba(232,168,50,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={createLoading || !createName.trim()}
              >
                {createLoading ? 'Đang tạo...' : 'Tạo nhóm'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Join Group Modal ── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowJoinModal(false)}
          />
          <div className="relative bg-surface-container rounded-[2rem] p-10 w-full max-w-md mx-4 border border-white/10 shadow-2xl">
            <button
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setShowJoinModal(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-tertiary">search</span>
              Tham gia nhóm
            </h3>
            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">
                  Mã mời nhóm
                </label>
                <input
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary/50 transition-colors text-center text-lg tracking-[0.1em]"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="VD: ABC123"
                  maxLength={20}
                  autoFocus
                />
              </div>
              {joinError && (
                <p className="text-sm text-error font-bold">{joinError}</p>
              )}
              <button
                type="submit"
                className="w-full py-4 gold-gradient text-on-secondary rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-[0_4px_25px_rgba(232,168,50,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
