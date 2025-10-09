import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useQuery } from '@tanstack/react-query'
import SearchableSelect from '../components/ui/SearchableSelect'

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
  const [bookSearch, setBookSearch] = useState('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const filteredBooks = books.filter(b => (b.name + ' ' + b.nameVi).toLowerCase().includes(bookSearch.toLowerCase()))

  const { data: booksData, isLoading: isBooksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const response = await api.get('/api/books')
      return response.data as Book[]
    }
  })

  useEffect(() => {
    if (booksData) setBooks(booksData)
  }, [booksData])

  const startQuiz = async () => {
    try {
      setIsLoading(true)
      setErrorMsg('')
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
      setErrorMsg('Không tạo được phiên luyện tập. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen neon-bg">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="neon-text text-4xl font-bold mb-3">LUYỆN TẬP</h1>
          <p className="text-gray-300 text-base">Tùy chỉnh bài luyện tập của bạn và bắt đầu ngay</p>
        </div>

        {/* Settings Panel */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (!isLoading && !isBooksLoading) startQuiz() }}
          className="neon-card p-8 max-w-4xl mx-auto"
          aria-label="Thiết lập luyện tập"
        >
          {/* Error banner */}
          {errorMsg && (
            <div className="mb-6 rounded-lg border border-red-400 bg-red-900/30 px-4 py-3 text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Column: Primary filters */}
            <div className="space-y-10">
              {/* Book Selection */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <label className="text-lg font-semibold block" style={{ color: '#00FFFF', textShadow: '0 0 8px rgba(0,255,255,0.5)' }}>
                    <span className="mr-2">📖</span>Chọn sách
                  </label>
                  <span className="text-gray-400 text-xs">{filteredBooks.length} / {books.length} sách</span>
                </div>
                <SearchableSelect
                  options={books.map(b => ({ value: b.name, label: `${b.nameVi} (${b.name})` }))}
                  value={selectedBook}
                  onChange={setSelectedBook}
                  placeholder="Tìm kiếm sách..."
                  allLabel="Tất cả các sách"
                />
                <p className="text-xs text-gray-400 mt-2">Để trống để lấy ngẫu nhiên từ tất cả các sách.</p>
              </div>

              {/* Question Count */}
              <div>
                <label className="text-lg font-semibold block mb-3" style={{ color: '#00FFFF', textShadow: '0 0 8px rgba(0,255,255,0.5)' }}>
                  <span className="mr-2">#️⃣</span>Số câu hỏi
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[5, 10, 20, 50].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`px-3 py-2 text-sm rounded border transition-all duration-150 ${
                        questionCount === num
                          ? 'border-cyan-400 text-black bg-cyan-300/90 shadow-[0_0_15px_rgba(34,211,238,0.35)] ring-1 ring-cyan-300'
                          : 'border-gray-600 text-gray-300 hover:border-cyan-400 hover:scale-[1.02]'
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Secondary options and action */}
            <div className="space-y-10 flex flex-col">
              {/* Difficulty */}
              <div>
                <label className="text-lg font-semibold block mb-3" style={{ color: '#00FFFF', textShadow: '0 0 8px rgba(0,255,255,0.5)' }}>
                  <span className="mr-2">📊</span>Độ khó
                </label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'easy', label: 'Dễ' },
                    { key: 'medium', label: 'Trung bình' },
                    { key: 'hard', label: 'Khó' }
                  ].map(d => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setSelectedDifficulty(d.key)}
                      className={`px-3 py-2 text-sm rounded border transition-all duration-150 ${
                        selectedDifficulty === d.key
                          ? 'border-cyan-400 text-black bg-cyan-300/90 shadow-[0_0_15px_rgba(34,211,238,0.35)] ring-1 ring-cyan-300'
                          : 'border-gray-600 text-gray-300 hover:border-cyan-400 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Explanation */}
              <div>
                <label className="text-lg font-semibold block mb-3" style={{ color: '#00FFFF', textShadow: '0 0 8px rgba(0,255,255,0.5)' }}>
                  <span className="mr-2">💡</span>Hiển thị giải thích
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="showExplanation"
                    checked={showExplanation}
                    onChange={(e) => setShowExplanation(e.target.checked)}
                    className="w-5 h-5 text-cyan-400 bg-gray-800 border-cyan-400 rounded focus:ring-cyan-300"
                  />
                  <label htmlFor="showExplanation" className="text-gray-300">
                    Hiển thị giải thích sau mỗi câu
                  </label>
                </div>
              </div>
              {/* Primary Action */}
              <div className="mt-auto pt-5 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Mẹo: Hãy thử độ khó "Khó" để nhận nhiều XP hơn!</p>
                  <button
                    type="submit"
                    disabled={isLoading || isBooksLoading}
                    className="px-8 text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-[#0E0B1A] flex items-center justify-center min-h-[72px]"
                    style={{ background: 'linear-gradient(135deg, #22c55e 0%, #86efac 100%)', boxShadow: '0 8px 25px rgba(34,197,94,0.35)' }}
                  >
                    {isLoading || isBooksLoading ? 'ĐANG TẠO PHIÊN...' : 'BẮT ĐẦU LUYỆN TẬP'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02]"
            style={{ border: '1px solid rgba(34,197,94,0.6)', color: '#86efac', boxShadow: '0 0 0 rgba(0,0,0,0)' }}
          >
            ← QUAY LẠI TRANG CHỦ
          </Link>
        </div>
      </div>
    </div>
  )
}