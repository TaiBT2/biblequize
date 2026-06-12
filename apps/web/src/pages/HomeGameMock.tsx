/**
 * PREVIEW-ONLY coded mockup of the "Game vibe" Home redesign (v2).
 * Route: /home-game-preview. Self-contained, static data, CSS scoped under
 * `.hgm` so nothing leaks into the real app or its design tokens. This is the
 * live prototype to approve before promoting the look into Home + tokens.
 * Spec: docs/designs/home-game/home-game-mock-v2.html
 */
export default function HomeGameMock() {
  return (
    <div className="hgm">
      <style>{CSS}</style>
      <div className="hgm-fx"><div className="blob b1" /><div className="blob b2" /><div className="blob b3" /></div>
      <div className="wrap">
        <aside className="side">
          <div className="brand"><span className="logo ms">sports_esports</span> <span className="head">Bible<b>Quiz</b></span></div>
          <nav className="nav">
            <a className="on"><span className="ms">home</span> Trang chủ</a>
            <a><span className="ms">leaderboard</span> Xếp hạng</a>
            <a><span className="ms">groups</span> Nhóm</a>
            <a><span className="ms">stadia_controller</span> Phòng Chơi</a>
            <a><span className="ms">person</span> Cá nhân</a>
          </nav>
          <div className="scard"><div className="k">Hạng tuần của bạn</div><div className="v">#1<span style={{ fontSize: 13, color: 'var(--dim)', fontWeight: 600 }}> / 1.204</span></div><small>Cập nhật hôm nay</small></div>
          <div className="scard"><div className="k">Mùa hiện tại</div><div className="v">⚡ Ngũ Tuần ’26</div><small>Còn 17 ngày</small></div>
          <div className="scard mini">
            <div className="k" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="ms" style={{ fontSize: 15, color: 'var(--gold2)' }}>leaderboard</span> Top điểm tuần</div>
            <div className="lbrow"><span className="rk rk1">1</span><span className="lbav">T</span><span className="lbn">Tai Thanh <b className="you">Bạn</b></span><span className="lbp">8.940</span></div>
            <div className="lbrow"><span className="rk rk2">2</span><span className="lbav" style={{ background: 'linear-gradient(135deg,#21d4ff,#1e7be0)' }}>M</span><span className="lbn">Minh Anh</span><span className="lbp">8.120</span></div>
            <div className="lbrow"><span className="rk rk3">3</span><span className="lbav" style={{ background: 'linear-gradient(135deg,#36e2a0,#1f9e72)' }}>K</span><span className="lbn">Khôi Nguyên</span><span className="lbp">7.430</span></div>
            <a className="lbmore">Xem bảng đầy đủ →</a>
          </div>
          <a className="backlink" href="/">← Về Home thật</a>
        </aside>
        <main className="main">
          <section className="card hero">
            <div className="av"><div className="ring">T</div><div className="lv">LV. 12</div></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="greet">✦ Chào buổi tối</div>
              <div className="name">Tai Thanh</div>
              <div className="tierline">
                <span className="chip">Người Tìm Kiếm <span style={{ opacity: .6 }}>→</span> Môn Đồ</span>
                <div className="xpbar"><div className="gloss" /><div className="xpfill" /></div>
                <span className="xpnum">1.590<span style={{ color: 'var(--dim)' }}> / 5.000 XP</span></span>
              </div>
            </div>
            <div className="pods">
              <div className="pod"><span className="pic ms" style={{ '--a': '#ff8a3d' } as React.CSSProperties}>local_fire_department</span><div className="n">1</div><div className="l">Streak</div></div>
              <div className="pod"><span className="pic ms" style={{ '--a': '#21d4ff' } as React.CSSProperties}>bolt</span><div className="n">100</div><div className="l">Năng lượng</div></div>
              <div className="pod"><span className="pic ms" style={{ '--a': '#ffd76a' } as React.CSSProperties}>military_tech</span><div className="n">1.298</div><div className="l">Điểm mùa</div></div>
            </div>
          </section>

          <div className="sec"><span className="b" />🗓️ Thử thách hôm nay · 12/6</div>
          <section className="quest card lift">
            <div style={{ flex: 1, minWidth: 260 }}>
              <span className="qtag"><span className="ms" style={{ fontSize: 14 }}>bolt</span> ƯU TIÊN HÔM NAY</span>
              <div className="head" style={{ fontWeight: 700, fontSize: 25, marginTop: 10 }}>Bắt đầu ngày mới với <span style={{ color: 'var(--gold2)' }}>Lời Chúa</span></div>
              <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
                <span className="pill">📖 5 câu</span><span className="pill">⏱️ ~3 phút</span><span className="pill" style={{ color: 'var(--cyan)' }}>🌍 Cùng cộng đồng</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--dim)' }}>Còn lại trong ngày · <b className="head" style={{ color: 'var(--ink)' }}>12:49:19</b></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="reward" style={{ marginBottom: 12 }}>🎁 +50 XP</div>
              <span className="cta">Chơi ngay <span className="ms">bolt</span></span>
            </div>
          </section>

          <div className="sec"><span className="b" />🎯 Nhiệm vụ hôm nay <span className="tag" style={{ marginLeft: 'auto' }}>0/3</span></div>
          <section className="card lift" style={{ padding: '8px 22px' }}>
            <div className="miss"><span className="dot">🎮</span>Chơi bất kỳ chế độ nào<div className="barmini"><i style={{ width: 0, background: 'linear-gradient(90deg,var(--cyan),var(--violet))' }} /></div><span className="tag">0/1</span></div>
            <div className="miss"><span className="dot">🔥</span>Trả lời đúng 5 câu khó<div className="barmini"><i style={{ width: '20%', background: 'linear-gradient(90deg,var(--orange),var(--pink))' }} /></div><span className="tag">1/5</span></div>
            <div className="miss" style={{ border: 0 }}><span className="dot">🏆</span>Đạt 60+ điểm trong Ranked<div className="barmini"><i style={{ width: 0, background: 'linear-gradient(90deg,var(--green),var(--cyan))' }} /></div><span className="tag">0/1</span></div>
          </section>

          <div className="sec"><span className="b" />🎲 Chế độ chơi chính</div>
          <section className="modes">
            <div className="mode m-prac lift"><div className="shine" />
              <div className="mhead"><div className="ic ms">menu_book</div><h3>Luyện Tập</h3><p>Tự do · không tính XP · luyện theo từng sách</p></div>
              <div className="mfoot">
                <div className="mprev">
                  <div className="prow"><span className="ms" style={{ fontSize: 17 }}>auto_stories</span> Đang học dở · <b>Sáng Thế Ký</b></div>
                  <div className="pbar"><i style={{ width: '46%' }} /></div>
                  <div className="psub">23/50 câu · còn 27 để hoàn thành sách</div>
                </div>
                <span className="go">Tiếp tục <span className="ms">arrow_forward</span></span>
              </div>
            </div>
            <div className="mode m-rank lift"><div className="shine" style={{ animationDelay: '-2s' }} />
              <div className="mhead"><div className="ic ms">emoji_events</div><h3>Đấu Hạng</h3><p>Cạnh tranh bảng xếp hạng theo mùa</p></div>
              <div className="mfoot">
                <div className="mprev">
                  <div className="prow"><span className="livedot" /> <b>142</b> người đang thi đấu</div>
                  <div className="avline">
                    <span className="av-s">A</span><span className="av-s">M</span><span className="av-s">K</span><span className="av-s more">+9</span>
                    <span className="myrank">Hạng của bạn <b>#1</b></span>
                  </div>
                </div>
                <span className="go">Vào trận <span className="ms">arrow_forward</span></span>
              </div>
            </div>
            <div className="mode m-multi lift"><div className="shine" style={{ animationDelay: '-1s' }} />
              <div className="mhead"><div className="ic ms">stadia_controller</div><h3>Phòng Chơi</h3><p>Chơi cùng bạn bè & hội thánh · 5 chế độ</p></div>
              <div className="mfoot">
                <div className="mprev">
                  <div className="prow"><span className="livedot" /> <b>8</b> phòng đang mở</div>
                  <div className="avline">
                    <span className="av-s">S</span><span className="av-s">B</span><span className="av-s">H</span><span className="av-s more">+42</span>
                    <span className="myrank">đang chơi</span>
                  </div>
                </div>
                <span className="go">Vào phòng <span className="ms">arrow_forward</span></span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&display=swap');
.hgm{--bg:#0a0b16;--surface:#1b1f36;--surface2:#232845;--gold:#ffb52e;--gold2:#ffd76a;--violet:#8b5cff;--violet2:#c3b0ff;--cyan:#21d4ff;--pink:#ff5ca8;--green:#36e2a0;--orange:#ff8a3d;--ink:#f6f5fe;--dim:#c2c2e0;
  position:fixed;inset:0;overflow-y:auto;background:var(--bg);color:var(--ink);font-family:'Lexend','Be Vietnam Pro',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.hgm .head{font-family:'Lexend','Be Vietnam Pro',sans-serif}
.hgm .ms{font-family:'Material Symbols Outlined';font-feature-settings:'liga';vertical-align:middle}
.hgm .hgm-fx{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.hgm .blob{position:absolute;border-radius:50%;filter:blur(110px);opacity:.22;animation:hgmfloat 13s ease-in-out infinite}
.hgm .b1{width:520px;height:520px;background:radial-gradient(circle,#8b5cff77,transparent 70%);top:-150px;left:280px}
.hgm .b2{width:440px;height:440px;background:radial-gradient(circle,#ff5ca855,transparent 70%);bottom:-140px;right:-60px;animation-delay:-4s}
.hgm .b3{width:380px;height:380px;background:radial-gradient(circle,#21d4ff44,transparent 70%);top:42%;left:-120px;animation-delay:-8s}
@keyframes hgmfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-30px)}}
.hgm .wrap{position:relative;z-index:1;display:grid;grid-template-columns:258px 1fr;max-width:1500px;margin:0 auto}
.hgm .side{padding:22px 16px;border-right:1px solid #ffffff12}
.hgm .brand{display:flex;align-items:center;gap:10px;font-size:23px;margin-bottom:28px}
.hgm .brand .logo{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,var(--violet),var(--pink));color:#fff;box-shadow:0 8px 22px #8b5cff66}
.hgm .brand b{font-family:'Lexend';font-weight:700;background:linear-gradient(90deg,var(--gold2),var(--violet2),var(--cyan));-webkit-background-clip:text;background-clip:text;color:transparent}
.hgm .nav a{display:flex;align-items:center;gap:13px;padding:13px 14px;border-radius:16px;color:var(--dim);font-weight:700;text-decoration:none;margin-bottom:5px;transition:.18s;cursor:pointer}
.hgm .nav a:hover{color:var(--ink);background:#ffffff0d;transform:translateX(3px)}
.hgm .nav a.on{color:#fff;background:linear-gradient(135deg,var(--violet),#5b3cff);box-shadow:0 10px 26px #8b5cff55}
.hgm .scard{margin-top:16px;padding:15px;border-radius:18px;background:linear-gradient(135deg,#1c2040,#171a2e);border:1px solid #ffffff10}
.hgm .scard .k{font-size:10px;letter-spacing:.1em;color:var(--violet2);font-weight:800;text-transform:uppercase}
.hgm .scard .v{font-family:'Lexend';font-weight:700;font-size:18px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hgm .scard small{color:var(--dim);font-size:12px}
.hgm .mini{margin-top:14px}
.hgm .mini .lbrow{display:flex;align-items:center;gap:9px;padding:9px 2px;border-bottom:1px solid rgba(255,255,255,.06)}
.hgm .mini .lbrow:last-of-type{border:0}
.hgm .rk{width:18px;height:18px;border-radius:6px;display:grid;place-items:center;font-size:11px;font-weight:800;font-family:'Lexend';flex:none;color:#241700}
.hgm .rk1{background:linear-gradient(135deg,#ffd76a,#ffb52e)}.hgm .rk2{background:linear-gradient(135deg,#dfe6f5,#aab6cf)}.hgm .rk3{background:linear-gradient(135deg,#f0b483,#cd7f45)}
.hgm .lbav{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;font-size:11px;font-weight:700;color:#fff;background:linear-gradient(135deg,#8b5cff,#5b2be0);flex:none}
.hgm .lbn{flex:1;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hgm .lbn .you{font-size:9px;color:#241700;background:var(--gold2);padding:1px 5px;border-radius:6px;font-weight:800;margin-left:4px}
.hgm .lbp{font-family:'Lexend';font-weight:700;font-size:12px;color:var(--gold2)}
.hgm .lbmore{display:block;margin-top:10px;font-size:11.5px;color:var(--violet2);font-weight:700;cursor:pointer}
.hgm .backlink{display:inline-block;margin-top:18px;color:var(--violet2);font-size:12px;text-decoration:none;font-weight:700}
.hgm .main{padding:24px 32px 60px}
.hgm .card{position:relative;border-radius:22px;border:1px solid rgba(255,255,255,.1);
  background:linear-gradient(180deg,#222540,#181b2e);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 1px 1px rgba(0,0,0,.3),0 10px 24px -8px rgba(0,0,0,.55);
  transition:transform .18s,box-shadow .18s,border-color .18s}
.hgm .card::after{content:'';position:absolute;inset:0;border-radius:22px;padding:1px;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.16),transparent 40%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.7}
.hgm .lift{cursor:pointer}.hgm .lift:hover{transform:translateY(-4px);border-color:rgba(255,255,255,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 18px 40px -10px rgba(0,0,0,.65)}
.hgm .hero{position:relative;padding:24px 28px;overflow:hidden;border:1px solid rgba(139,92,255,.35);display:flex;align-items:center;gap:24px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 8px 30px rgba(91,60,255,.18);
  background:radial-gradient(120% 140% at 6% -20%,#6a4bffaa,transparent 38%),linear-gradient(135deg,#222652,#15172b)}
.hgm .av{position:relative;flex:none}
.hgm .av .ring{width:84px;height:84px;border-radius:22px;display:grid;place-items:center;font-family:'Lexend';font-weight:700;font-size:34px;color:#fff;
  background:linear-gradient(135deg,var(--cyan),var(--violet),var(--pink));box-shadow:inset 0 2px 6px rgba(255,255,255,.3),0 0 0 2px rgba(255,255,255,.18),0 10px 22px rgba(139,92,255,.45);animation:hgmbob 3.4s ease-in-out infinite}
@keyframes hgmbob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-6px) rotate(1deg)}}
.hgm .lv{position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--gold2),var(--gold));color:#241700;font-family:'Lexend';font-weight:800;font-size:12px;letter-spacing:.02em;padding:3px 11px;border-radius:99px;box-shadow:0 5px 14px #ffb52e77;white-space:nowrap;border:1.5px solid #15172b}
.hgm .greet{font-size:11px;letter-spacing:.22em;color:var(--cyan);font-weight:800;text-transform:uppercase}
.hgm .name{font-family:'Lexend';font-weight:700;font-size:32px;line-height:1.04}
.hgm .tierline{display:flex;align-items:center;gap:12px;margin-top:9px}
.hgm .chip{font-weight:800;font-size:13px;color:var(--violet2)}
/* DARK track + BRIGHT fill = reads in <1s (same principle as the mission
   bars). Earlier the track was light, so a light-violet fill blended into it. */
.hgm .xpbar{flex:1;height:13px;border-radius:99px;background:#2a2a3e;overflow:hidden;max-width:360px;border:1px solid rgba(0,0,0,.4);box-shadow:inset 0 1px 2px rgba(0,0,0,.4);position:relative}
.hgm .xpfill{position:relative;height:100%;width:32%;border-radius:99px;background:linear-gradient(90deg,#7c5cff,#a78bfa);box-shadow:0 0 12px rgba(167,139,250,.85);animation:hgmgrow 1.5s cubic-bezier(.2,.9,.2,1)}
.hgm .xpfill::after{content:'';position:absolute;top:0;right:0;width:7px;height:100%;border-radius:99px;background:#fff;box-shadow:0 0 8px #fff;opacity:.95}
.hgm .xpbar .gloss{display:none}
@keyframes hgmgrow{from{width:0}}
.hgm .xpnum{font-family:'Lexend';font-weight:700;font-size:15px}
/* Unified stat pods: identical container, differ only by icon + accent (--a) */
.hgm .pods{display:flex;gap:10px}
.hgm .pod{text-align:center;border-radius:16px;padding:12px 14px 11px;min-width:92px;border:1px solid rgba(255,255,255,.12);background:var(--surface2);box-shadow:inset 0 1px 0 rgba(255,255,255,.07)}
.hgm .pod .pic{font-size:20px;color:var(--a);display:grid;place-items:center;width:34px;height:34px;margin:0 auto 7px;border-radius:11px;background:color-mix(in srgb,var(--a) 16%,transparent);font-variation-settings:'FILL' 1}
.hgm .pod .n{font-family:'Lexend';font-weight:700;font-size:23px;line-height:1;color:var(--ink)}
.hgm .pod .l{font-size:9.5px;letter-spacing:.08em;color:var(--dim);text-transform:uppercase;font-weight:700;margin-top:5px}
.hgm .sec{font-family:'Lexend';font-weight:700;font-size:16px;margin:26px 4px 12px;display:flex;align-items:center;gap:9px}
.hgm .sec .b{width:8px;height:18px;border-radius:5px;background:linear-gradient(var(--cyan),var(--violet))}
/* Daily = the primary 'do this now' hook. Give it a WARM gold-tinted base so
   it stands apart from every other (cool, dark-violet) card at a glance —
   not just a thin border. */
.hgm .quest{position:relative;padding:22px 26px;overflow:hidden;border:1.5px solid rgba(255,196,72,.72);display:flex;align-items:center;gap:22px;flex-wrap:wrap;
  box-shadow:inset 0 1px 0 rgba(255,222,150,.2),0 0 0 1px rgba(255,181,46,.18),0 0 36px rgba(255,181,46,.24),0 12px 30px rgba(0,0,0,.45);
  background:radial-gradient(130% 170% at 78% -45%,rgba(255,181,46,.26),transparent 50%),linear-gradient(135deg,#2b2417,#1b1810)}
.hgm .quest::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(var(--gold2),var(--gold))}
.hgm .qtag{display:inline-flex;align-items:center;gap:5px;font-family:'Lexend';font-weight:800;font-size:10.5px;letter-spacing:.1em;color:#241700;background:linear-gradient(135deg,var(--gold2),var(--gold));padding:4px 11px;border-radius:99px;box-shadow:0 4px 12px rgba(255,181,46,.4)}
.hgm .quest .spark{position:absolute;font-size:20px;opacity:.5;animation:hgmtw 2.4s ease-in-out infinite}
@keyframes hgmtw{0%,100%{opacity:.3;transform:scale(.9)}50%{opacity:.9;transform:scale(1.15)}}
.hgm .pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#e9eaf8;background:#ffffff10;border:1px solid #ffffff14;padding:7px 13px;border-radius:99px}
.hgm .cta{display:inline-flex;align-items:center;gap:8px;font-family:'Lexend';font-weight:700;font-size:16px;color:#2a1c00;background:linear-gradient(135deg,var(--gold2),var(--gold));padding:14px 26px;border-radius:16px;box-shadow:0 12px 30px #ffb52e55;cursor:pointer;transition:.18s}
.hgm .cta:hover{transform:translateY(-3px) scale(1.03);box-shadow:0 16px 38px #ffb52e77}
.hgm .reward{font-family:'Lexend';font-weight:700;color:var(--gold2);font-size:15px}
.hgm .modes{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
/* 3 ngang; màn hẹp → 2 trên + 1 full-width dưới (giữ gradient); rất hẹp → xếp dọc */
@media(max-width:1180px){.hgm .modes{grid-template-columns:1fr 1fr}.hgm .modes>:last-child{grid-column:1/-1}}
@media(max-width:640px){.hgm .modes{grid-template-columns:1fr}.hgm .modes>:last-child{grid-column:auto}}
.hgm .mode{position:relative;padding:20px;border-radius:20px;overflow:hidden;cursor:pointer;color:#fff;display:flex;flex-direction:column;gap:16px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),inset 0 1px 0 rgba(255,255,255,.28),0 8px 22px rgba(0,0,0,.4)}
.hgm .mode .mhead{display:flex;flex-direction:column}
.hgm .mode .ic{width:50px;height:50px;border-radius:14px;display:grid;place-items:center;font-size:26px;background:rgba(255,255,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.35);margin-bottom:14px}
.hgm .mode h3{font-family:'Lexend';font-weight:700;font-size:21px;text-shadow:0 1px 6px rgba(0,0,0,.3)}
.hgm .mode p{opacity:.9;font-size:12.5px;margin-top:3px;font-weight:500;text-shadow:0 1px 4px rgba(0,0,0,.25)}
.hgm .mfoot{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
.hgm .mprev{flex:1;background:rgba(8,9,18,.5);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:11px 13px}
.hgm .prow{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:500}
.hgm .prow b{font-family:'Lexend';font-weight:700}
.hgm .pbar{height:6px;border-radius:99px;background:rgba(0,0,0,.35);overflow:hidden;margin:8px 0 6px}
.hgm .pbar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#fff,rgba(255,255,255,.7))}
.hgm .psub{font-size:11px;opacity:.85}
.hgm .livedot{width:8px;height:8px;border-radius:50%;background:#36e2a0;box-shadow:0 0 0 3px #36e2a033;animation:hgmpulse 1.4s ease-in-out infinite}
@keyframes hgmpulse{0%,100%{box-shadow:0 0 0 2px #36e2a044}50%{box-shadow:0 0 0 5px #36e2a000}}
.hgm .avline{display:flex;align-items:center;gap:0;margin-top:9px}
/* Neutral avatar chips so the stack reads on any card color (orange/violet) */
.hgm .av-s{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;color:#fff;background:rgba(40,42,64,.95);border:2px solid rgba(255,255,255,.85);margin-left:-8px;box-shadow:0 2px 4px rgba(0,0,0,.3)}
.hgm .av-s:first-child{margin-left:0}
.hgm .av-s.more{background:rgba(255,255,255,.92);color:#1a1c30}
.hgm .myrank{margin-left:auto;font-size:11.5px;color:#fff}
.hgm .myrank b{font-family:'Lexend';font-weight:700;color:#fff}
.hgm .mode .go{font-family:'Lexend';font-weight:700;font-size:14px;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;padding-bottom:4px}
.hgm .mode .shine{position:absolute;top:-40%;left:-30%;width:60%;height:180%;background:linear-gradient(75deg,transparent,#ffffff33,transparent);transform:rotate(8deg);animation:hgmshine 4.5s ease-in-out infinite}
@keyframes hgmshine{0%,60%{left:-40%}80%,100%{left:130%}}
.hgm .m-prac{background:linear-gradient(135deg,#8b5cff,#5b2be0)}
.hgm .m-rank{background:linear-gradient(135deg,#ffa12e,#ff4d93)}
.hgm .m-multi{background:linear-gradient(135deg,#22b8ff,#3a5bf0)}
.hgm .miss{display:flex;align-items:center;gap:14px;padding:15px 8px;border-bottom:1px solid #ffffff0d}
.hgm .dot{width:26px;height:26px;border-radius:9px;display:grid;place-items:center;font-size:15px;flex:none;background:#ffffff10;border:1px solid #ffffff18}
.hgm .barmini{flex:1;height:8px;border-radius:99px;background:#00000035;overflow:hidden}
.hgm .barmini i{display:block;height:100%;border-radius:99px}
.hgm .tag{font-family:'Lexend';font-weight:700;font-size:12px;color:var(--dim)}
@media(max-width:900px){.hgm .wrap{grid-template-columns:1fr}.hgm .side{display:none}.hgm .hero{flex-wrap:wrap}.hgm .modes{grid-template-columns:1fr}}
`
