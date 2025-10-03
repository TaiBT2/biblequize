import React from 'react';

interface BookProgressProps {
  currentBook?: string;
  nextBook?: string;
  currentIndex?: number;
  totalBooks?: number;
  progressPercentage?: number;
  isCompleted?: boolean;
  questionsInCurrentBook?: number;
  correctAnswersInCurrentBook?: number;
}

const BookProgress: React.FC<BookProgressProps> = ({
  currentBook = "Genesis",
  nextBook = "Exodus", 
  currentIndex = 1,
  totalBooks = 66,
  progressPercentage = 0,
  isCompleted = false,
  questionsInCurrentBook = 0,
  correctAnswersInCurrentBook = 0
}) => {
  const accuracyRate = questionsInCurrentBook > 0 
    ? Math.round((correctAnswersInCurrentBook / questionsInCurrentBook) * 100)
    : 0;

  const neededForNext = Math.max(0, 50 - questionsInCurrentBook);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-purple-400 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-purple-300 neon-purple">
          📚 Tiến Độ Kinh Thánh
        </h3>
        {isCompleted && (
          <div className="bg-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold">
            🏆 Hoàn Thành!
          </div>
        )}
      </div>

      {/* Current Book */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Sách hiện tại</span>
          <span className="text-sm text-purple-300">
            {currentIndex}/{totalBooks}
          </span>
        </div>
        <div className="text-lg font-bold text-purple-300 neon-purple">
          {currentBook}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="bg-gray-700 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-3 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-right text-sm text-gray-400">
          {progressPercentage.toFixed(1)}% hoàn thành
        </div>
      </div>

      {/* Stats for Current Book */}
      {!isCompleted && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700 rounded p-3">
            <div className="text-xs text-gray-400 mb-1">Đã làm</div>
            <div className="text-lg font-bold text-blue-300">
              {questionsInCurrentBook}/50 câu
            </div>
            <div className="text-xs text-gray-500">
              Còn {neededForNext} câu → {nextBook}
            </div>
          </div>
          <div className="bg-gray-700 rounded p-3">
            <div className="text-xs text-gray-400 mb-1">Tỷ lệ đúng</div>
            <div className="text-lg font-bold text-green-300">
              {accuracyRate}%
            </div>
            <div className="text-xs text-gray-500">
              Đúng {correctAnswersInCurrentBook}/{questionsInCurrentBook}
            </div>
          </div>
        </div>
      )}

      {/* Post-Cycle Mode */}
      {isCompleted && (
        <div className="bg-yellow-900 border border-yellow-400 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-yellow-300 font-bold">🎯 Chế độ Sau Chu Kỳ</span>
          </div>
          <div className="text-yellow-200 text-sm">
            Bạn đã hoàn thành toàn bộ Kinh Thánh! Giờ sẽ là câu hỏi khó để thử thách kỹ năng.
          </div>
        </div>
      )}

      {/* Next Book Preview */}
      {!isCompleted && nextBook && (
        <div className="border border-purple-400 rounded p-3 bg-purple-900/20">
          <div className="text-sm text-purple-300 mb-1">📖 Sách tiếp theo</div>
          <div className="font-bold text-purple-200">{nextBook}</div>
        </div>
      )}
    </div>
  );
};

export default BookProgress;
