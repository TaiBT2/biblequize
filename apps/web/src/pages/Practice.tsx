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
    <div className="min-h-screen practice-bg py-8">
      {/* Header */}
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 relative z-10">
          <h1 className="practice-title">LUYỆN TẬP</h1>
          <p className="practice-subtitle mt-2">Tùy chỉnh bài luyện tập của bạn và bắt đầu ngay</p>
        </div>

        {/* Settings Panel */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (!isLoading && !isBooksLoading) startQuiz() }}
          className="practice-book-card p-6 md:p-12 max-w-4xl mx-auto"
          aria-label="Thiết lập luyện tập"
        >
          {/* Error banner */}
          {errorMsg && (
            <div className="mb-8 flex flex-col items-center justify-center cute-bird-error">
              <div className="text-4xl mb-2 hover:animate-icon-wiggle cursor-default transition-transform" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>🐦‍⬛</div>
              <div className="bg-white/10 px-6 py-3 rounded-2xl border-2 border-red-500/50 text-red-400 font-bold shadow-lg relative backdrop-blur-md">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 border-t-2 border-l-2 border-red-500/50 rotate-45"></div>
                {errorMsg}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 mb-10">
            {/* Left Column: Primary filters */}
            <div className="space-y-10">
              {/* Box 1: Chọn sách */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="practice-label">
                    <span className="text-2xl drop-shadow-sm">📜</span> Chọn sách
                  </label>
                  <span className="text-[#00FFFF] font-bold text-sm bg-[#00FFFF]/10 px-3 py-1 rounded-full border border-[#00FFFF]/30 max-h-8 flex items-center shadow-sm">
                    {filteredBooks.length} / {books.length} sách
                  </span>
                </div>
                <div className="relative z-[100]">
                  <SearchableSelect
                    options={books.map(b => ({ value: b.name, label: `${b.nameVi} (${b.name})` }))}
                    value={selectedBook}
                    onChange={setSelectedBook}
                    placeholder="Tìm kiếm sách..."
                    allLabel="Tất cả các sách"
                  />
                </div>
                <p className="text-sm text-[#00FFFF]/70 mt-3 italic font-medium">💡 Để trống để lấy ngẫu nhiên từ tất cả các sách.</p>
              </div>

              {/* Box 2: Question Count */}
              <div>
                <label className="practice-label mb-3">
                  <span className="text-2xl drop-shadow-sm">🧮</span> Số câu hỏi
                </label>
                <div className="flex flex-wrap gap-4">
                  {[5, 10, 20, 50].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`px-5 py-2 text-lg font-bold practice-option-btn ${questionCount === num ? 'selected' : ''}`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Secondary options */}
            <div className="space-y-10 mt-1 md:mt-0">
              {/* Difficulty */}
              <div>
                <label className="practice-label mb-3">
                  <span className="text-2xl drop-shadow-sm">✨</span> Độ khó
                </label>
                <div className="flex flex-wrap gap-4">
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
                      className={`px-5 py-2 text-lg font-bold practice-option-btn ${selectedDifficulty === d.key ? 'selected' : ''}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Explanation */}
              <div>
                <label className="practice-label mb-3">
                  <span className="text-2xl drop-shadow-sm">💡</span> Hiển thị giải thích
                </label>
                <div
                  className="inline-flex items-center space-x-3 p-3 px-5 rounded-2xl cursor-pointer transition-all bg-[#f8f9fa] hover:bg-[#f1f3f5] text-[#4a3f35] w-full border border-transparent hover:border-[#e2e8f0]"
                  onClick={() => setShowExplanation(!showExplanation)}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shadow-sm ${showExplanation ? 'bg-[#4bbf9f] border-[#4bbf9f]' : 'bg-white border-[#cbd5e1]'}`}>
                    {showExplanation && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <label className="text-base font-bold font-['Nunito'] cursor-pointer select-none">
                    Hiển thị giải thích sau mỗi câu
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="pt-12 mt-6 flex flex-col items-center space-y-6 relative">
            <div className="text-center group relative z-10 w-full flex justify-center">
              <button
                type="submit"
                disabled={isLoading || isBooksLoading}
                className="practice-start-btn disabled:opacity-50 disabled:cursor-not-allowed group/btn"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {isLoading || isBooksLoading ? 'ĐANG TẠO PHIÊN...' : 'BẮT ĐẦU LUYỆN TẬP'}
                  {!isLoading && !isBooksLoading && <span className="text-2xl group-hover/btn:translate-x-3 group-hover/btn:-translate-y-2 group-hover/btn:scale-110 transition-transform duration-300" style={{ transform: 'rotate(15deg)' }}>🚀</span>}
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* Back Button */}
        <div className="text-center mt-12 mb-8">
          <Link
            to="/"
            className="practice-back-btn px-6 py-3 inline-flex items-center gap-2 font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            🧭 QUAY LẠI TRANG CHỦ
          </Link>
        </div>
      </div>
    </div>
  )
}