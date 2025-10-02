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
    try {
      if (settings?.sessionId) {
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
      setCorrectAnswers(correctAnswers + 1)
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
  }

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      // Quiz completed - finalize stats
      setQuizStats(prev => ({
        ...prev,
        totalTime: Date.now() - quizStartTime,
        userAnswers: userAnswers,
        questionScores: questionScores
      }))
      console.log('Setting isQuizCompleted to true');
      setIsQuizCompleted(true)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setTimeLeft(30) // Reset timer for next question
      setQuestionStartTime(Date.now()) // Reset question start time
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
      <div className="min-h-screen neon-bg flex items-center justify-center">
        <div className="neon-card p-8 text-center">
          <div className="neon-text text-2xl mb-4">Đang tải câu hỏi...</div>
          <div className="animate-spin w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  if (isQuizCompleted) {
    return (
      <QuizResults
        stats={quizStats}
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
        onBackToHome={() => navigate('/')}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center">
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
    <div className="min-h-screen neon-bg">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="neon-text text-xl">
            Câu {currentQuestionIndex + 1}/{questions.length}
          </div>
          <div className="neon-green text-xl font-bold">
            Điểm: {score}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
          <div 
            className="bg-gradient-to-r from-neon-blue to-neon-pink h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className={`neon-text text-3xl font-bold ${timeLeft <= 10 ? 'neon-red' : 'neon-blue'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="container mx-auto px-4">
        <div className="neon-card p-8 max-w-4xl mx-auto">
          {/* Question Header */}
          <div className="mb-6">
            <div className="neon-blue text-2xl font-bold mb-2">
              {currentQuestion.book}
            </div>
            <div className="text-gray-300 mb-2">
              Chương {currentQuestion.chapter}
            </div>
            <div className={`text-sm ${getDifficultyColor(currentQuestion.difficulty)}`}>
              Độ khó: {getDifficultyText(currentQuestion.difficulty)}
            </div>
          </div>

          {/* Question */}
          <div className="neon-text text-xl mb-8 leading-relaxed">
            {currentQuestion.content}
          </div>

          {/* Answer Options */}
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = "neon-btn w-full p-4 text-left"
              
              if (showResult) {
                if (index === currentQuestion.correctAnswer[0]) {
                  buttonClass += " neon-btn-green" // Correct answer
                } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer[0]) {
                  buttonClass += " neon-btn-red" // Wrong answer
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
              onClick={() => navigate('/practice')}
              className="neon-btn neon-btn-gray px-6 py-2"
            >
              ← Quay Lại
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
