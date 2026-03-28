import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../store/authStore'
import styles from './Home.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeaderboardPlayer {
  id: string
  name: string
  points: number
  rank: number
  tier?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.classList.contains('hp-on')) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('hp-on'); obs.unobserve(el) } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function RevealDiv({ children, style, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const ref = useScrollReveal()
  return <div ref={ref} className={`hp-reveal ${className}`} style={style}>{children}</div>
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ onOpenLogin, onLoggedOut }: { onOpenLogin: () => void; onLoggedOut: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    onLoggedOut()
  }

  const initials = user?.name?.split(' ').filter(Boolean).map(w => w[0]).slice(-2).join('').toUpperCase() ?? '?'
  const shortName = user?.name?.split(' ').slice(-1)[0] ?? ''

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
      <a href="/" className={styles.navLogo}>
        <em className={styles.navLogoIcon}>✝</em>
        BibleQuiz
      </a>
      <div className={styles.navLinks}>
        <a href="#modes" className={styles.navLink}>Chế độ</a>
        <a href="#lb-section" className={styles.navLink}>Rank</a>

        {isAuthenticated ? (
          <div className={styles.navUser} ref={dropdownRef}>
            <button
              className={styles.navAvatarBtn}
              onClick={() => setDropdownOpen(o => !o)}
              aria-label="Tài khoản"
            >
              {user?.avatar
                ? <img src={user.avatar} className={styles.navAvatarImg} alt={user.name} />
                : <div className={styles.navAvatarInitial}>{initials}</div>
              }
              <span className={styles.navUserName}>{shortName}</span>
              <span className={styles.navAvatarChevron} data-open={dropdownOpen}>▾</span>
            </button>

            {dropdownOpen && (
              <div className={styles.navDropdown}>
                <div className={styles.navDropdownHeader}>
                  <div className={styles.navDropdownName}>{user?.name}</div>
                  <div className={styles.navDropdownEmail}>{user?.email}</div>
                </div>
                <div className={styles.navDropdownDivider} />
                <Link to="/profile" className={styles.navDropdownItem} onClick={() => setDropdownOpen(false)}>
                  <span>👤</span> Hồ sơ của tôi
                </Link>
                <Link to="/achievements" className={styles.navDropdownItem} onClick={() => setDropdownOpen(false)}>
                  <span>🏆</span> Thành tích
                </Link>
                <Link to="/leaderboard" className={styles.navDropdownItem} onClick={() => setDropdownOpen(false)}>
                  <span>📊</span> Lịch sử thi đấu
                </Link>
                <div className={styles.navDropdownDivider} />
                <button className={`${styles.navDropdownItem} ${styles.navDropdownLogout}`} onClick={handleLogout}>
                  <span>↩</span> Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className={styles.navLoginBtn} onClick={onOpenLogin}>Đăng nhập</button>
            <Link to="/ranked" className={`${styles.navCta} ${styles.navCtaGlow}`}>Chơi ngay — miễn phí</Link>
          </>
        )}
      </div>
    </nav>
  )
}

// ─── Login Modal ──────────────────────────────────────────────────────────────
function LoginModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string; general?: string }>({})
  const { login } = useAuth()

  const backendUrl = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:8080'

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleGoogle = () => {
    window.location.href = `${backendUrl}/oauth2/authorization/google`
  }

  const validate = () => {
    const errs: typeof errors = {}
    if (mode === 'register' && !name.trim()) errs.name = 'Vui lòng nhập họ tên'
    if (!email.trim()) errs.email = 'Vui lòng nhập email'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email không hợp lệ'
    if (!password) errs.password = 'Vui lòng nhập mật khẩu'
    else if (mode === 'register' && password.length < 8) errs.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    if (mode === 'register' && password !== confirmPassword) errs.confirm = 'Mật khẩu xác nhận không khớp'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setErrors({})
    try {
      const { api: apiClient } = await import('../api/client')
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = mode === 'login'
        ? { email: email.trim(), password, rememberMe: true }
        : { name: name.trim(), email: email.trim(), password }
      const res = await apiClient.post(endpoint, payload)
      const { accessToken, name: userName, email: userEmail, avatar, role } = res.data
      login({ accessToken, name: userName, email: userEmail, avatar: avatar || undefined, role })
      onClose()
    } catch (err: any) {
      const message = err.response?.data?.message
      setErrors({ general: message || (mode === 'login' ? 'Sai email hoặc mật khẩu.' : 'Đăng ký thất bại. Vui lòng thử lại.') })
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); setErrors({}); setPassword(''); setConfirmPassword('')
  }

  return (
    <div className={styles.modalOverlay} onClick={handleBackdrop}>
      <div className={styles.modalBox}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Đóng">✕</button>

        <div className={styles.modalHeader}>
          <div className={styles.modalLogo}>✝ BibleQuiz</div>
          <h2 className={styles.modalTitle}>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
          <p className={styles.modalSub}>{mode === 'login' ? 'Chào mừng bạn trở lại' : 'Tạo tài khoản miễn phí'}</p>
        </div>

        <button className={styles.modalGoogleBtn} onClick={handleGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Tiếp tục với Google
        </button>

        <div className={styles.modalDivider}>
          <div className={styles.modalDividerLine} />
          <span className={styles.modalDividerText}>hoặc</span>
          <div className={styles.modalDividerLine} />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {errors.general && <div className={styles.modalErrorBanner}>{errors.general}</div>}

          {mode === 'register' && (
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Họ và tên</label>
              <input
                className={`${styles.modalInput} ${errors.name ? styles.modalInputErr : ''}`}
                type="text" placeholder="Nguyễn Văn A"
                value={name} onChange={e => setName(e.target.value)} autoComplete="name"
              />
              {errors.name && <span className={styles.modalFieldError}>{errors.name}</span>}
            </div>
          )}

          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Email</label>
            <input
              className={`${styles.modalInput} ${errors.email ? styles.modalInputErr : ''}`}
              type="email" placeholder="email@example.com"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
            />
            {errors.email && <span className={styles.modalFieldError}>{errors.email}</span>}
          </div>

          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Mật khẩu</label>
            <input
              className={`${styles.modalInput} ${errors.password ? styles.modalInputErr : ''}`}
              type="password" placeholder={mode === 'register' ? 'Ít nhất 8 ký tự' : '••••••••'}
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {errors.password && <span className={styles.modalFieldError}>{errors.password}</span>}
          </div>

          {mode === 'register' && (
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Xác nhận mật khẩu</label>
              <input
                className={`${styles.modalInput} ${errors.confirm ? styles.modalInputErr : ''}`}
                type="password" placeholder="Nhập lại mật khẩu"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {errors.confirm && <span className={styles.modalFieldError}>{errors.confirm}</span>}
            </div>
          )}

          <button className={styles.modalSubmitBtn} type="submit" disabled={loading}>
            {loading && <span className={styles.modalSpinner} />}
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className={styles.modalSwitch}>
          {mode === 'login'
            ? <><span>Chưa có tài khoản? </span><button className={styles.modalSwitchLink} onClick={() => switchMode('register')}>Đăng ký ngay</button></>
            : <><span>Đã có tài khoản? </span><button className={styles.modalSwitchLink} onClick={() => switchMode('login')}>Đăng nhập</button></>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return (
    <div className={styles.toast}>
      <span className={styles.toastIcon}>✓</span>
      {message}
    </div>
  )
}

// ─── Demo Card ────────────────────────────────────────────────────────────────
function DemoCard() {
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [timerSecs, setTimerSecs] = useState(8)

  const options = [
    { key: 'A', text: 'Một đôi',   correct: false },
    { key: 'B', text: 'Hai đôi',   correct: false },
    { key: 'C', text: 'Bảy đôi',   correct: true  },
    { key: 'D', text: 'Mười đôi',  correct: false },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSecs(s => { if (s <= 1) return 20; return s - 1 })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const pick = useCallback((idx: number) => {
    if (answered) return
    setAnswered(true)
    setSelected(idx)
    setTimeout(() => { setAnswered(false); setSelected(null) }, 3200)
  }, [answered])

  return (
    <div className={styles.demoWrap}>
      {/* Score popup */}
      <div className={styles.scorePopup}>
        <div className={styles.scorePopupValue}>+150</div>
        <div className={styles.scorePopupLabel}>Speed bonus!</div>
      </div>

      <div className={styles.demoCard}>
        <div className={styles.demoStrip} />
        <div className={styles.demoBadge}>🔴 LIVE · Battle Royale</div>

        <div className={styles.demoHeader}>
          <div className={styles.demoStatus}>
            <span className={styles.demoPulse} />
            Câu 12 / 20 · 43 người còn lại
          </div>
          <div className={styles.demoTimer}>
            <div className={styles.demoTimerBar}>
              <div className={styles.demoTimerFill} />
            </div>
            <span>{timerSecs}s</span>
          </div>
        </div>

        <div className={styles.demoQuestion}>
          <div className={styles.demoRef}>Sáng thế ký 7:1–4</div>
          <div>Đức Chúa Trời bảo Nô-ê đưa bao nhiêu đôi thú sạch vào tàu?</div>
        </div>

        <div className={styles.demoOptions}>
          {options.map((opt, idx) => (
            <div
              key={opt.key}
              className={styles.demoOption}
              data-answered={answered}
              data-selected={selected === idx}
              data-correct={opt.correct}
              onClick={() => pick(idx)}
            >
              <span className={styles.demoOptionKey}>{opt.key}</span>
              {opt.text}
            </div>
          ))}
        </div>

        <div className={styles.demoFooter}>
          <div className={styles.demoFooterPeople}>
            👥 <strong style={{ color: 'var(--hp-text)' }}>43</strong> người còn lại
          </div>
          <div className={styles.demoFooterStreak}>🔥 Streak ×7</div>
        </div>
      </div>
    </div>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const AVATARS = [
    { bg: '#2C1F5E', color: '#9B7FE8', text: 'TH' },
    { bg: '#1A3A1A', color: '#58D68D', text: 'MK' },
    { bg: '#3A1A0A', color: '#F5A623', text: 'LP' },
    { bg: '#1A1A3A', color: '#5DADE2', text: 'HN' },
    { bg: '#3A1A2A', color: '#F1948A', text: 'QL' },
  ]

  return (
    <section className={styles.hero}>
      <div className={styles.heroBg}>BIBLE</div>

      {/* Left */}
      <div className={styles.heroLeft}>
        <div className={styles.heroLiveBadge}>
          <span className={styles.heroLiveBadgeEmoji}>🔥</span>
          2,847 người đang online ngay lúc này
        </div>

        <h1 className={styles.heroTitle}>
          <span className={styles.heroTitleLine1}>Kinh Thánh.</span>
          <span className={styles.heroTitleLine2}>
            Thời gian thực.
            <span className={styles.heroUnderline} />
          </span>
          <span className={styles.heroTitleSub}>Không phải giờ học giáo lý đâu nhé.</span>
        </h1>

        <p className={styles.heroSub}>
          Thi đua câu hỏi Kinh Thánh với hàng nghìn người — Battle Royale, Speed Race, 1v1 Sudden Death.
          Học thật sự, cạnh tranh thật sự.
        </p>

        <div className={styles.heroBtns}>
          <Link to="/ranked" className={styles.heroBtnPrimary}>
            Bắt đầu — miễn phí ↗
          </Link>
          <a href="#modes" className={styles.heroBtnSecondary}>
            Xem chế độ chơi
          </a>
        </div>

        <div className={styles.heroSocial}>
          <div className={styles.heroAvatars}>
            {AVATARS.map((av, i) => (
              <div key={i} className={styles.heroAvatar} style={{ background: av.bg, color: av.color }}>
                {av.text}
              </div>
            ))}
          </div>
          <div className={styles.heroSocialText}>
            <strong style={{ color: 'var(--hp-text)' }}>31,240 người</strong> đã tham gia<br />
            Câu hỏi mới mỗi ngày · 66 sách Kinh Thánh
          </div>
        </div>
      </div>

      {/* Right: Demo Card */}
      <div className={styles.heroRight}>
        <div className={styles.heroDemoWrap}>
          <DemoCard />
        </div>
      </div>
    </section>
  )
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
function TickerBanner() {
  const items = ['Battle Royale', 'Speed Race', 'Team vs Team', 'Sudden Death 1v1', 'Leo Rank hàng ngày', 'Luyện tập tự do', '66 sách Kinh Thánh', '8,500+ câu hỏi']
  const doubled = [...items, ...items]
  return (
    <div className={styles.ticker}>
      <div className={styles.tickerInner}>
        {doubled.map((item, i) => (
          <span key={i}>
            <span className={styles.tickerItem}>{item}</span>
            <span className={styles.tickerSep}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Modes Section ────────────────────────────────────────────────────────────
function ModesSection() {
  const r1 = useScrollReveal(), r2 = useScrollReveal(), r3 = useScrollReveal()

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - .5
    const y = (e.clientY - rect.top) / rect.height - .5
    card.style.transform = `translateY(-5px) perspective(500px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`
  }

  const multiCards = [
    { id: 'battle', accentRgb: '212,168,67', emoji: '⚔️', name: 'Battle Royale', desc: 'Sai là bay. Người cuối sống sót thắng. Top 3 nhận huy chương.', count: '5 – 100 người', tag: '5–100 người', delay: '.05s', orb: 'var(--hp-gold)', accentColor: 'var(--hp-gold)', hot: true },
    { id: 'speed',  accentRgb: '52,152,219',  emoji: '⚡', name: 'Speed Race',   desc: 'Không ai bị loại, nhưng tốc độ tính điểm. Đúng + nhanh = thống trị.', count: '2 – 20 người', tag: '2–20 người', delay: '.1s', orb: '#3498DB', accentColor: '#5DADE2', hot: false },
    { id: 'team',   accentRgb: '46,213,115',  emoji: '🤝', name: 'Team vs Team', desc: 'Hai đội đấu. Cả đội đúng hết được Perfect Round bonus +50 điểm.', count: '4 – 40 người', tag: '4–40 người', delay: '.15s', orb: '#2ED573', accentColor: '#58D68D', hot: false },
    { id: 'sudden', accentRgb: '255,107,91',  emoji: '💀', name: 'Sudden Death', desc: 'Ai sai trước thua. Người thắng giữ ghế. Hàng chờ vô tận.', count: '2 người · 1v1', tag: '1 đấu 1', delay: '.2s', orb: 'var(--hp-coral)', accentColor: 'var(--hp-coral)', hot: false },
  ]

  return (
    <section id="modes" className={styles.modes}>
      <div ref={r1} className="hp-reveal" style={{ marginBottom: '.75rem' }}>
        <div className={styles.sectionLabel}>
          <span className={styles.sectionLabelSlash}>//</span> Chế độ chơi
        </div>
      </div>
      <h2 ref={r2} className={`hp-reveal ${styles.sectionTitle}`}>
        Chọn cách bạn<br />muốn thống trị.
      </h2>
      <p ref={r3} className={`hp-reveal ${styles.sectionSub}`}>
        Solo, đội nhóm, hay một mình đấu cả phòng — BibleQuiz có đủ.
      </p>

      {/* Solo modes */}
      <div className={styles.modesSoloGrid}>
        {/* Practice card */}
        <RevealDiv style={{ transitionDelay: '.05s' }}>
          <Link to="/practice" style={{ textDecoration: 'none' }}>
            <div
              className={`${styles.modeCard} ${styles.modeCardGold}`}
              style={{ '--accent-rgb': '212,168,67' } as React.CSSProperties}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={e => { e.currentTarget.style.transform = '' }}
            >
              <div className={styles.modeCardStrip} style={{ background: 'linear-gradient(90deg,var(--hp-gold),var(--hp-gold2))' }} />
              <div className={styles.modeCardIconWrap} style={{ background: 'rgba(212,168,67,.12)' }}>📖</div>
              <div className={styles.modeCardTitle}>Luyện Tập</div>
              <p className={styles.modeCardDesc}>
                Không áp lực, không giới hạn. Tự chọn sách, độ khó, số câu. Lý tưởng cho người mới bắt đầu hoặc ôn lại trước khi leo rank.
              </p>
              <ul className={styles.modeCardList}>
                {['Chọn bất kỳ sách nào trong 66 sách', 'Xem giải thích sau mỗi câu', 'Lưu câu sai để ôn lại', 'Không ảnh hưởng điểm rank'].map(f => (
                  <li key={f} className={styles.modeCardListItem}>
                    <span className={styles.modeCardDot} style={{ background: 'var(--hp-gold)' }} />{f}
                  </li>
                ))}
              </ul>
              <span className={styles.modeCardTag} style={{ background: 'rgba(212,168,67,.1)', color: 'var(--hp-gold2)', border: '1px solid rgba(212,168,67,.2)' }}>✨ Bắt đầu ở đây</span>
            </div>
          </Link>
        </RevealDiv>

        {/* Ranked card */}
        <RevealDiv style={{ transitionDelay: '.1s' }}>
          <Link to="/ranked" style={{ textDecoration: 'none' }}>
            <div
              className={`${styles.modeCard} ${styles.modeCardOrange}`}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={e => { e.currentTarget.style.transform = '' }}
            >
              <div className={styles.modeCardStrip} style={{ background: 'linear-gradient(90deg,#E67E22,#F5A623)' }} />
              <div className={styles.modeCardIconWrap} style={{ background: 'rgba(230,126,34,.12)' }}>🏆</div>
              <div className={styles.modeCardTitle}>Leo Rank</div>
              <p className={styles.modeCardDesc}>
                Hành trình có hệ thống từ Genesis đến Revelation. Mỗi ngày 50 câu, 10 mạng — sai là mất mạng, hết mạng là hết ngày.
              </p>
              {/* Lives */}
              <div className={styles.livesDots}>
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className={styles.livesDot} data-active={i < 7} />
                ))}
                <span className={styles.livesDotLabel}>7/10 mạng còn lại</span>
              </div>
              {/* Progress */}
              <div className={styles.rankedProgress}>
                <div className={styles.rankedProgressRow}>
                  <span>Genesis 12</span><span>23 / 50 câu hôm nay</span>
                </div>
                <div className={styles.rankedProgressBar}>
                  <div className={styles.rankedProgressFill} />
                </div>
              </div>
              <ul className={styles.modeCardList}>
                {['Genesis → Revelation theo thứ tự', 'Câu khó dần sau khi hoàn thành toàn bộ', 'Reset lúc nửa đêm mỗi ngày'].map(f => (
                  <li key={f} className={styles.modeCardListItem}>
                    <span className={styles.modeCardDot} style={{ background: '#E67E22' }} />{f}
                  </li>
                ))}
              </ul>
              <span className={styles.modeCardTag} style={{ background: 'rgba(230,126,34,.1)', color: '#F5A623', border: '1px solid rgba(230,126,34,.2)' }}>🔥 Tính điểm xếp hạng</span>
            </div>
          </Link>
        </RevealDiv>
      </div>

      {/* Divider */}
      <RevealDiv>
        <div className={styles.modesDivider}>
          <div className={styles.modesDividerLine} />
          <div className={styles.modesDividerText}>Multiplayer · Realtime</div>
          <div className={styles.modesDividerLine} />
        </div>
      </RevealDiv>

      {/* 4 multiplayer cards */}
      <div className={styles.modesMultiGrid}>
        {multiCards.map(card => (
          <RevealDiv key={card.id} style={{ transitionDelay: card.delay }}>
            <div
              className={styles.multiCard}
              style={{ '--accent-rgb': card.accentRgb } as React.CSSProperties}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={e => { e.currentTarget.style.transform = '' }}
            >
              {card.hot && <div className={styles.multiCardHot}>HOT</div>}
              <div className={styles.multiCardTag} style={{ color: card.accentColor }}>{card.tag}</div>
              <span className={styles.multiCardEmoji} style={{ '--accent-rgb': card.accentRgb } as React.CSSProperties}>{card.emoji}</span>
              <div className={styles.multiCardName}>{card.name}</div>
              <p className={styles.multiCardDesc}>{card.desc}</p>
              <div className={styles.multiCardCount}>
                <span style={{ fontSize: '.65rem' }}>👥</span> {card.count}
              </div>
              <div className={styles.multiCardOrb} style={{ background: card.orb }} />
            </div>
          </RevealDiv>
        ))}
      </div>
    </section>
  )
}

// ─── Why Section ──────────────────────────────────────────────────────────────
function WhySection() {
  const cards = [
    { num: '01', icon: '🏆', title: 'Học bằng cách thi đấu, không phải đọc', desc: 'Não bộ nhớ lâu hơn khi có áp lực và cảm xúc. Battle Royale tạo ra đúng điều đó — bạn sẽ không quên câu trả lời sau khi bị loại vì nó.' },
    { num: '02', icon: '📈', title: 'Streak và rank khiến bạn quay lại', desc: 'Hệ thống Leo Rank daily reset, streak ngày liên tiếp, và bảng xếp hạng realtime tạo động lực học mỗi ngày — không cần ý chí.' },
    { num: '03', icon: '👥', title: 'Chơi cùng nhóm nhà thờ, không cần setup phức tạp', desc: 'Tạo phòng, chia sẻ mã 6 ký tự, bắt đầu trong 30 giây. Team vs Team hoàn hảo cho lớp học Kinh Thánh hoặc sự kiện nhóm.' },
  ]
  const r1 = useScrollReveal(), r2 = useScrollReveal()
  return (
    <section className={styles.why}>
      <div ref={r1} className="hp-reveal">
        <div className={styles.sectionLabel}>
          <span className={styles.sectionLabelSlash}>//</span> Tại sao BibleQuiz
        </div>
      </div>
      <h2 ref={r2} className={`hp-reveal ${styles.whyTitle}`}>
        Khác với những app<br />Kinh Thánh khác.
      </h2>
      <div className={styles.whyGrid}>
        {cards.map((card, i) => (
          <RevealDiv key={card.num} style={{ transitionDelay: `${i * .05 + .05}s` }}>
            <div className={styles.whyCard}>
              <div className={styles.whyCardIcon}>{card.icon}</div>
              <div className={styles.whyNum}>{card.num}</div>
              <div className={styles.whyCardTitle}>{card.title}</div>
              <p className={styles.whyCardDesc}>{card.desc}</p>
            </div>
          </RevealDiv>
        ))}
      </div>
    </section>
  )
}

// ─── Leaderboard Section ──────────────────────────────────────────────────────
const MOCK_LB: LeaderboardPlayer[] = [
  { id: '1', name: 'Thanh Hằng',  points: 124850, rank: 1, tier: 'Battle Royale · 28 trận thắng liên tiếp' },
  { id: '2', name: 'Minh Khoa',   points: 118420, rank: 2, tier: 'Speed Race · Avg 2.1s / câu' },
  { id: '3', name: 'Lan Phương',  points: 103710, rank: 3, tier: 'Team vs Team · 95% accuracy' },
  { id: '4', name: 'Hoàng Nam',   points: 97300,  rank: 4, tier: 'Sudden Death · 41 trận giữ ghế' },
  { id: '5', name: 'Quỳnh Liên',  points: 89150,  rank: 5, tier: 'Leo Rank · 22 ngày streak' },
]

const LB_AVATARS = [
  { bg: 'rgba(155,89,182,.2)',  color: '#C39BD3', text: 'TH' },
  { bg: 'rgba(52,152,219,.2)',  color: '#5DADE2', text: 'MK' },
  { bg: 'rgba(46,213,115,.2)', color: '#58D68D', text: 'LP' },
  { bg: 'rgba(230,126,34,.2)', color: '#F5A623', text: 'HN' },
  { bg: 'rgba(255,107,91,.2)', color: '#FF6B5B', text: 'QL' },
]

const LB_STREAKS = [28, 14, 9]
const LB_RANK_EMOJIS = ['🥇', '🥈', '🥉']

function LeaderboardSection() {
  const [activeTab, setActiveTab] = useState(0)
  const [data, setData] = useState<LeaderboardPlayer[]>(MOCK_LB)
  const [loading, setLoading] = useState(false)
  const tabs = ['Tuần này', 'Hôm nay', 'Mọi thời đại']
  const timeframes = ['weekly', 'daily', 'all-time']
  const r1 = useScrollReveal(), r2 = useScrollReveal()

  useEffect(() => {
    setLoading(true)
    api.get(`/api/leaderboard/${timeframes[activeTab]}`)
      .then(res => { if (res.data?.length >= 5) { setData(res.data.slice(0, 5)) } else { setData(MOCK_LB) } })
      .catch(() => setData(MOCK_LB))
      .finally(() => setLoading(false))
  }, [activeTab])

  return (
    <section id="lb-section" className={styles.lb}>
      <div ref={r1} className="hp-reveal">
        <div className={styles.sectionLabel}>
          <span className={styles.sectionLabelSlash}>//</span> Bảng xếp hạng
        </div>
      </div>
      <h2 ref={r2} className={`hp-reveal ${styles.lbTitle}`}>
        Ai đang dẫn đầu<br />tuần này?
      </h2>

      <div className={styles.lbInner}>
        {/* Tabs */}
        <RevealDiv>
          <div className={styles.lbTabs}>
            {tabs.map((tab, i) => (
              <button
                key={tab}
                className={styles.lbTab}
                data-active={activeTab === i}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </div>
        </RevealDiv>

        {/* Rows */}
        <RevealDiv>
          <div className={styles.lbRows}>
            {loading && (
              <div className={styles.lbOverlay}>
                <div className={styles.lbSpinner} />
              </div>
            )}
            <div key={activeTab} className={styles.lbTabContent}>
            {data.map((player, i) => (
              <div key={player.id} className={`${styles.lbRow} ${i === 0 ? styles.lbRowTop : ''}`}>
                <div className={styles.lbRank} data-rank={i < 3 ? i : 3}>
                  {i < 3 ? LB_RANK_EMOJIS[i] : i + 1}
                </div>
                <div
                  className={styles.lbAvatar}
                  style={{
                    background: LB_AVATARS[i]?.bg ?? 'rgba(255,255,255,.1)',
                    color: LB_AVATARS[i]?.color ?? '#fff',
                    border: i === 0 ? '2px solid var(--hp-gold)' : i === 1 ? '2px solid #B0B8C4' : i === 2 ? '2px solid #CD7F32' : 'none'
                  }}
                >
                  {LB_AVATARS[i]?.text ?? player.name.slice(0, 2).toUpperCase()}
                </div>
                <div className={styles.lbInfo}>
                  <div className={styles.lbName}>{player.name}</div>
                  <div className={styles.lbTier}>{player.tier}</div>
                </div>
                {i < 3 && (
                  <div className={styles.lbStreak}>🔥 {LB_STREAKS[i]}</div>
                )}
                <div className={styles.lbPoints}>
                  {player.points.toLocaleString()}
                  <small className={styles.lbPointsLabel}>điểm</small>
                </div>
              </div>
            ))}
            </div>
          </div>
        </RevealDiv>

        {/* View all link */}
        <RevealDiv>
          <div className={styles.lbViewAll}>
            <Link to="/leaderboard" className={styles.lbViewAllLink}>
              Xem toàn bộ bảng xếp hạng ↗
            </Link>
          </div>
        </RevealDiv>
      </div>
    </section>
  )
}

// ─── Quote Section ────────────────────────────────────────────────────────────
function QuoteSection() {
  const r = useScrollReveal()
  return (
    <section className={styles.quote}>
      <div ref={r} className={`hp-reveal ${styles.quoteInner}`}>
        <div className={styles.quoteText}>
          Hãy <em className={styles.quoteEm}>siêng năng dạy</em> những điều này cho con cái ngươi — hoặc là dùng BibleQuiz, cũng được.
        </div>
        <div className={styles.quoteRef}>
          Phục Truyền 6:7 · (có chút diễn giải)
        </div>
      </div>
    </section>
  )
}

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className={styles.cta}>
      <div className={styles.ctaGlow} />
      <RevealDiv>
        <h2 className={styles.ctaTitle}>
          Đăng nhập.<br /><span className={styles.ctaTitleHighlight}>Bắt đầu. Thắng.</span>
        </h2>
        <p className={styles.ctaSub}>Không cần tạo tài khoản. Đăng nhập Google là chơi ngay.</p>
        <div className={styles.ctaBtns}>
          <Link to="/ranked" className={styles.ctaBtnPrimary}>Chơi ngay — miễn phí ↗</Link>
          <a href="#modes" className={styles.ctaBtnSecondary}>Xem chế độ chơi</a>
        </div>
        <div className={styles.ctaFootnote}>Miễn phí · Không quảng cáo · 66 sách Kinh Thánh đầy đủ</div>
      </RevealDiv>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerLeft}>
        <div className={styles.footerLogo}>✝ BibleQuiz</div>
        <div className={styles.footerTagline}>Quiz Kinh Thánh · Competitive Gaming</div>
      </div>
      <ul className={styles.footerLinks}>
        {['Về chúng tôi', 'Điều khoản', 'Quyền riêng tư', 'Liên hệ'].map(link => (
          <li key={link}>
            <a href="#" className={styles.footerLink}>{link}</a>
          </li>
        ))}
      </ul>
      <div className={styles.footerCopy}>© 2026 BibleQuiz</div>
    </footer>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [showLogin, setShowLogin] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fireToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  return (
    <div className={styles.root}>
      <Nav onOpenLogin={() => setShowLogin(true)} onLoggedOut={() => fireToast('Đã đăng xuất ✓')} />
      <HeroSection />
      <TickerBanner />
      <ModesSection />
      <WhySection />
      <LeaderboardSection />
      <QuoteSection />
      <CTASection />
      <Footer />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {toast && <Toast message={toast} />}
    </div>
  )
}
