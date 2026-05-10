import { useTranslation } from 'react-i18next';

export interface QuizSetPreview {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
}

interface Props {
  quizSets: QuizSetPreview[];
  onPlay: (id: string) => void;
  onViewAll: () => void;
  playingId?: string | null;
}

export default function QuizSetsPreviewCard({ quizSets, onPlay, onViewAll, playingId }: Props) {
  const { t } = useTranslation();
  const top3 = quizSets.slice(0, 3);

  return (
    <section
      data-testid="group-quizsets-preview"
      className="bg-[rgba(50,52,64,0.4)] border border-white/10 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-bold text-secondary uppercase tracking-wider">
          📚 {t('groups.quizSetsSection')} ({quizSets.length})
        </h2>
        {quizSets.length > 3 && (
          <button
            onClick={onViewAll}
            className="text-[10px] text-on-surface/55 hover:text-secondary transition-colors"
          >
            {t('groups.viewAll')} →
          </button>
        )}
      </div>
      {top3.length === 0 ? (
        <p className="text-[12px] text-on-surface/55 text-center py-4">
          {t('groups.noQuizSets')}
        </p>
      ) : (
        <ul className="space-y-2">
          {top3.map((qs) => (
            <li
              key={qs.id}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[rgba(232,168,50,0.15)] flex items-center justify-center text-base shrink-0">📖</div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-on-surface truncate">{qs.name}</div>
                <div className="text-[10px] text-on-surface/55">
                  {t('groups.questionsCount', { count: qs.questionCount })}
                </div>
              </div>
              <button
                onClick={() => onPlay(qs.id)}
                disabled={playingId === qs.id}
                className="px-2.5 py-1 rounded-md bg-secondary text-on-secondary text-[10px] font-bold disabled:opacity-50 hover:brightness-110 transition-all whitespace-nowrap"
              >
                {playingId === qs.id ? '...' : t('groups.play')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
