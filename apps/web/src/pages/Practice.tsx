import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useQuery } from '@tanstack/react-query'
import SearchableSelect from '../components/ui/SearchableSelect'
import styles from './Practice.module.css'

interface Book {
  id: string
  name: string
  nameVi: string
  testament: string
  orderIndex: number
}

const DIFFICULTY_OPTIONS = [
  { key: 'all',    label: 'Tất cả', dot: 'rgba(240,232,208,.4)',   dotActive: 'var(--hp-text)' },
  { key: 'easy',   label: 'Dễ',     dot: '#58D68D',                dotActive: '#58D68D'        },
  { key: 'medium', label: 'Vừa',    dot: 'var(--hp-gold)',          dotActive: 'var(--hp-gold)' },
  { key: 'hard',   label: 'Khó',    dot: 'var(--hp-coral)',         dotActive: 'var(--hp-coral)'},
]

const COUNT_OPTIONS = [5, 10, 20, 50]

// Estimated seconds per question by difficulty
const SECS_PER_Q: Record<string, number> = {
  all: 22, easy: 15, medium: 22, hard: 30,
}

export default function Practice() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [questionCount, setQuestionCount] = useState(10)
  const [showExplanation, setShowExplanation] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  const { data: booksData, isLoading: isBooksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const res = await api.get('/api/books')
      return res.data as Book[]
    },
  })

  useEffect(() => {
    if (booksData) setBooks(booksData)
  }, [booksData])

  const startQuiz = async () => {
    try {
      setIsLoading(true)
      setErrorMsg('')
      const res = await api.post('/api/sessions', {
        mode: 'practice',
        book: selectedBook,
        difficulty: selectedDifficulty,
        questionCount,
        showExplanation,
      })
      const { sessionId, questions } = res.data
      navigate('/quiz', {
        state: { sessionId, questions, book: selectedBook, difficulty: selectedDifficulty, questionCount, showExplanation },
      })
    } catch {
      setErrorMsg('Không tạo được phiên luyện tập. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const estimatedMins = Math.round((questionCount * SECS_PER_Q[selectedDifficulty]) / 60) || 1
  const bookCount = selectedBook ? 1 : books.length || 66
  const isDisabled = isLoading || isBooksLoading

  return (
    <div className={styles.page}>
      <div className={styles.glowTop} />
      <div className={styles.glowRight} />

      <div className={styles.container}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>📖</span>
            <span className={styles.badgeText}>Chế độ luyện tập</span>
          </div>

          <h1 className={styles.title}>
            Luyện{' '}
            <em className={styles.titleEm}>Tập</em>
          </h1>
          <p className={styles.subtitle}>
            Không áp lực. Không giới hạn. Học theo cách của bạn.
          </p>
        </div>

        {/* ── Error ───────────────────────────────────────────────── */}
        {errorMsg && (
          <div className={styles.errorBox}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span className={styles.errorText}>{errorMsg}</span>
          </div>
        )}

        {/* ── Main Card ───────────────────────────────────────────── */}
        <form
          className={styles.card}
          onSubmit={e => { e.preventDefault(); if (!isDisabled) startQuiz() }}
        >
          <div className={styles.cardStrip} />

          <div className={styles.cardBody}>
            <div className={styles.twoCol}>

              {/* ── LEFT COLUMN ─────────────────────────────────── */}
              <div className={styles.col}>

                {/* Book selector */}
                <div>
                  <div className={styles.sectionLabelRow}>
                    <span className={styles.sectionLabel} style={{ marginBottom: 0 }}>
                      Sách Kinh Thánh
                    </span>
                    <div className={styles.bookBadge}>
                      <span className={styles.bookBadgeStar}>✦</span>
                      <span className={styles.bookBadgeText}>
                        {books.length || 66}/66 sách
                      </span>
                    </div>
                  </div>
                  <div className={styles.selectWrap}>
                    <SearchableSelect
                      options={books.map(b => ({ value: b.name, label: `${b.nameVi} (${b.name})` }))}
                      value={selectedBook}
                      onChange={setSelectedBook}
                      placeholder="Tìm kiếm sách..."
                      allLabel="Tất cả các sách"
                    />
                  </div>
                  <p className={styles.bookHint}>
                    Để trống để lấy ngẫu nhiên từ tất cả 66 sách.
                  </p>
                </div>

                {/* Question count */}
                <div>
                  <span className={styles.sectionLabel}>Số câu hỏi</span>
                  <div className={styles.countRow}>
                    {COUNT_OPTIONS.map(num => (
                      <button
                        key={num}
                        type="button"
                        className={styles.countBtn}
                        data-active={questionCount === num}
                        onClick={() => setQuestionCount(num)}
                      >
                        {num} câu
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vertical divider */}
              <div className={styles.divider} />

              {/* ── RIGHT COLUMN ────────────────────────────────── */}
              <div className={styles.col}>

                {/* Difficulty */}
                <div>
                  <span className={styles.sectionLabel}>Độ khó</span>
                  <div className={styles.difficultyList}>
                    {DIFFICULTY_OPTIONS.map(d => {
                      const active = selectedDifficulty === d.key
                      return (
                        <button
                          key={d.key}
                          type="button"
                          className={styles.difficultyChip}
                          data-active={active}
                          onClick={() => setSelectedDifficulty(d.key)}
                        >
                          <div
                            className={styles.difficultyDot}
                            style={{
                              background: active ? d.dotActive : d.dot,
                              boxShadow: active ? `0 0 8px ${d.dotActive}` : 'none',
                            }}
                          />
                          <span className={styles.difficultyLabel}>{d.label}</span>
                          {active && (
                            <svg className={styles.difficultyCheck} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Toggle: Show explanation */}
                <div>
                  <span className={styles.sectionLabel}>Giải thích</span>
                  <div
                    className={styles.toggleRow}
                    onClick={() => setShowExplanation(p => !p)}
                  >
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Hiển thị giải thích</span>
                      <span className={styles.toggleDesc}>Xem lý do đúng/sai sau mỗi câu</span>
                    </div>
                    <div className={styles.toggleTrack} data-on={showExplanation}>
                      <div className={styles.toggleThumb} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer stats bar ────────────────────────────────── */}
          <div className={styles.footer}>
            <div className={styles.stats}>
              {[
                { icon: '❓', label: 'câu hỏi',       value: questionCount  },
                { icon: '⏱',  label: 'phút ước tính', value: estimatedMins  },
                { icon: '📚', label: 'sách',           value: bookCount      },
              ].map(s => (
                <div key={s.label} className={styles.stat}>
                  <span className={styles.statIcon}>{s.icon}</span>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className={styles.ctaBtn}
              data-loading={isDisabled}
              disabled={isDisabled}
            >
              {isDisabled ? (
                <>
                  <div className={styles.spinner} />
                  Đang tạo...
                </>
              ) : (
                <>
                  Bắt đầu luyện tập
                  <span style={{ fontSize: '1.1rem' }}>→</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Back link ───────────────────────────────────────────── */}
        <div className={styles.backWrap}>
          <Link to="/" className={styles.backLink}>
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
