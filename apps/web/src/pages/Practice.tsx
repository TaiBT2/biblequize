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
      const res = await api.post('/api/sessions', {
        mode: 'practice',
        book: selectedBook,
        difficulty: selectedDifficulty,
        questionCount: questionCount,
        showExplanation: showExplanation
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
          className="neon-card p-6 md:p-10 max-w-3xl mx-auto shadow-2xl"
          aria-label="Thiết lập luyện tập"
        >
          {/* Error banner */}
          {errorMsg && (
            <div className="mb-8 rounded-lg border border-red-400 bg-red-900/30 px-4 py-3 text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-10">
            {/* Left Column: Primary filters */}
            <div className="space-y-8">
              {/* Book Selection */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
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
                <p className="text-xs text-gray-500 mt-2 italic">Để trống để lấy ngẫu nhiên từ tất cả các sách.</p>
              </div>

              {/* Question Count */}
              <div>
                <label className="text-lg font-semibold block mb-3" style={{ color: '#00FFFF', textShadow: '0 0 8px rgba(0,255,255,0.5)' }}>
                  <span className="mr-2">#️⃣</span>Số câu hỏi
                </label>
                <div className="flex flex-wrap gap-3">
                  {[5, 10, 20, 50].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${questionCount === num
                        ? 'border-cyan-400 text-black bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] ring-1 ring-cyan-300'
                        : 'border-gray-700 text-gray-400 bg-gray-800/50 hover:border-cyan-400/50 hover:text-gray-200'
                        }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Secondary options */}
            <div className="space-y-8">
              {/* Difficulty */}
              <div>
                <label className="text-lg font-semibold block mb-3" style={{ color: '#00FFFF', textShadow: '0 0 8px rgba(0,255,255,0.5)' }}>
                  <span className="mr-2">📊</span>Độ khó
                </label>
                <div className="flex flex-wrap gap-3">
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
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${selectedDifficulty === d.key
                        ? 'border-cyan-400 text-black bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] ring-1 ring-cyan-300'
                        : 'border-gray-700 text-gray-400 bg-gray-800/50 hover:border-cyan-400/50 hover:text-gray-200'
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
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => setShowExplanation(!showExplanation)}
                >
                  <input
                    type="checkbox"
                    id="showExplanation"
                    checked={showExplanation}
                    onChange={(e) => setShowExplanation(e.target.checked)}
                    className="w-5 h-5 text-cyan-500 bg-gray-900 border-gray-600 rounded focus:ring-cyan-400 focus:ring-offset-gray-900"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor="showExplanation" className="text-gray-300 cursor-pointer select-none">
                    Hiển thị giải thích sau mỗi câu
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="pt-8 border-t border-white/10 flex flex-col items-center space-y-6">
            <div className="text-center group">
              <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-medium tracking-wider mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                MẸO: THỬ ĐỘ KHÓ "KHÓ" ĐỂ NHẬN NHIỀU XP HƠN!
              </span>
              <button
                type="submit"
                disabled={isLoading || isBooksLoading}
                className="w-full sm:w-auto px-12 py-5 text-xl font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed text-[#0E0B1A] transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] shadow-2xl relative overflow-hidden group/btn"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)', boxShadow: '0 10px 30px -10px rgba(34,197,94,0.5)' }}
              >
                <span className="relative z-10">
                  {isLoading || isBooksLoading ? 'ĐANG TẠO PHIÊN...' : 'BẮT ĐẦU LUYỆN TẬP'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
              </button>
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