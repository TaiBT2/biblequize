import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import QuizResults from './QuizResults'

interface Question {
  id: string
  book: string
  chapter: number
  difficulty: 'easy' | 'medium' | 'hard'
  type: string
  content: string
  options: string[]
  correctAnswer: number[]
  explanation: string
}

interface QuizSettings {
  book: string
  difficulty: string
  questionCount: number
  showExplanation: boolean
}

interface QuizStats {
  totalScore: number
  correctAnswers: number
  totalQuestions: number
  accuracy: number
  averageTime: number
  totalTime: number
  difficultyBreakdown: {
    easy: { correct: number; total: number; score: number }
    medium: { correct: number; total: number; score: number }
    hard: { correct: number; total: number; score: number }
  }
  timePerQuestion: number[]
  questions: Question[]
  userAnswers: (number | null)[]
  questionScores: number[]
}

// FIX #16: Typed interface instead of `as any`
interface QuizPageSettings {
  sessionId?: string
  questions?: Question[]
  mode?: 'practice' | 'ranked' | 'room'
  book?: string
  difficulty?: string
  showExplanation?: boolean
  isRanked?: boolean
}

const Quiz: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const settings = location.state as QuizPageSettings | null

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [scoreBump, setScoreBump] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isQuizCompleted, setIsQuizCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalScore: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    accuracy: 0,
    averageTime: 0,
    totalTime: 0,
    difficultyBreakdown: {
      easy: { correct: 0, total: 0, score: 0 },
      medium: { correct: 0, total: 0, score: 0 },
      hard: { correct: 0, total: 0, score: 0 }
    },
    timePerQuestion: [],
    questions: [],
    userAnswers: [],
    questionScores: []
  })
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now())
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([])
  const [questionScores, setQuestionScores] = useState<number[]>([])

  const currentQuestion = questions[currentQuestionIndex]

  // Simple WebAudio tones for feedback
  const playTone = (frequency: number, durationMs: number, type: OscillatorType = 'sine', volume = 0.1) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = frequency
      gain.gain.value = volume
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      setTimeout(() => { osc.stop(); ctx.close() }, durationMs)
    } catch { }
  }
  const playCorrectSound = () => {
    playTone(880, 120, 'sine', 0.12)
  }
  const playWrongSound = () => {
    playTone(200, 180, 'square', 0.08)
  }

  // When quiz is completed and we have a server session, fetch aggregated stats from backend
  useEffect(() => {
    const fetchBackendStats = async () => {
      if (!settings?.sessionId) return
      try {
        const res = await api.get(`/api/sessions/${settings.sessionId}/review`)
        const serverStats = res.data?.stats
        if (serverStats) {
          setQuizStats(prev => ({
            ...prev,
            totalScore: serverStats.totalScore ?? prev.totalScore,
            correctAnswers: serverStats.correctAnswers ?? prev.correctAnswers,
            totalQuestions: serverStats.totalQuestions ?? prev.totalQuestions,
            accuracy: serverStats.accuracy ?? prev.accuracy,
            averageTime: serverStats.averageTime ?? prev.averageTime,
            totalTime: serverStats.totalTime ?? prev.totalTime,
            difficultyBreakdown: serverStats.difficultyBreakdown ?? prev.difficultyBreakdown,
            timePerQuestion: serverStats.timePerQuestion ?? prev.timePerQuestion
          }))
        }
      } catch (e) {
        console.error('Failed to load backend review stats', e)
      }
    }
    if (isQuizCompleted) {
      fetchBackendStats()
    }
  }, [isQuizCompleted, settings?.sessionId])

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !showResult && !isQuizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      // Time's up - auto submit
      handleAnswerSelect(-1) // -1 means time's up
    }
  }, [timeLeft, showResult, isQuizCompleted])

  // Load questions
  useEffect(() => {
    const boot = () => {
      try {
        setIsLoading(true)
        const initialQuestions = settings?.questions || []
        if (initialQuestions.length > 0) {
          setQuestions(initialQuestions)
          setTimeLeft(30)
          setQuizStartTime(Date.now())
          setQuestionStartTime(Date.now())
          setQuizStats(prev => ({
            ...prev,
            totalQuestions: initialQuestions.length,
            questions: initialQuestions
          }))
          setUserAnswers(new Array(initialQuestions.length).fill(null))
          setQuestionScores(new Array(initialQuestions.length).fill(0))
        } else {
          alert('Không có câu hỏi trong phiên này')
          navigate('/practice')
        }
      } finally {
        setIsLoading(false)
      }
    }
    if (settings) boot(); else navigate('/practice')
  }, [settings, navigate])

  const handleAnswerSelect = async (answerIndex: number) => {
    if (showResult) return

    setSelectedAnswer(answerIndex)
    setShowResult(true)

    // Calculate time taken for this question
    const timeTaken = 30 - timeLeft
    let isCorrect = false
    let rankedResponse: any = null
    try {
      if (settings?.mode === 'ranked' && settings?.sessionId) {
        const res = await api.post(`/api/ranked/sessions/${settings.sessionId}/answer`, {
          questionId: currentQuestion.id,
          answer: answerIndex,
          clientElapsedMs: (30 - timeLeft) * 1000
          // FIX #5: Removed client-sent isCorrect — server validates independently
        })

        const data = res.data
        rankedResponse = data
        isCorrect = answerIndex === currentQuestion.correctAnswer[0]

        // Update askedQuestionIds in localStorage for ranked mode
        try {
          const today = new Date().toISOString().slice(0, 10)
          const currentAskedIds = JSON.parse(localStorage.getItem('askedQuestionIds') || '[]')
          if (!currentAskedIds.includes(currentQuestion.id)) {
            currentAskedIds.push(currentQuestion.id)
            localStorage.setItem('askedQuestionIds', JSON.stringify(currentAskedIds))
            localStorage.setItem('lastAskedDate', today)
          }
        } catch (e) {
          console.warn('Failed to update askedQuestionIds:', e)
        }

        // If lives dropped to 0 -> end quiz immediately
        if (typeof data.livesRemaining === 'number' && data.livesRemaining <= 0) {
          setQuizStats(prev => ({
            ...prev,
            totalTime: Date.now() - quizStartTime,
            userAnswers: userAnswers,
            questionScores: questionScores
          }))
          setIsQuizCompleted(true)
          return
        }

        // Update ranked status in localStorage for real-time display
        try {
          const today = new Date().toISOString().slice(0, 10)

          // Simple and direct update
          const updatedData = {
            date: today,
            livesRemaining: data.livesRemaining,
            questionsCounted: data.questionsCounted,
            pointsToday: data.pointsToday,
            cap: 500,
            dailyLives: 30
          }

          localStorage.setItem('rankedSnapshot', JSON.stringify(updatedData))
          localStorage.setItem('rankedProgress', JSON.stringify(updatedData))
          localStorage.setItem('rankedStatus', JSON.stringify(updatedData))
          localStorage.setItem('sessionBackup', JSON.stringify(updatedData))

          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('rankedStatusUpdate', {
            detail: updatedData
          }))
        } catch (e) {
          console.warn('Failed to update ranked status:', e)
        }

        // Additional sync to server to prevent data loss
        try {
          await api.post('/api/ranked/sync-progress', {
            livesRemaining: data.livesRemaining,
            questionsCounted: data.questionsCounted,
            pointsToday: data.pointsToday,
            currentBook: data.currentBook || 'Genesis',
            currentBookIndex: data.currentBookIndex || 0,
            isPostCycle: data.isPostCycle || false,
            currentDifficulty: data.currentDifficulty || 'all'
          })
          console.log('=== SYNCED TO SERVER ===')
        } catch (syncError) {
          // non-critical — progress already persisted on server
        }
      } else if (settings?.sessionId) {
        const res = await api.post(`/api/sessions/${settings.sessionId}/answer`, {
          questionId: currentQuestion.id,
          answer: answerIndex,
          clientElapsedMs: (30 - timeLeft) * 1000
        })
        const data = res.data
        isCorrect = !!data.isCorrect
      } else {
        // No server session in practice mode; local validation
        isCorrect = answerIndex === currentQuestion.correctAnswer[0]
      }
    } catch (e) {
      console.error('submit answer failed', e)
      // Fallback local check if API fails
      isCorrect = answerIndex === currentQuestion.correctAnswer[0]
    }

    // Enhanced scoring system
    let questionScore = 0
    if (isCorrect) {
      // Base score by difficulty
      const baseScore = currentQuestion.difficulty === 'easy' ? 10 :
        currentQuestion.difficulty === 'medium' ? 20 : 30

      // Time bonus (more points for faster answers)
      const timeBonus = Math.floor(timeLeft / 2) // Up to 15 points for quick answers

      // Perfect time bonus (answered in first 5 seconds)
      const perfectBonus = timeLeft >= 25 ? 5 : 0

      // Difficulty multiplier
      const difficultyMultiplier = currentQuestion.difficulty === 'hard' ? 1.5 :
        currentQuestion.difficulty === 'medium' ? 1.2 : 1

      questionScore = Math.floor((baseScore + timeBonus + perfectBonus) * difficultyMultiplier)

      setScore(score + questionScore)
      setScoreBump(true)
      setTimeout(() => setScoreBump(false), 250)
      playCorrectSound()
      setCorrectAnswers(correctAnswers + 1)
    } else {
      playWrongSound()
    }

    // Update user answers and question scores
    const newUserAnswers = [...userAnswers]
    newUserAnswers[currentQuestionIndex] = answerIndex
    setUserAnswers(newUserAnswers)

    const newQuestionScores = [...questionScores]
    newQuestionScores[currentQuestionIndex] = questionScore
    setQuestionScores(newQuestionScores)

    // Update quiz stats
    setQuizStats(prev => {
      const newStats = { ...prev }

      // Update difficulty breakdown
      const difficulty = currentQuestion.difficulty as 'easy' | 'medium' | 'hard'
      newStats.difficultyBreakdown[difficulty].total += 1
      if (isCorrect) {
        newStats.difficultyBreakdown[difficulty].correct += 1
        newStats.difficultyBreakdown[difficulty].score += questionScore
      }

      // Update time tracking
      newStats.timePerQuestion.push(timeTaken)
      newStats.totalTime = Date.now() - quizStartTime
      newStats.averageTime = newStats.timePerQuestion.reduce((a, b) => a + b, 0) / newStats.timePerQuestion.length

      // Update overall stats
      newStats.totalScore = score + questionScore
      newStats.correctAnswers = correctAnswers + (isCorrect ? 1 : 0)
      newStats.accuracy = (newStats.correctAnswers / newStats.totalQuestions) * 100

      // Update arrays
      newStats.userAnswers = newUserAnswers
      newStats.questionScores = newQuestionScores

      return newStats
    })

    // Update optimistic ranked snapshot AFTER computing questionScore for accurate points
    if (settings?.mode === 'ranked' && settings?.sessionId) {
      try {
        const today = new Date().toISOString().slice(0, 10)
        if (rankedResponse) {
          const finalSnap = {
            date: today,
            livesRemaining: rankedResponse.livesRemaining || 30,
            questionsCounted: rankedResponse.questionsCounted || 0,
            pointsToday: rankedResponse.pointsToday || 0,
            cap: 500,
            dailyLives: 30
          }
          localStorage.setItem('rankedSnapshot', JSON.stringify(finalSnap))
          window.dispatchEvent(new CustomEvent('rankedStatusUpdate', { detail: finalSnap }))
        }
      } catch (_) { /* non-critical */ }
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      // Quiz completed - finalize stats
      setQuizStats(prev => ({
        ...prev,
        totalTime: Date.now() - quizStartTime,
        userAnswers: userAnswers,
        questionScores: questionScores,
        questions: questions // Ensure questions are included
      }))
      console.log('Setting isQuizCompleted to true');
      setIsQuizCompleted(true)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setTimeLeft(30)
      setQuestionStartTime(Date.now())
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-red-400'
      default: return 'text-blue-400'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Dễ'
      case 'medium': return 'Trung bình'
      case 'hard': return 'Khó'
      default: return 'Tất cả'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="page-card p-8 text-center max-w-xs w-full">
          <div className="text-xl font-bold mb-4">Đang tải câu hỏi...</div>
          <div className="animate-spin w-8 h-8 border-4 border-[#4bbf9f] border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  if (isQuizCompleted) {
    const answeredCount = userAnswers.filter(a => a !== null && a !== undefined).length
    const ensuredTotalTime = quizStats.totalTime || (Date.now() - quizStartTime)
    const ensuredAvgTime = quizStats.timePerQuestion.length > 0
      ? quizStats.timePerQuestion.reduce((a, b) => a + b, 0) / quizStats.timePerQuestion.length
      : (answeredCount > 0 ? ensuredTotalTime / answeredCount / 1000 : 0)
    const finalizedStats = {
      ...quizStats,
      totalScore: score,
      correctAnswers: correctAnswers,
      totalQuestions: questions.length,
      accuracy: questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0,
      totalTime: ensuredTotalTime,
      averageTime: ensuredAvgTime,
      questions,
      userAnswers,
      questionScores,
    }
    return (
      <QuizResults
        stats={finalizedStats}
        onPlayAgain={() => {
          setCurrentQuestionIndex(0)
          setSelectedAnswer(null)
          setShowResult(false)
          setScore(0)
          setCorrectAnswers(0)
          setTimeLeft(30)
          setIsQuizCompleted(false)
          setUserAnswers(new Array(questions.length).fill(null))
          setQuestionScores(new Array(questions.length).fill(0))
          setQuizStartTime(Date.now())
          setQuestionStartTime(Date.now())
          setQuizStats(prev => ({
            ...prev,
            totalScore: 0,
            correctAnswers: 0,
            accuracy: 0,
            averageTime: 0,
            totalTime: 0,
            difficultyBreakdown: {
              easy: { correct: 0, total: 0, score: 0 },
              medium: { correct: 0, total: 0, score: 0 },
              hard: { correct: 0, total: 0, score: 0 }
            },
            timePerQuestion: [],
            userAnswers: new Array(questions.length).fill(null),
            questionScores: new Array(questions.length).fill(0)
          }))
        }}
        onBackToHome={() => navigate(location.state?.isRanked ? '/ranked' : '/')}
        // Pass ranked mode info
        isRanked={location.state?.isRanked || false}
        sessionId={location.state?.sessionId}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="page-card p-8 text-center max-w-sm w-full">
          <div className="text-2xl font-bold mb-4">Không có câu hỏi</div>
          <button
            onClick={() => navigate('/practice')}
            className="btn-primary"
          >
            Quay Lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-bg pb-12">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-end mb-6">
          <div className="text-[#f5f0e0] opacity-90 font-bold text-lg">
            Câu {currentQuestionIndex + 1}/{questions.length}
          </div>
          <div className={`text-[#4bbf9f] bg-[#f5f0e4] px-6 py-2 rounded-full shadow-lg font-black text-2xl transition-transform ${scoreBump ? 'scale-110' : 'scale-100'}`}>
            ĐIỂM: {score}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-3 mb-8 overflow-hidden backdrop-blur-sm border border-white/5">
          <div
            className="bg-gradient-to-r from-[#4bbf9f] to-[#2e9e7a] h-full progress-animated shadow-[0_0_15px_rgba(75,191,159,0.3)]"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Timer */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center relative">
            <svg width="80" height="80">
              <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
              <circle
                cx="40" cy="40" r="34"
                stroke={timeLeft <= 5 ? '#e05c5c' : '#4bbf9f'}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={(1 - (timeLeft / 30)) * 2 * Math.PI * 34}
                className="transition-all duration-1000"
              />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-3xl font-black ${timeLeft <= 5 ? 'text-[#e05c5c] animate-pulse' : 'text-[#f5f0e0]'}`}>
              {timeLeft}
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="container mx-auto px-4">
        <div className="page-card p-8 md:p-12 max-w-4xl mx-auto">
          {/* Question Header */}
          <div className="mb-8 flex flex-wrap gap-3 items-center">
            <span className="bg-[#eeeae0] text-[#7a6a5a] px-3 py-1 rounded-md text-sm font-bold">
              {currentQuestion.book}
            </span>
            <span className="bg-[#eeeae0] text-[#7a6a5a] px-3 py-1 rounded-md text-sm font-bold">
              Chương {currentQuestion.chapter}
            </span>
            <span className={
              currentQuestion.difficulty === 'easy' ? 'badge-easy' :
                currentQuestion.difficulty === 'hard' ? 'badge-hard' : 'badge-medium'
            }>
              {getDifficultyText(currentQuestion.difficulty)}
            </span>
          </div>

          {/* Question */}
          <div className="text-[#4a3f35] text-2xl md:text-3xl font-bold mb-10 leading-tight parchment-serif">
            {currentQuestion.content}
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = "answer-btn min-h-[80px]"

              if (showResult) {
                if (index === currentQuestion.correctAnswer[0]) {
                  buttonClass = "answer-btn answer-btn-correct min-h-[80px]"
                } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer[0]) {
                  buttonClass = "answer-btn answer-btn-wrong min-h-[80px]"
                } else {
                  buttonClass = "answer-btn opacity-60 min-h-[80px]"
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <div className="flex items-start">
                    <span className="font-black mr-3 text-[#4bbf9f]">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span>{option}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Result Display */}
          {showResult && (
            <div className={`p-6 rounded-2xl mb-8 border-2 ${selectedAnswer === currentQuestion.correctAnswer[0]
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                {selectedAnswer === currentQuestion.correctAnswer[0] ? (
                  <span className="text-2xl">✅</span>
                ) : (
                  <span className="text-2xl">❌</span>
                )}
                <span className={`text-xl font-bold ${selectedAnswer === currentQuestion.correctAnswer[0] ? 'text-green-700' : 'text-red-700'
                  }`}>
                  {selectedAnswer === currentQuestion.correctAnswer[0] ? 'Đúng rồi!' : 'Sai rồi!'}
                </span>
              </div>

              {selectedAnswer === currentQuestion.correctAnswer[0] && (
                <div className="mb-4">
                  <div className="text-[#4bbf9f] font-bold text-lg">
                    +{Math.floor(((currentQuestion.difficulty === 'easy' ? 10 :
                      currentQuestion.difficulty === 'medium' ? 20 : 30) +
                      Math.floor(timeLeft / 2) + (timeLeft >= 25 ? 5 : 0)) *
                      (currentQuestion.difficulty === 'hard' ? 1.5 :
                        currentQuestion.difficulty === 'medium' ? 1.2 : 1))} điểm
                  </div>
                </div>
              )}

              {settings?.showExplanation && (
                <div className="text-[#7a6a5a] text-sm leading-relaxed italic border-t border-black/5 pt-4">
                  <strong>Giải thích:</strong> {currentQuestion.explanation}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center bg-[#fdfaf3] p-4 rounded-xl border border-[#eeeae0]">
            <button
              onClick={() => {
                if (confirm('Bạn có chắc muốn kết thúc bài làm tại đây? Tiến trình hiện tại sẽ không được lưu.')) {
                  navigate('/practice')
                }
              }}
              className="text-[#7a6a5a] font-bold px-4 py-2 hover:bg-[#eeeae0] rounded-lg transition-all"
            >
              ⏹️ Thoát
            </button>

            {showResult && (
              <button
                onClick={nextQuestion}
                className="btn-primary"
              >
                {currentQuestionIndex + 1 >= questions.length ? 'Xem Kết Quả' : 'Tiếp Theo →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quiz
