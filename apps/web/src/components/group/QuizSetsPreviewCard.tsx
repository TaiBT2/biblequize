import { useTranslation } from 'react-i18next';

export interface QuizSetPreview {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
  coverImageUrl?: string | null;
  playCount?: number;
  averageRating?: number | null;
}

interface Props {
  quizSets: QuizSetPreview[];
  onPlay: (id: string) => void;
  onViewAll: () => void;
  playingId?: string | null;
}

// Deterministic gradient palette so each quiz-set card stays visually
// stable across renders. Mirrors mockup `pickGradient` (gold/dark, green,
// dark green, orange, sky).
const GRADIENTS = [
  'linear-gradient(135deg, #1a1d2e 0%, #4a3d2e 100%)',
  'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
  'linear-gradient(135deg, #1a3d2e 0%, #2a4d3e 100%)',
  'linear-gradient(135deg, #ff7a59 0%, #cf5a39 100%)',
  'linear-gradient(135deg, #4ea8de 0%, #2d88be 100%)',
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickGradient(id: string): string {
  return GRADIENTS[hashId(id) % GRADIENTS.length];
}

// Cover image convention: backend stores either a URL ("https://...") or
// an emoji prefix ("emoji:📖"). Mockup-aligned cards use the emoji as the
// tile glyph. Real images render in the dedicated quiz-set list, not the
// preview tile (kept simple here).
function parseEmojiCover(coverUrl?: string | null): string | null {
  if (!coverUrl) return null;
  if (coverUrl.startsWith('emoji:')) return coverUrl.slice(6);
  return null;
}

export default function QuizSetsPreviewCard({ quizSets, onPlay, onViewAll, playingId }: Props) {
  const { t } = useTranslation();
  const top3 = quizSets.slice(0, 3);

  return (
    <section
      data-testid="group-quizsets-preview"
      className="bg-[rgba(50,52,64,0.55)] border border-white/10 rounded-xl p-4 backdrop-blur-md"
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
          {top3.map((qs) => {
            const emoji = parseEmojiCover(qs.coverImageUrl) ?? '📖';
            const gradient = pickGradient(qs.id);
            const showPlay = (qs.playCount ?? 0) > 0;
            const showRating = qs.averageRating != null && qs.averageRating > 0;
            return (
              <li
                key={qs.id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 shadow-inner"
                  style={{ background: gradient }}
                >
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-on-surface truncate">{qs.name}</div>
                  <div className="text-[10px] text-on-surface/55 flex items-center gap-1.5 flex-wrap">
                    <span>{t('groups.questionsCount', { count: qs.questionCount })}</span>
                    {showPlay && (
                      <>
                        <span className="text-on-surface/30">·</span>
                        <span>▶ {qs.playCount}x</span>
                      </>
                    )}
                    {showRating && (
                      <>
                        <span className="text-on-surface/30">·</span>
                        <span className="text-secondary">⭐ {(qs.averageRating ?? 0).toFixed(1)}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onPlay(qs.id)}
                  disabled={playingId === qs.id}
                  className="px-2.5 py-1 rounded-md bg-gradient-to-br from-secondary to-[#d4941f] text-on-secondary text-[10px] font-bold disabled:opacity-50 hover:brightness-110 transition-all whitespace-nowrap"
                >
                  {playingId === qs.id ? '...' : t('groups.play')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
