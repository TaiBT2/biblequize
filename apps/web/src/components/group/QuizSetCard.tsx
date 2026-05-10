import { useTranslation } from 'react-i18next';

// Backend quiz-set fields surfaced on the desktop list card. Mirrors
// MOCKUP_QUIZ_SET_V2_PROFESSIONAL_DESKTOP.html .quiz-card layout.
export interface QuizSetCardData {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
  coverImageUrl?: string | null;
  coverScripture?: string | null;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string | null;
  estimatedDurationMin?: number | null;
  suggestedMode?: string | null;
  playCount?: number;
  averageRating?: number | null;
  totalRatings?: number | null;
  publishStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SOFT_DELETED' | string | null;
  inUseByScheduled?: boolean;
}

interface Props {
  quizSet: QuizSetCardData;
  onClick: () => void;
}

// 6-color gradient palette, hashed by id (FNV-1a) so adjacent cards never
// share a tone. Matches QuizSetsPreviewCard palette so list ↔ preview tile
// pairs stay visually consistent for the same set.
const HERO_GRADIENTS = [
  'linear-gradient(135deg, #1a1d2e 0%, #4a3d2e 50%, #5e4a32 100%)', // gold-on-dark (default per mockup hero)
  'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',              // emerald
  'linear-gradient(135deg, #4ea8de 0%, #2d88be 100%)',              // sky
  'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',              // purple
  'linear-gradient(135deg, #ff7a59 0%, #cf5a39 100%)',              // orange
  'linear-gradient(135deg, #1a3d2e 0%, #2a4d3e 100%)',              // deep green
];

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickGradient(id: string): string {
  return HERO_GRADIENTS[hashId(id) % HERO_GRADIENTS.length];
}

function parseEmojiCover(coverUrl?: string | null): string | null {
  if (!coverUrl) return null;
  if (coverUrl.startsWith('emoji:')) return coverUrl.slice(6);
  return null;
}

const MODE_BADGE: Record<string, { label: string; bg: string; border: string; color: string }> = {
  SPEED_RACE:            { label: '⚡', bg: 'linear-gradient(135deg, rgba(232,168,50,0.15), rgba(232,168,50,0.03))', border: 'rgba(232,168,50,0.3)', color: '#e8a832' },
  GROUP_LIVE_SEQUENTIAL: { label: '📚', bg: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(74,222,128,0.03))', border: 'rgba(74,222,128,0.3)', color: '#4ade80' },
  SEQUENTIAL:            { label: '📚', bg: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(74,222,128,0.03))', border: 'rgba(74,222,128,0.3)', color: '#4ade80' },
  TEAM_VS_TEAM:          { label: '⚔️', bg: 'linear-gradient(135deg, rgba(78,168,222,0.15), rgba(78,168,222,0.03))', border: 'rgba(78,168,222,0.3)', color: '#4ea8de' },
  BATTLE_ROYALE:         { label: '💀', bg: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.03))', border: 'rgba(168,85,247,0.3)', color: '#a855f7' },
  SUDDEN_DEATH:          { label: '🥊', bg: 'linear-gradient(135deg, rgba(255,122,89,0.15), rgba(255,122,89,0.03))', border: 'rgba(255,122,89,0.3)', color: '#ff7a59' },
};

export default function QuizSetCard({ quizSet, onClick }: Props) {
  const { t } = useTranslation();
  const emoji = parseEmojiCover(quizSet.coverImageUrl) ?? '📖';
  const gradient = pickGradient(quizSet.id);
  const isDraft = quizSet.publishStatus === 'DRAFT';
  const showRating = quizSet.averageRating != null && (quizSet.averageRating ?? 0) > 0;
  const showPlay = quizSet.playCount != null && quizSet.playCount > 0;
  const suggestedKey = (quizSet.suggestedMode ?? '').toUpperCase();
  const suggested = MODE_BADGE[suggestedKey];

  const difficultyMeta: { label: string; color: string } | null = (() => {
    switch ((quizSet.difficulty ?? '').toUpperCase()) {
      case 'EASY':   return { label: t('groups.quizCard.difficultyEasy'), color: '#4ade80' };
      case 'MEDIUM': return { label: '⚡ ' + t('groups.quizCard.difficultyMedium'), color: '#e8a832' };
      case 'HARD':   return { label: '🔥 ' + t('groups.quizCard.difficultyHard'), color: '#ff7a59' };
      default: return null;
    }
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`quiz-set-card-${quizSet.id}`}
      className="text-left rounded-xl overflow-hidden border border-white/10 bg-[rgba(50,52,64,0.55)] backdrop-blur-md hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all"
    >
      {/* Hero */}
      <div className="h-28 relative" style={{ background: gradient }}>
        <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40 select-none">
          {emoji}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-2 left-2">
          {isDraft ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-on-surface/70 border border-white/10">
              {t('groups.quizCard.statusDraft')}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              ✓ {t('groups.quizCard.statusPublished')}
            </span>
          )}
        </div>
        {(showRating || showPlay) && (
          <div className="absolute top-2 right-2 flex gap-1">
            {showRating && (
              <span className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur text-secondary text-[10px] font-bold">
                ⭐ {(quizSet.averageRating ?? 0).toFixed(1)}
              </span>
            )}
            {showPlay && (
              <span className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur text-on-surface text-[10px] font-bold">
                ▶ {quizSet.playCount}x
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <h3 className="font-extrabold text-on-surface text-sm leading-tight line-clamp-2">{quizSet.name}</h3>
        {quizSet.coverScripture && (
          <div className="text-[10px] text-on-surface/55 mt-1 line-clamp-1">📍 {quizSet.coverScripture}</div>
        )}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-[10px] text-on-surface/55">
            {t('groups.questionsCount', { count: quizSet.questionCount })}
          </span>
          {difficultyMeta && (
            <>
              <span className="text-[10px] text-on-surface/30">·</span>
              <span className="text-[10px] font-semibold" style={{ color: difficultyMeta.color }}>
                {difficultyMeta.label}
              </span>
            </>
          )}
          {quizSet.estimatedDurationMin != null && quizSet.estimatedDurationMin > 0 && (
            <>
              <span className="text-[10px] text-on-surface/30">·</span>
              <span className="text-[10px] text-on-surface/55">
                {t('groups.quizCard.duration', { min: quizSet.estimatedDurationMin })}
              </span>
            </>
          )}
        </div>
        {(suggested || quizSet.inUseByScheduled) && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {suggested && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: suggested.bg, border: `1px solid ${suggested.border}`, color: suggested.color }}
                title={suggestedKey}
              >
                {suggested.label}
              </span>
            )}
            {quizSet.inUseByScheduled && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold border border-purple-400/40 bg-purple-500/15 text-purple-300">
                📅 {t('groups.quizCard.inUseScheduled')}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
