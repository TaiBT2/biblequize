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

const Quiz: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const settings = location.state as any

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
    } catch {}
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
        const res = await api.get(`/sessions/${settings.sessionId}/review`)
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
        // Ranked mode: submit to ranked progress endpoint
        console.log('=== FRONTEND: Making API call ===')
        console.log('URL:', `/api/ranked/sessions/${settings.sessionId}/answer`)
        console.log('Payload:', {
          questionId: currentQuestion.id,
          answer: answerIndex,
          clientElapsedMs: (30 - timeLeft) * 1000,
          isCorrect: answerIndex === currentQuestion.correctAnswer[0]
        })
        
        const res = await api.post(`/api/ranked/sessions/${settings.sessionId}/answer`, {
          questionId: currentQuestion.id,
          answer: answerIndex,
          clientElapsedMs: (30 - timeLeft) * 1000,
          isCorrect: answerIndex === currentQuestion.correctAnswer[0]
        })
        
        console.log('=== FRONTEND: API Response ===')
        console.log('Response:', res.data)
        console.log('questionsCounted in response:', res.data?.questionsCounted)
        console.log('pointsToday in response:', res.data?.pointsToday)
        console.log('livesRemaining in response:', res.data?.livesRemaining)
        
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
          
          // Update all localStorage keys with the same data
          localStorage.setItem('rankedSnapshot', JSON.stringify(updatedData))
          localStorage.setItem('rankedProgress', JSON.stringify(updatedData))
          localStorage.setItem('rankedStatus', JSON.stringify(updatedData))
          
          // Create backup for recovery in case of localStorage clear
          localStorage.setItem('sessionBackup', JSON.stringify(updatedData))
          
          console.log('=== UPDATING LOCALSTORAGE ===')
          console.log('Updated data:', updatedData)
          console.log('questionsCounted:', data.questionsCounted)
          
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
          console.warn('Failed to sync progress to server:', syncError)
        }
      } else if (settings?.sessionId) {
        const res = await api.post(`/sessions/${settings.sessionId}/answer`, {
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
        const today = new Date().toISOString().slice(0,10)
        
        // Always use server response if available
        if (rankedResponse) {
          const finalSnap = {
            date: today,
            livesRemaining: rankedResponse.livesRemaining || 30,
            questionsCounted: rankedResponse.questionsCounted || 0,
            pointsToday: rankedResponse.pointsToday || 0,
            cap: 500,
            dailyLives: 30
          }
          console.log('[RANKED] Using server response:', finalSnap)
          localStorage.setItem('rankedSnapshot', JSON.stringify(finalSnap))
          
          // Dispatch update event for real-time UI updates
          window.dispatchEvent(new CustomEvent('rankedStatusUpdate', { 
            detail: finalSnap 
          }))
        }
      } catch (e) {
        console.warn('Failed to update ranked snapshot:', e)
      }
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
      setTimeLeft(30) // Reset timer for next question
      setQuestionStartTime(Date.now()) // Reset question start time
      // Note: Removed duplicate ranked-status call to prevent double counting
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
      <div className="min-h-screen style={{ backgroundColor: '#0E0B1A' }} flex items-center justify-center">
        <div className="neon-card p-8 text-center">
          <div className="neon-text text-2xl mb-4">Đang tải câu hỏi...</div>
          <div className="animate-spin w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full mx-auto"></div>
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
      <div className="min-h-screen style={{ backgroundColor: '#0E0B1A' }} flex items-center justify-center">
        <div className="neon-card p-8 text-center">
          <div className="neon-text text-2xl mb-4">Không có câu hỏi</div>
          <button
            onClick={() => navigate('/practice')}
            className="neon-btn neon-btn-green px-6 py-2"
          >
            Quay Lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen style={{ backgroundColor: '#0E0B1A' }}">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="neon-text text-xl">
            Câu {currentQuestionIndex + 1}/{questions.length}
          </div>
          <div className={`neon-green text-xl font-bold transition-transform ${scoreBump ? 'scale-125' : 'scale-100'}`}>
            Điểm: {score}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-800/80 rounded-full h-2 mb-6 glow-cyan">
          <div 
            className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-fuchsia-400 h-2 rounded-full progress-animated"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center relative">
            <svg width="64" height="64" className="mr-3">
              <circle cx="32" cy="32" r="28" stroke="rgba(0,255,255,0.15)" strokeWidth="6" fill="none" />
              <circle
                cx="32" cy="32" r="28"
                stroke={timeLeft <= 5 ? 'rgba(239,68,68,0.85)' : 'rgba(34,211,238,0.85)'}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={(1 - (timeLeft / 30)) * 2 * Math.PI * 28}
              />
            </svg>
            <div className={`neon-text text-3xl font-bold ${timeLeft <= 5 ? 'neon-red animate-icon-shake' : 'neon-blue'} ${timeLeft <= 5 ? 'animate-number-glow' : ''} glow-cyan` }>
              {timeLeft}s
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="container mx-auto px-4">
          <div className="neon-card p-8 max-w-4xl mx-auto">
          {/* Question Header */}
            <div className="mb-6 space-y-2">
              <div className="text-gray-300 text-base">
                {currentQuestion.book}
              </div>
              <div className="text-gray-400 text-sm">Chương {currentQuestion.chapter}</div>
              <div className={`text-xs ${getDifficultyColor(currentQuestion.difficulty)}`}>
                Độ khó: {getDifficultyText(currentQuestion.difficulty)}
              </div>
            </div>

          {/* Question */}
          <div className="neon-text text-2xl font-bold mb-8 leading-relaxed">
            {currentQuestion.content}
          </div>

          {/* Answer Options */}
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = "neon-btn w-full p-4 text-left transition-all answer-hover rounded-xl shadow-[0_0_6px_rgba(255,255,255,0.06)] border-2"
              
              if (showResult) {
                if (index === currentQuestion.correctAnswer[0]) {
                  buttonClass += " neon-btn-green ring-2 ring-green-300 glow-green feedback-pulse" // Correct answer highlight
                } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer[0]) {
                  buttonClass += " neon-btn-red ring-2 ring-red-300 glow-red feedback-pulse" // Wrong answer
                } else {
                  buttonClass += " neon-btn-gray" // Other options
                }
              } else {
                buttonClass += selectedAnswer === index ? " neon-btn-blue" : " neon-btn-gray"
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <span className="font-bold mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              )
            })}
          </div>

          {/* Result Display */}
          {showResult && (
            <div className="neon-card p-6 mb-6">
              <div className="mb-4">
                {selectedAnswer === currentQuestion.correctAnswer[0] ? (
                  <div className="neon-green text-xl font-bold mb-2">
                    ✅ Đúng rồi!
                  </div>
                ) : (
                  <div className="neon-red text-xl font-bold mb-2">
                    ❌ Sai rồi!
                  </div>
                )}
              </div>
              
              {/* Score for this question */}
              {selectedAnswer === currentQuestion.correctAnswer[0] && (
                <div className="mb-4">
                  <div className="neon-blue text-lg">
                    +{Math.floor(((currentQuestion.difficulty === 'easy' ? 10 : 
                      currentQuestion.difficulty === 'medium' ? 20 : 30) + 
                      Math.floor(timeLeft / 2) + (timeLeft >= 25 ? 5 : 0)) * 
                      (currentQuestion.difficulty === 'hard' ? 1.5 : 
                       currentQuestion.difficulty === 'medium' ? 1.2 : 1))} điểm
                  </div>
                  {timeLeft >= 25 && (
                    <div className="neon-pink text-sm">
                      +5 điểm thưởng tốc độ!
                    </div>
                  )}
                </div>
              )}
              
              {settings.showExplanation && (
                <div className="neon-text text-sm leading-relaxed">
                  <strong>Giải thích:</strong> {currentQuestion.explanation}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => {
                if (confirm('Bạn có chắc muốn kết thúc bài làm tại đây? Tiến trình hiện tại sẽ không được lưu.')) {
                  navigate('/practice')
                }
              }}
              className="neon-btn neon-btn-gray px-6 py-2 rounded-xl"
            >
              ⏹️ Kết thúc
            </button>
            
            {showResult && (
              <button
                onClick={nextQuestion}
                className="neon-btn neon-btn-green px-6 py-2"
              >
                {currentQuestionIndex + 1 >= questions.length ? 'Kết Thúc' : 'Câu Tiếp →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quiz
