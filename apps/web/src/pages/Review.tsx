import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const Review: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation() as any
  const stats = location.state?.stats

  if (!stats) {
    return (
      <div className="min-h-screen neon-bg flex items-center justify-center p-4">
        <div className="neon-card p-8 text-center max-w-md">
          <div className="neon-text text-2xl mb-4">⚠️ Không có dữ liệu để xem lại</div>
          <button onClick={() => navigate('/practice')} className="neon-btn neon-btn-blue px-6 py-2">Về Luyện Tập</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen neon-bg p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="neon-text text-3xl mb-6 text-center">Xem Lại Câu Trả Lời</h1>
        <div className="space-y-6">
          {stats.questions.map((q: any, idx: number) => {
            const userAnswer = stats.userAnswers[idx]
            const isCorrect = userAnswer === q.correctAnswer[0]
            return (
              <div key={q.id} className="neon-card p-6">
                <div className="flex justify-between mb-2">
                  <div className="neon-blue">Câu {idx + 1} • {q.book} Chương {q.chapter}</div>
                  <div className={isCorrect ? 'neon-green' : 'neon-red'}>{isCorrect ? 'Đúng' : 'Sai'}</div>
                </div>
                <div className="neon-text mb-4">{q.content}</div>
                <ul className="space-y-2">
                  {q.options.map((opt: string, i: number) => (
                    <li key={i} className={`p-3 rounded ${i === q.correctAnswer[0] ? 'neon-border-green' : 'neon-border-gray'} ${i === userAnswer ? ' bg-gray-800 bg-opacity-50' : ''}`}>
                      <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </li>
                  ))}
                </ul>
                {q.explanation && (
                  <div className="mt-3 text-gray-300"><strong>Giải thích:</strong> {q.explanation}</div>
                )}
              </div>
            )
          })}
        </div>
        <div className="text-center mt-8">
          <button onClick={() => navigate('/')} className="neon-btn neon-btn-blue px-8 py-3">🏠 Về Trang Chủ</button>
        </div>
      </div>
    </div>
  )
}

export default Review


