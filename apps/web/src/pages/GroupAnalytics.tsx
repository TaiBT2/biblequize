import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/authStore';
import { api } from '../api/client';

interface Analytics {
  totalMembers: number;
  activeToday: number;
  totalQuizzes: number;
  avgScore: number;
}

/* Mock top contributors */
const MOCK_TOP_CONTRIBUTORS = [
  { name: 'Le Minh', xp: 2450, avatar: '' },
  { name: 'Tran An', xp: 1980, avatar: '' },
  { name: 'Pham Hung', xp: 1720, avatar: '' },
  { name: 'Nguyen Thu', xp: 1540, avatar: '' },
  { name: 'Dang Hoa', xp: 1280, avatar: '' },
];

const GroupAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* Mock data for weekly chart */
  const WEEKLY_CHART_DATA = [
    { label: t('groupAnalytics.dayMon'), height: '35%', opacity: 'opacity-60', tooltip: t('groupAnalytics.memberTooltip', { count: 12 }) },
    { label: t('groupAnalytics.dayTue'), height: '55%', opacity: 'opacity-70', tooltip: t('groupAnalytics.memberTooltip', { count: 18 }) },
    { label: t('groupAnalytics.dayWed'), height: '70%', opacity: 'opacity-80', tooltip: t('groupAnalytics.memberTooltip', { count: 23 }) },
    { label: t('groupAnalytics.dayThu'), height: '60%', opacity: 'opacity-75', tooltip: t('groupAnalytics.memberTooltip', { count: 20 }) },
    { label: t('groupAnalytics.dayFri'), height: '85%', opacity: 'opacity-90', tooltip: t('groupAnalytics.memberTooltip', { count: 28 }) },
    { label: t('groupAnalytics.daySat'), height: '45%', opacity: 'opacity-65', tooltip: t('groupAnalytics.memberTooltip', { count: 15 }) },
    { label: t('groupAnalytics.daySun'), height: '100%', opacity: 'opacity-100', tooltip: t('groupAnalytics.memberTooltip', { count: 33 }) },
  ];

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/groups/${id}/analytics`);
      if (res.data.success) {
        setAnalytics(res.data.analytics || res.data);
      } else {
        setError(res.data.message || t('groupAnalytics.errorLoadData'));
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(t('groupAnalytics.noPermission'));
      } else {
        setError(err.response?.data?.message || t('groupAnalytics.connectionError'));
      }
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAnalytics();
  }, [isAuthenticated, navigate, fetchAnalytics]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-20 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-20">
        <div className="bg-surface-container rounded-[2rem] p-12 text-center border border-white/5 shadow-xl">
          <span className="material-symbols-outlined text-5xl text-error mb-4 block">error</span>
          <p className="text-error font-bold mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={fetchAnalytics}
              className="px-6 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:bg-surface-bright transition-all"
            >
              {t('common.retry')}
            </button>
            <button
              onClick={() => navigate(`/groups/${id}`)}
              className="px-6 py-3 bg-secondary/10 text-secondary rounded-xl font-bold text-sm hover:bg-secondary/20 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              {t('groupAnalytics.backToGroup')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: t('groupAnalytics.totalMembers'),
      value: analytics?.totalMembers ?? 0,
      icon: 'groups',
      color: 'secondary',
      bgClass: 'bg-secondary/10 border-secondary/20',
      iconBg: 'bg-secondary/20 text-secondary',
    },
    {
      label: t('groupAnalytics.activeThisWeek'),
      value: analytics?.activeToday ?? 0,
      icon: 'trending_up',
      color: 'primary',
      bgClass: 'bg-primary/10 border-primary/20',
      iconBg: 'bg-primary/20 text-primary',
    },
    {
      label: t('groupAnalytics.totalXP'),
      value: analytics?.totalQuizzes ?? 0,
      icon: 'workspace_premium',
      color: 'tertiary',
      bgClass: 'bg-tertiary/10 border-tertiary/20',
      iconBg: 'bg-tertiary/20 text-tertiary',
    },
    {
      label: t('groupAnalytics.avgScore'),
      value: analytics?.avgScore ?? 0,
      icon: 'analytics',
      color: 'error',
      bgClass: 'bg-error/10 border-error/20',
      iconBg: 'bg-error/20 text-error',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* ── Header ── */}
      <header className="relative bg-surface-container rounded-[2.5rem] p-10 shadow-xl border border-white/5 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-secondary/5 rounded-full blur-[80px]" />
        <div className="relative z-10">
          <button
            onClick={() => navigate(`/groups/${id}`)}
            className="flex items-center gap-1 text-on-surface-variant text-xs font-bold tracking-wider uppercase mb-4 hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            {t('groupAnalytics.backToGroup')}
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-on-secondary text-3xl">analytics</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface">
                {t('groupAnalytics.title')}
              </h1>
              <p className="text-sm text-on-surface-variant font-medium mt-1">
                {t('groupAnalytics.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Overview Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(card => (
          <div
            key={card.label}
            className={`relative rounded-[2rem] p-8 border shadow-xl overflow-hidden transition-transform hover:translate-y-[-4px] ${card.bgClass}`}
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-[30px]" />
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-5`}>
                <span className="material-symbols-outlined text-2xl">{card.icon}</span>
              </div>
              <p className="text-3xl font-black tracking-tight text-on-surface mb-1">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left: Weekly Activity Chart */}
        <section className="lg:col-span-2 bg-surface-container rounded-[2.5rem] p-10 shadow-xl border border-white/5">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-3xl">bar_chart</span>
              {t('groupAnalytics.weeklyActivity')}
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  {t('groupAnalytics.membersLabel')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex h-72 gap-4">
            {/* Y-axis */}
            <div className="flex flex-col justify-between items-end pr-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter h-60">
              <span>35</span>
              <span>25</span>
              <span>15</span>
              <span>5</span>
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
                {WEEKLY_CHART_DATA.map(day => (
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
                {WEEKLY_CHART_DATA.map(day => (
                  <span key={day.label} className="flex-1 text-center text-[11px] font-black text-on-surface-variant">
                    {day.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right: Top Contributors */}
        <aside className="space-y-10">
          <div className="bg-surface-container rounded-[2.5rem] p-8 shadow-xl border border-white/5">
            <h3 className="font-black text-xl mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">emoji_events</span>
              {t('groupAnalytics.topContributors')}
            </h3>
            <div className="space-y-4">
              {MOCK_TOP_CONTRIBUTORS.map((contributor, i) => (
                <div
                  key={contributor.name}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-surface-container-high ${
                    i === 0 ? 'bg-secondary/5 border border-secondary/10' : 'bg-surface-container-low border border-transparent'
                  }`}
                >
                  <span className={`w-6 text-center font-black text-sm ${i < 3 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                    {i + 1}
                  </span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                    i === 0 ? 'bg-secondary/15 text-secondary ring-2 ring-secondary' : 'bg-primary-container text-on-primary-container'
                  }`}>
                    {contributor.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{contributor.name}</p>
                  </div>
                  <span className="text-sm font-black text-secondary">{(contributor.xp ?? 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Engagement Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Daily Active Trend */}
        <div className="relative rounded-[2.5rem] overflow-hidden glass-panel p-10 border border-white/10 shadow-2xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-secondary/10 rounded-full blur-[60px]" />
          <div className="relative z-10">
            <h3 className="font-black text-xl mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">monitoring</span>
              {t('groupAnalytics.activeMembers')}
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant font-bold uppercase tracking-wider">{t('groupAnalytics.today')}</span>
                <span className="text-2xl font-black text-secondary">{analytics?.activeToday ?? 0}</span>
              </div>
              <div className="w-full h-3 bg-primary-container rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full gold-gradient rounded-full shadow-[0_0_10px_rgba(232,168,50,0.3)] transition-all duration-1000"
                  style={{
                    width: `${analytics?.totalMembers ? Math.min(100, Math.round(((analytics?.activeToday ?? 0) / analytics.totalMembers) * 100)) : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                {analytics?.totalMembers
                  ? t('groupAnalytics.activeTodayPercent', { percent: Math.round(((analytics?.activeToday ?? 0) / analytics.totalMembers) * 100) })
                  : t('groupAnalytics.noData')}
              </p>
              {/* Mini trend indicators */}
              <div className="flex gap-3 pt-2">
                {[
                  { key: 'dayMon', i: 0 },
                  { key: 'dayTue', i: 1 },
                  { key: 'dayWed', i: 2 },
                  { key: 'dayThu', i: 3 },
                  { key: 'dayFri', i: 4 },
                  { key: 'daySat', i: 5 },
                  { key: 'daySun', i: 6 },
                ].map(({ key, i }) => {
                  const heights = [30, 50, 65, 55, 80, 40, 100];
                  return (
                    <div key={key} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full h-16 bg-surface-container-low rounded-lg relative overflow-hidden">
                        <div
                          className="absolute bottom-0 w-full gold-gradient rounded-t-sm"
                          style={{ height: `${heights[i]}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-black text-on-surface-variant">{t(`groupAnalytics.${key}`)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Completion Rate */}
        <div className="relative rounded-[2.5rem] overflow-hidden glass-panel p-10 border border-white/10 shadow-2xl">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-[60px]" />
          <div className="relative z-10">
            <h3 className="font-black text-xl mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">task_alt</span>
              {t('groupAnalytics.quizCompletionRate')}
            </h3>
            <div className="space-y-6">
              {/* Big percentage */}
              <div className="flex items-center justify-center">
                <div className="relative w-36 h-36">
                  {/* Background ring */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke="url(#goldGrad)" strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${((analytics?.avgScore ?? 0) / 100) * 314} 314`}
                    />
                    <defs>
                      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f8bd45" />
                        <stop offset="100%" stopColor="#e7c268" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-secondary">{analytics?.avgScore ?? 0}%</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">{t('groupAnalytics.average')}</span>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant font-bold">{t('groupAnalytics.totalQuizzes')}</span>
                  <span className="text-sm font-black text-on-surface">{analytics?.totalQuizzes ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant font-bold">{t('groupAnalytics.highestScore')}</span>
                  <span className="text-sm font-black text-secondary">100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant font-bold">{t('groupAnalytics.lowestScore')}</span>
                  <span className="text-sm font-black text-on-surface-variant">42</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupAnalytics;
