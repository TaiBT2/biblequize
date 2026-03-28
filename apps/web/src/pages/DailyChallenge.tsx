import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import ShareCard from '../components/ShareCard'
import styles from './DailyChallenge.module.css'

// ─── Types ──────────────────────────────────────────────────────────────────
interface Question {
  id: string
  book: string
  chapter: number
  content: string
  options: string[]
  correctAnswer: number[]
  explanation: string
}

interface DailyChallengeData {
  questions: Question[]
  alreadyCompleted: boolean
  sessionId: string
  date: string
}

interface DailyResult {
  completed: boolean
  score: number
  correctCount: number
  totalQuestions: number
  sessionId?: string
}

const LETTERS = ['A', 'B', 'C', 'D']

// ─── Component ──────────────────────────────────────────────────────────────
const DailyChallenge: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [challengeData, setChallengeData] = useState<DailyChallengeData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  // Result state
  const [showResult, setShowResult] = useState(false)
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null)
  const [showShareCard, setShowShareCard] = useState(false)

  // Countdown
  const [countdown, setCountdown] = useState('')

  // ── Load daily challenge ────────────────────────────────────────────────
  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const res = await api.get('/api/daily-challenge')
        const data: DailyChallengeData = res.data

        setChallengeData(data)

        if (data.alreadyCompleted) {
          // Fetch result
          const resultRes = await api.get('/api/daily-challenge/result')
          setDailyResult(resultRes.data)
          setShowResult(true)
        } else {
          // Start session
          const startRes = await api.post('/api/daily-challenge/start')
          setSessionId(startRes.data.sessionId)
        }
      } catch (error) {
        console.error('Error loading daily challenge:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChallenge()
  }, [])

  // ── Countdown timer to midnight ────────────────────────────────────────
  useEffect(() => {
    if (!showResult) return

    const updateCountdown = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const diff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [showResult])

  // ── Handle answer selection ─────────────────────────────────────────────
  const handleAnswer = useCallback(async (optionIndex: number) => {
    if (answered || !challengeData || !sessionId) return

    setSelectedAnswer(optionIndex)
    setAnswered(true)

    const question = challengeData.questions[currentIndex]
    const isCorrect = question.correctAnswer.includes(optionIndex)
    setResults(prev => [...prev, isCorrect])

    // Submit answer to API
    try {
      await api.post(`/api/sessions/${sessionId}/answer`, {
        questionId: question.id,
        selectedAnswer: optionIndex,
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }, [answered, challengeData, sessionId, currentIndex])

  // ── Next question ───────────────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (!challengeData) return

    if (currentIndex + 1 >= challengeData.questions.length) {
      // Quiz completed — fetch result
      try {
        const resultRes = await api.get('/api/daily-challenge/result')
        setDailyResult(resultRes.data)
      } catch {
        // Construct from local data
        const correctCount = results.length
        setDailyResult({
          completed: true,
          score: correctCount * 20,
          correctCount,
          totalQuestions: challengeData.questions.length,
          sessionId: sessionId || undefined,
        })
      }
      setShowResult(true)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setAnswered(false)
    }
  }, [challengeData, currentIndex, results, sessionId])

  // ─── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p style={{ marginTop: '1rem', color: '#8B7E6A' }}>Đang tải thử thách...</p>
        </div>
      </div>
    )
  }

  // ─── Result Screen ─────────────────────────────────────────────────────
  if (showResult && dailyResult) {
    const { correctCount, totalQuestions } = dailyResult
    const resultSessionId = dailyResult.sessionId || sessionId || ''

    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>THỬ THÁCH HẰNG NGÀY</h1>
            <p className={styles.subtitle}>Kết quả hôm nay</p>
          </div>

          <div className={styles.resultCard}>
            <div className={styles.resultScore}>{correctCount}/{totalQuestions}</div>
            <div className={styles.resultLabel}>câu đúng</div>

            <div className={styles.stars}>
              {Array.from({ length: totalQuestions }, (_, i) => (
                <span key={i}>{i < correctCount ? '★' : '☆'}</span>
              ))}
            </div>

            <div className={styles.actions}>
              <button
                className={styles.actionBtn}
                onClick={() => setShowShareCard(true)}
              >
                Chia sẻ 📤
              </button>
              <Link to="/leaderboard" className={styles.actionBtn}>
                Xem bảng xếp hạng
              </Link>
              <Link to="/" className={styles.actionBtn}>
                Trang chủ
              </Link>
            </div>

            <div className={styles.countdown}>
              Câu hỏi mới sau:
              <span className={styles.countdownTime}>{countdown}</span>
            </div>
          </div>

          {showShareCard && resultSessionId && (
            <div style={{ marginTop: '1.5rem' }}>
              <ShareCard
                sessionId={resultSessionId}
                score={dailyResult.score}
                correct={correctCount}
                total={totalQuestions}
                userName=""
              />
              <button
                onClick={() => setShowShareCard(false)}
                style={{
                  display: 'block',
                  margin: '1rem auto 0',
                  background: 'none',
                  border: 'none',
                  color: '#8B7E6A',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── No data ────────────────────────────────────────────────────────────
  if (!challengeData || challengeData.questions.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>THỬ THÁCH HẰNG NGÀY</h1>
            <p className={styles.subtitle}>Không có câu hỏi hôm nay. Hãy quay lại sau!</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/" className={styles.actionBtn}>Trang chủ</Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Quiz View ──────────────────────────────────────────────────────────
  const question = challengeData.questions[currentIndex]
  const totalQuestions = challengeData.questions.length

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>THỬ THÁCH HẰNG NGÀY</h1>
          <p className={styles.subtitle}>Trả lời {totalQuestions} câu hỏi mỗi ngày</p>
        </div>

        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}>
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              style={{
                width: '2rem',
                height: '4px',
                borderRadius: '2px',
                background: i < currentIndex
                  ? (results[i] ? '#22C55E' : '#EF4444')
                  : i === currentIndex
                    ? 'var(--hp-gold, #D4A843)'
                    : 'rgba(212, 168, 67, 0.15)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Question Card */}
        <div className={styles.questionCard}>
          <div className={styles.questionCounter}>
            Câu {currentIndex + 1}/{totalQuestions}
          </div>

          {question.book && (
            <span className={styles.metaBadge}>
              {question.book} {question.chapter ? `- Chương ${question.chapter}` : ''}
            </span>
          )}

          <div className={styles.questionText}>{question.content}</div>

          <div className={styles.optionsGrid}>
            {question.options.map((option, i) => {
              let extraClass = ''
              if (answered) {
                if (question.correctAnswer.includes(i)) {
                  extraClass = styles.optionCorrect
                } else if (i === selectedAnswer) {
                  extraClass = styles.optionWrong
                }
              }

              return (
                <button
                  key={i}
                  className={`${styles.optionBtn} ${extraClass}`}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                >
                  <span className={styles.answerLetter}>{LETTERS[i]}.</span>
                  {option}
                </button>
              )
            })}
          </div>

          {/* Explanation after answer */}
          {answered && question.explanation && (
            <div className={styles.explanation}>
              💡 {question.explanation}
            </div>
          )}

          {/* Next button */}
          {answered && (
            <button className={styles.nextBtn} onClick={handleNext}>
              {currentIndex + 1 >= totalQuestions ? 'Xem kết quả' : 'Câu tiếp theo →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DailyChallenge
