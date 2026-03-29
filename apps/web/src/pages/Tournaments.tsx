import React from 'react';

interface Player {
  name: string;
  avatar: string;
}

interface QuarterMatch {
  id: number;
  player1: Player;
  player2: Player;
  /** Winner index: 1 or 2, or null if not decided */
  winner: 1 | 2 | null;
  /** HP hearts for player1 */
  p1Hearts?: number;
  /** HP text for player1 (e.g. "3 HP") */
  p1HpText?: string;
  /** HP hearts for player2 */
  p2Hearts?: number;
  /** HP text for loser */
  loserHpText?: string;
  /** Whether to highlight the card border with secondary color */
  highlighted?: boolean;
  /** Is this match currently in progress? */
  inProgress?: boolean;
  progressLabel?: string;
  progressRound?: string;
}

interface SemiMatch {
  id: number;
  player1: Player | null;
  player2: Player | null;
  player1Verified?: boolean;
  timeLabel: string;
  pending?: boolean;
}

const quarterMatches: QuarterMatch[] = [
  {
    id: 1,
    player1: { name: 'Minh Triết', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClA5_bue4NstmLbMdvOxno3fWCJAUIKDZcXdkiAchoSgXC5RO3SHKi7vcMe21xA1zs8ovNpoNrYfEvz97C197ZkKA2ZKgasKB4gYofnqsBnZVqCvLv9PBEwYv7gV4ld0UDvP5B2ivzARj-Rv7KWQNll2pK29g_4oqotY3L31JuXSggnDqHjHO3hiHQTwNrmxBQblNR6uk6bekVXLhocUC2W4084rM5HfSW3MjZoymSmSy88lx9Z_1a-kZedsWFoZ-WPJoZSEsF_kE' },
    player2: { name: 'Hồng Nhung', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBauiayRVmh3nKv_AKu_Bebu7Wjj96P89aeycjarwk69L01vB30B3Ekm0TWWQEm8mr-7PvLK5VL_e0hCBylTQ6IhQdTVVb3UH81cZWpgpZY8K1L5SMR4r5u7-Wr56Pm38Yz1IGPeRUwROPoiDPxUZUxINfLqAN5geav15GZg8xGSBTKU9oyE4-AtEGhHZgsK0-_8Oe4oZ6aqnIQwYnwZKyPpc6fozauW-un1TmegHn2K8eKKhnKjXecfhCIpvyIPwziXGzQGi0pTdA' },
    winner: 1,
    highlighted: true,
    p1Hearts: 2,
    loserHpText: '0 HP',
  },
  {
    id: 2,
    player1: { name: 'Gia Bảo', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSXsfneScStdqCE1oW8jgfzAvQ2ytc4-Pl6z0ku8O_HGFEG3NKrztKdipOPEWhDzezvh-1D1umkDu3jw9ZEfZ88zsHodsh60_eTeaM9J0Mk5LFNrO_HuHuERMvVHPhzCE3zw04S7utZP8Gi9X0NAfC7tJop5qfK35o9EeQ3tmO5zNY1Wm2m1YTwgVkgvb7elHZEY7F_O-QTNxv7HGb2zQUHtMWo9K1Hn1zI8xLgIDGpvqZmdtV49EbjpXDt-GrTOl6CvhW28091X8' },
    player2: { name: 'Thu Hà', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2rx7R354CmAXaGCGl0mtc9dY_fj-3TVRTFTP-2OszB2CCeuqwjFp7VFqJksrrhtcH9sbLn__IgBqxftNesEW1sXC2JFVoyxglkglo0Rl-A-LeLfuJCecIyekVLOy52MoJxq4UiGkrU7IdG2UU8BF0maLlzTD6IODnl5Z6hjQnHjfFnglS6qWd1Wj3XNctPJGOxKN1cZz_LOwOshBV_z8gLYBqYtgYqJhHHyizBVzC_i5WgiFsjf6X22UxeudcSk29QcCC8zjOkrU' },
    winner: null,
    p1Hearts: 1,
    p2Hearts: 2,
    inProgress: true,
    progressLabel: 'Đang diễn ra',
    progressRound: 'Round 12/20',
  },
  {
    id: 3,
    player1: { name: 'Văn Hải', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQQLOV1BOWOGaF2-lj6mlS7P4i6mJV1LBwDpEHPRTtWC9rSZwu0szy7-WptkLE7zC48C7C0rsugQk-UXWaFP3nv8MO7YKE-ynwiRSldgfsRiAsdMSbFnhCHJppYAuIWBgkKNNMQUSWSwEjvnYNWp4vS_ZrSR46E57MshguwzWpPKYHm2RC-YkBLXhIdnpmVs4tpAZsgoVIqml-Hurbpl9V5IYjvblDWy8thTXSTKbGMOrDAx-SVvqjY_vLJBVIOcpd1qBDOyh8qhA' },
    player2: { name: 'Thanh Tâm', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIG8KF3IQBVUBQYSaiaBZNOz3chH9aBFKqUupXgQ-wSlnkLw7LCy94i8aP8Up0l58B6GTdpPIcg6qFfjM9C23OqjXEiaDve0P8qQqCY5a9LQwkLPXgYNyvEh__1jnxmBzfEiReKCOAQ1I-tpUpJFR-Q1dzvRM4PnLDB5jRsplx5euMz020ipifgVUtbcvcovhJLMfX1D1waTsLrKbNUxlKlVRzWO1aI0zEgMJtyeZfArQS2R4fZqaNzBr_ulhyjz1baxomflw8f-4' },
    winner: 1,
    p1HpText: '3 HP',
    loserHpText: '0 HP',
  },
  {
    id: 4,
    player1: { name: 'Đức Phúc', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2mlEC1IUV4KbFO5peKF1wf93AVr1Fx3zkbK7hibm-7k64AoCHZuRrH_X2RhxHRabn22s7UWAZQ8wHNPTgoMMQU_1NodTs6gFwBwXm8cB71DiIe-NX81w6ENN3UQm64BwGzz5u3Wnmp8oIDqjY5jLg0gE_nFHols1EP6yaQJYccI1uSkK2KZI2za-dcwj1lCyVIR-MIC3N_OdZASnvVUEh4wdfd0t4EsmSh9ie2fOjWwHL4i9MmEXNz7mXqzfauNZbYkxn-m_a24M' },
    player2: { name: 'Ngọc Ánh', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpkf4y5_bcD_k8pXc0s75YOMxNuHmqtM5rCfAtJYAIcXfLIWibOk_XWJpxt95g7YOx4M7NF_SzcIz279E5PRR8yQYmdhmsVN67CGJAlFY9aoEAfgzS4WRcvSEXiKTLpuPV5Qj9iygbBndDNLn61QXsOToV7UKtlm10RFmpxVwUqLBrtb39r73VEkiiutYc02GUMbNt9wrH6QKgmogxBZdVyiJIUN1eoAi7ifAIspiG6yuZZOajH902BywLvVnSjvgPWpr0XmuLaKE' },
    winner: 1,
    p1HpText: '1 HP',
    loserHpText: '0 HP',
  },
];

const semiMatches: SemiMatch[] = [
  {
    id: 1,
    player1: { name: 'Minh Triết', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAScjCjWaErTEHC2fTuplB_xivworbNUFO3QatXMKPearJzZVi5BXMxTXa91CyN7AKJM7uqOdGhDZypg2C-Lv4G75UBJvUudYL8wILW1AEYxUPwjNfYt2wj5XnX9rEdOErW6qyrK2261O-8VwWL5I6mnbZlRzVbxUgUodWO4ouMDUbD0A_xCdOQjmxse58IOYuV1knrxGhC4AMo97-bBUcE-Z4WC0d7jw18PaFs69XOhZEBsWqu3m5hZw3rWQ9VvGjLFcbv3thcanc' },
    player2: null,
    player1Verified: true,
    timeLabel: 'Sắp bắt đầu - 14:00',
    pending: true,
  },
  {
    id: 2,
    player1: { name: 'Văn Hải', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlD68YLI2lpCZd-dgdO3yC_8pcnyzip62WMHZzNUuMVZ3CsXNQnMMOsy_DoOz7S1XmOVxgIOhRvFuK1EOGOeUyWYaDAwgdzGtDVZ6-msztF-Kgp3r35KHLvRuD8ipRz7IdDH6hUm9xASAmh1lO0pl_5vHFsrd8nE65qkfDoj80W02zx8OEg162y6qdwijBB5pg_UKIYEi8y8rqQa18ipuEVlqQKs63gN0HxMjIJpeg7zI1aKAQbUCYGSRTbH1N8Jfk2akSPRVZlLE' },
    player2: { name: 'Đức Phúc', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoztwj4e-Xa_cG7_0c617W31soNCBGkrkqVsqrN3hBk-1QfVzj6E6ItW5PxOBJJSeC2Eiy7RYCd-a1woXe1Iil0xhd4K5PgF85iy2nGOXbuyjZMp7VqXYl8PKH38-wdpDedY3FVQv0OErd29lqq8HMOIqjdhy5DmrhECqcaTQ7oC2Z7qt9DAF-cXBP7ePPgAtIgPOf8Dem7CODTzlwX-xdwynIcUc5KX5QZd1OT_qmRgrqn2QxV83s6FdYZo5BRrsOl_tQrtw5zss' },
    timeLabel: 'Sắp bắt đầu - 15:30',
    pending: false,
  },
];


function HeartIcons({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="material-symbols-outlined text-xs text-secondary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          favorite
        </span>
      ))}
    </div>
  );
}

function QuarterMatchCard({ match }: { match: QuarterMatch }) {
  if (match.inProgress) {
    return (
      <div className="relative">
        <div className="bg-surface-container-highest rounded-xl p-4 border-l-4 border-secondary ring-2 ring-secondary/40 shadow-[0_0_15px_rgba(232,168,50,0.2)] animate-pulse">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-bold text-secondary uppercase tracking-tighter">
              {match.progressLabel}
            </span>
            <span className="text-[9px] text-on-surface-variant">{match.progressRound}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <img className="w-8 h-8 rounded-full" src={match.player1.avatar} alt={match.player1.name} />
              <span className="text-sm font-bold">{match.player1.name}</span>
            </div>
            {match.p1Hearts && <HeartIcons count={match.p1Hearts} />}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img className="w-8 h-8 rounded-full" src={match.player2.avatar} alt={match.player2.name} />
              <span className="text-sm font-bold">{match.player2.name}</span>
            </div>
            {match.p2Hearts && <HeartIcons count={match.p2Hearts} />}
          </div>
        </div>
        <div className="absolute -right-10 top-1/2 w-10 bracket-line-h"></div>
      </div>
    );
  }

  const isP1Winner = match.winner === 1;
  const borderClass = match.highlighted ? 'border-secondary/50' : 'border-outline-variant/30';

  return (
    <div className="relative">
      <div className={`bg-surface-container-low rounded-xl p-4 border-l-4 ${borderClass}${match.highlighted ? ' shadow-lg' : ''}`}>
        {/* Player 1 */}
        <div className={`flex justify-between items-center mb-3 ${!isP1Winner && match.winner ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2">
            <img className="w-8 h-8 rounded-full" src={match.player1.avatar} alt={match.player1.name} />
            <span className={`text-sm ${isP1Winner ? 'font-bold' : ''}`}>{match.player1.name}</span>
          </div>
          {isP1Winner && match.p1Hearts ? (
            <HeartIcons count={match.p1Hearts} />
          ) : isP1Winner && match.p1HpText ? (
            <span className="text-xs font-bold text-secondary">{match.p1HpText}</span>
          ) : !isP1Winner && match.winner ? (
            <span className="text-xs font-bold">{match.loserHpText}</span>
          ) : match.p1Hearts ? (
            <span className="text-xs font-bold text-secondary">{match.p1Hearts} HP</span>
          ) : null}
        </div>
        {/* Player 2 */}
        <div className={`flex justify-between items-center ${match.winner === 2 ? '' : match.winner ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2">
            <img className="w-8 h-8 rounded-full" src={match.player2.avatar} alt={match.player2.name} />
            <span className={`text-sm ${match.winner === 2 ? 'font-bold' : ''}`}>{match.player2.name}</span>
          </div>
          {match.winner === 2 && match.p2Hearts ? (
            <HeartIcons count={match.p2Hearts} />
          ) : match.winner === 1 ? (
            <span className="text-xs font-bold">{match.loserHpText}</span>
          ) : match.p2Hearts ? (
            <span className="text-xs font-bold text-secondary">{match.p2Hearts} HP</span>
          ) : null}
        </div>
      </div>
      <div className="absolute -right-10 top-1/2 w-10 bracket-line-h"></div>
    </div>
  );
}

function SemiMatchCard({ match }: { match: SemiMatch }) {
  const borderClass = match.pending ? 'border-secondary' : 'border-outline-variant/30';
  const timeLabelClass = match.pending ? 'text-secondary' : 'text-on-surface-variant';
  const cardExtras = match.pending ? ' shadow-2xl ring-1 ring-white/5' : '';

  return (
    <div className="relative">
      <div className={`bg-surface-container rounded-xl p-5 border-l-4 ${borderClass}${cardExtras}`}>
        <div className={`text-[10px] uppercase font-bold ${timeLabelClass} mb-3 tracking-widest`}>
          {match.timeLabel}
        </div>
        <div className="space-y-4">
          {/* Player 1 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {match.player1 ? (
                <>
                  <img
                    className={`w-10 h-10 rounded-full ${match.player1Verified ? 'border-2 border-secondary' : ''}`}
                    src={match.player1.avatar}
                    alt={match.player1.name}
                  />
                  <span className="font-bold">{match.player1.name}</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">question_mark</span>
                  </div>
                  <span className="italic">Đang chờ...</span>
                </>
              )}
            </div>
            {match.player1Verified && (
              <span className="material-symbols-outlined text-secondary">verified</span>
            )}
          </div>
          {/* Player 2 */}
          <div className={`flex justify-between items-center ${!match.player2 ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-3">
              {match.player2 ? (
                <>
                  <img className="w-10 h-10 rounded-full" src={match.player2.avatar} alt={match.player2.name} />
                  <span className="font-bold">{match.player2.name}</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">question_mark</span>
                  </div>
                  <span className="italic">Đang chờ...</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-10 top-1/2 w-10 bracket-line-h"></div>
    </div>
  );
}

const Tournaments: React.FC = () => {
  return (
    <>
      {/* Tournament Header Section */}
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-secondary font-bold tracking-[0.2em] uppercase text-xs mb-2 block">
              Sự Kiện Đặc Biệt
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-4">
              Giải Đấu Ngôi Lời 2024
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Tham gia cùng hàng ngàn tín hữu trong cuộc đua tri thức Kinh Thánh đỉnh cao. Chỉ một người chiến thắng duy nhất sẽ nhận được Vương Miện Danh Dự.
            </p>
          </div>
          <div className="bg-surface-container p-4 rounded-xl flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">128</div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">Thí sinh</div>
            </div>
            <div className="w-px h-10 bg-outline-variant/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">$5,000</div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">Giải thưởng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile swipe hint */}
      <div className="mb-4 flex items-center gap-2 text-on-surface-variant md:hidden">
        <span className="material-symbols-outlined text-sm animate-pulse">swipe_left</span>
        <span className="text-xs font-bold uppercase tracking-wider italic">Vuốt để xem bracket →</span>
      </div>

      {/* Tournament Bracket Container */}
      <div className="relative group">
        {/* Scroll Indicators (Mobile) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none md:hidden">
          <div className="bg-background/80 backdrop-blur-sm p-2 rounded-r-xl border-y border-r border-outline-variant/20 shadow-lg text-secondary">
            <span className="material-symbols-outlined">chevron_left</span>
          </div>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none md:hidden">
          <div className="bg-background/80 backdrop-blur-sm p-2 rounded-l-xl border-y border-l border-outline-variant/20 shadow-lg text-secondary">
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </div>

        <div className="relative overflow-x-auto pb-12 snap-x scroll-smooth">
          <div className="inline-flex gap-20 min-w-max p-4 pt-0">
            {/* Round of 8 - Quarter Finals */}
            <div className="flex flex-col justify-around gap-16 w-64 snap-start">
              <div className="sticky top-0 z-10 bg-background py-4">
                <h3 className="text-center text-on-surface-variant font-bold uppercase tracking-widest text-xs">
                  Tứ Kết
                </h3>
              </div>
              {quarterMatches.map((match) => (
                <QuarterMatchCard key={match.id} match={match} />
              ))}
            </div>

            {/* Vertical Connector 1 */}
            <div className="flex flex-col justify-around">
              <div className="h-[25%] flex items-center">
                <div className="h-1/2 w-10 border-t-2 border-r-2 border-outline-variant/20 rounded-tr-xl"></div>
              </div>
              <div className="h-[25%] flex items-center">
                <div className="h-1/2 w-10 border-b-2 border-r-2 border-outline-variant/20 rounded-br-xl"></div>
              </div>
              <div className="h-[25%] flex items-center">
                <div className="h-1/2 w-10 border-t-2 border-r-2 border-outline-variant/20 rounded-tr-xl"></div>
              </div>
              <div className="h-[25%] flex items-center">
                <div className="h-1/2 w-10 border-b-2 border-r-2 border-outline-variant/20 rounded-br-xl"></div>
              </div>
            </div>

            {/* Semi-Finals */}
            <div className="flex flex-col justify-around gap-16 w-64 snap-start">
              <div className="sticky top-0 z-10 bg-background py-4">
                <h3 className="text-center text-on-surface-variant font-bold uppercase tracking-widest text-xs">
                  Bán Kết
                </h3>
              </div>
              {semiMatches.map((match) => (
                <SemiMatchCard key={match.id} match={match} />
              ))}
            </div>

            {/* Vertical Connector 2 */}
            <div className="flex flex-col justify-around">
              <div className="h-1/2 flex items-center">
                <div className="h-1/2 w-10 border-t-2 border-r-2 border-outline-variant/20 rounded-tr-xl"></div>
              </div>
              <div className="h-1/2 flex items-center">
                <div className="h-1/2 w-10 border-b-2 border-r-2 border-outline-variant/20 rounded-br-xl"></div>
              </div>
            </div>

            {/* Finals */}
            <div className="flex flex-col justify-center w-80 snap-end">
              <div className="sticky top-0 z-10 bg-background py-4">
                <h3 className="text-center text-secondary font-black uppercase tracking-[0.3em] text-sm">
                  Chung Kết
                </h3>
              </div>
              <div className="relative group mt-8">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-tertiary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-surface-container-highest rounded-2xl p-8 border border-secondary/30 text-center">
                  <div className="mb-6">
                    <span
                      className="material-symbols-outlined text-5xl text-secondary mb-2"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      workspace_premium
                    </span>
                    <div className="text-xl font-black tracking-tight text-on-surface">TRẬN ĐẤU SINH TỬ</div>
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="h-12 w-full bg-surface-container rounded-lg border border-outline-variant/10 flex items-center justify-center italic text-on-surface-variant text-sm">
                      Thắng Bán Kết 1
                    </div>
                    <div className="text-secondary font-black text-2xl">VS</div>
                    <div className="h-12 w-full bg-surface-container rounded-lg border border-outline-variant/10 flex items-center justify-center italic text-on-surface-variant text-sm">
                      Thắng Bán Kết 2
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-outline-variant/20">
                    <button className="w-full bg-gradient-to-r from-secondary to-tertiary text-on-secondary py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(232,168,50,0.3)] hover:scale-105 transition-transform">
                      Nhắc nhở tôi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Info Grid */}
      <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rules */}
        <div className="md:col-span-2 bg-surface-container p-8 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-2xl font-bold mb-4">Thể lệ thi đấu</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary">timer</span>
                </div>
                <div>
                  <div className="font-bold">15 giây/câu</div>
                  <p className="text-sm text-on-surface-variant">
                    Thời gian suy nghĩ tối đa cho mỗi câu hỏi trắc nghiệm.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary">favorite</span>
                </div>
                <div>
                  <div className="font-bold">3 Mạng</div>
                  <p className="text-sm text-on-surface-variant">
                    Sai 3 câu sẽ bị loại trực tiếp khỏi giải đấu.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 bg-background/50 rounded-xl border border-outline-variant/10 flex items-center gap-4">
            <span className="material-symbols-outlined text-secondary">info</span>
            <p className="text-xs text-on-surface-variant">
              Giải đấu được giám sát bởi Hội Đồng Ngôn Sứ để đảm bảo tính công bằng và minh bạch.
            </p>
          </div>
        </div>

        {/* Prizes */}
        <div className="bg-gradient-to-br from-surface-container to-primary-container p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <span
              className="material-symbols-outlined text-[200px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>
          <h4 className="text-2xl font-bold mb-4 relative z-10">Phần Thưởng</h4>
          <ul className="space-y-4 relative z-10">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-medium text-secondary">Hạng 1: Vương Miện Vàng & $3,000</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
              <span>Hạng 2: Khiên Bạc & $1,500</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
              <span>Hạng 3: Chén Đồng & $500</span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
};

export default Tournaments;
