import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const accuracyRate = questionsInCurrentBook > 0
    ? Math.round((correctAnswersInCurrentBook / questionsInCurrentBook) * 100)
    : 0;

  const neededForNext = Math.max(0, 50 - questionsInCurrentBook);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-purple-400 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-purple-300 neon-purple">
          {t('components.bookProgress.title')}
        </h3>
        {isCompleted && (
          <div className="bg-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold">
            {t('components.bookProgress.completedBadge')}
          </div>
        )}
      </div>

      {/* Current Book */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">{t('components.bookProgress.currentBook')}</span>
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
        <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden mb-2 relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full transition-all duration-1000 relative"
            style={{
              width: `${progressPercentage}%`,
              boxShadow: '0 0 15px rgba(0, 255, 255, 0.6)'
            }}
          >
            {/* Glowing end effect */}
            <div className="absolute right-0 top-0 w-2 h-full bg-white opacity-80 rounded-r-full"></div>
            <div className="absolute right-0 top-0 w-1 h-full bg-white opacity-100 rounded-r-full"></div>
          </div>
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
        </div>
        <div className="text-right text-sm text-gray-400">
          {t('components.bookProgress.percentDone', { percent: progressPercentage.toFixed(1) })}
        </div>
      </div>

      {/* Stats for Current Book */}
      {!isCompleted && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700 rounded p-3">
            <div className="text-xs text-gray-400 mb-1">{t('components.bookProgress.questionsDone')}</div>
            <div className="text-lg font-bold text-blue-300">
              {t('components.bookProgress.questionCount', { current: questionsInCurrentBook, total: 50 })}
            </div>
            <div className="text-xs text-gray-500">
              {t('components.bookProgress.remainingUntilNext', { count: neededForNext, nextBook })}
            </div>
          </div>
          <div className="bg-gray-700 rounded p-3">
            <div className="text-xs text-gray-400 mb-1">{t('components.bookProgress.accuracyLabel')}</div>
            <div className="text-lg font-bold text-green-300">
              {accuracyRate}%
            </div>
            <div className="text-xs text-gray-500">
              {t('components.bookProgress.accuracyDetail', { correct: correctAnswersInCurrentBook, total: questionsInCurrentBook })}
            </div>
          </div>
        </div>
      )}

      {/* Post-Cycle Mode */}
      {isCompleted && (
        <div className="bg-yellow-900 border border-yellow-400 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-yellow-300 font-bold">{t('components.bookProgress.postCycleLabel')}</span>
          </div>
          <div className="text-yellow-200 text-sm">
            {t('components.bookProgress.postCycleDesc')}
          </div>
        </div>
      )}

      {/* Next Book Preview */}
      {!isCompleted && nextBook && (
        <div className="border border-purple-400 rounded p-3 bg-purple-900/20">
          <div className="text-sm text-purple-300 mb-1">{t('components.bookProgress.nextBookLabel')}</div>
          <div className="font-bold text-purple-200">{nextBook}</div>
        </div>
      )}
    </div>
  );
};

export default BookProgress;
