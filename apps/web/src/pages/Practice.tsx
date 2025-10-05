import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'

interface Book {
  id: string
  name: string
  nameVi: string
  testament: string
  orderIndex: number
}

export default function Practice() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [questionCount, setQuestionCount] = useState(10)
  const [showExplanation, setShowExplanation] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await api.get('/api/books')
        setBooks(response.data)
      } catch (error) {
        console.error('Error fetching books:', error)
        // Fallback to mock data
        setBooks([
          { id: '1', name: 'Genesis', nameVi: 'Sáng Thế Ký', testament: 'OLD', orderIndex: 1 },
          { id: '2', name: 'Exodus', nameVi: 'Xuất Ê-díp-tô Ký', testament: 'OLD', orderIndex: 2 },
          { id: '3', name: 'Matthew', nameVi: 'Ma-thi-ơ', testament: 'NEW', orderIndex: 40 },
          { id: '4', name: 'John', nameVi: 'Giăng', testament: 'NEW', orderIndex: 43 }
        ])
      }
    }
    
    fetchBooks()
  }, [])

  const startQuiz = async () => {
    if (!selectedBook) {
      alert('Vui lòng chọn sách')
      return
    }
    try {
      setIsLoading(true)
      const res = await api.post('/sessions', {
        mode: 'practice',
        config: {
          book: selectedBook,
          difficulty: selectedDifficulty,
          questionCount: questionCount,
          showExplanationOnSubmit: showExplanation
        }
      })
      const { sessionId, questions } = res.data
      navigate('/quiz', {
        state: {
          sessionId,
          questions,
          book: selectedBook,
          difficulty: selectedDifficulty,
          questionCount: questionCount,
          showExplanation: showExplanation
        }
      })
    } catch (e) {
      console.error(e)
      alert('Không tạo được phiên luyện tập. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0E0B1A' }}>
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="neon-text text-4xl font-bold mb-4">LUYỆN TẬP</h1>
          <p className="text-gray-300 text-lg">Chọn cài đặt và bắt đầu luyện tập</p>
        </div>

        {/* Settings Panel */}
        <div className="neon-card p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Book Selection */}
              <div>
                <label className="neon-blue text-lg font-semibold block mb-3">
                  Chọn sách
                </label>
                <select
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  className="neon-input w-full p-3 bg-gray-800 border border-blue-400 rounded-lg focus:border-blue-300 focus:outline-none"
                >
                  <option value="">-- Chọn sách --</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.name}>
                      {book.nameVi} ({book.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Count */}
              <div>
                <label className="neon-orange text-lg font-semibold block mb-3">
                  Số câu hỏi
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="neon-input w-full p-3 bg-gray-800 border border-orange-400 rounded-lg focus:border-orange-300 focus:outline-none"
                >
                  <option value={5}>5 câu</option>
                  <option value={10}>10 câu</option>
                  <option value={20}>20 câu</option>
                  <option value={50}>50 câu</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Difficulty */}
              <div>
                <label className="neon-green text-lg font-semibold block mb-3">
                  Độ khó
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="neon-input w-full p-3 bg-gray-800 border border-green-400 rounded-lg focus:border-green-300 focus:outline-none"
                >
                  <option value="all">Tất cả</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>

              {/* Show Explanation */}
              <div>
                <label className="neon-pink text-lg font-semibold block mb-3">
                  Hiển thị giải thích
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="showExplanation"
                    checked={showExplanation}
                    onChange={(e) => setShowExplanation(e.target.checked)}
                    className="w-5 h-5 text-pink-400 bg-gray-800 border-pink-400 rounded focus:ring-pink-300"
                  />
                  <label htmlFor="showExplanation" className="text-gray-300">
                    Hiển thị giải thích sau mỗi câu
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center mt-8">
            <button
              onClick={startQuiz}
              disabled={isLoading}
              className="neon-btn neon-btn-green px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'ĐANG TẢI...' : 'BẮT ĐẦU LUYỆN TẬP'}
            </button>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="neon-btn neon-btn-green px-6 py-2"
          >
            ← QUAY LẠI TRANG CHỦ
          </Link>
        </div>
      </div>
    </div>
  )
}