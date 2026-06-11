import type { PlayerScore, QuestionStartData, RoomQuestion, ScoreUpdateData } from '../../types/room';

// Shared render constants for the quiz shell + mode views.
export const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];
export const FILL_STYLE = { fontVariationSettings: "'FILL' 1" } as const;

/**
 * FMR-4 — core (mode-agnostic) game state for the multiplayer quiz page.
 *
 * Pure reducer: STOMP side effects (sounds, haptics, feed, reveal-stats refs,
 * navigation) stay in the page-level dispatcher; per-mode state lives in the
 * FMR-3 hooks. Invariants preserved:
 *   - anti-spoiler: `correctIndex` only set by ROUND_END / QUESTION_REVEALED;
 *   - score is server-authoritative: `scores` only ever mirrors payloads.
 */
export interface CoreGameState {
  questionIndex: number;
  totalQuestions: number;
  timeLimit: number;
  question: RoomQuestion | null;
  scores: PlayerScore[];
  selected: number | null;
  correctIndex: number | null;
  submitting: boolean;
  showPodium: boolean;
  finalResults: PlayerScore[];
}

export const initialCoreGameState: CoreGameState = {
  questionIndex: 0,
  totalQuestions: 0,
  timeLimit: 30,
  question: null,
  scores: [],
  selected: null,
  correctIndex: null,
  submitting: false,
  showPodium: false,
  finalResults: [],
};

export type CoreGameAction =
  /** New round broadcast — replaces the question and clears round-local state. */
  | { type: 'QUESTION_START'; data: QuestionStartData }
  /** Round resolved — reveal + scoreboard (already sorted by the dispatcher). */
  | { type: 'ROUND_END'; correctIndex: number; scores: PlayerScore[] }
  /** Sequential reveal — same correctIndex contract; leaderboard optional. */
  | { type: 'QUESTION_REVEALED'; correctIndex: number; leaderboard?: PlayerScore[] }
  | { type: 'SCORE_UPDATE'; data: ScoreUpdateData }
  | { type: 'LEADERBOARD_UPDATE'; data: PlayerScore[] }
  /** Optimistic local submit (server confirmation arrives via ROUND_END). */
  | { type: 'SELECT_ANSWER'; index: number }
  /** 500ms after a successful send — re-enable interactions guard. */
  | { type: 'SUBMIT_SETTLED' }
  /** WS was down when submitting — revert optimistic state so retry works. */
  | { type: 'REVERT_SUBMIT' }
  | { type: 'SHOW_PODIUM'; results: PlayerScore[] }
  /** TvT end — results without the podium overlay (TeamWinScreen instead). */
  | { type: 'SET_FINAL_RESULTS'; results: PlayerScore[] }
  /** Mount/reconnect rehydrate of an in-flight question — does NOT clear the
   *  player's current selection (same question may still be running). */
  | { type: 'SEED_QUESTION'; data: QuestionStartData }
  /** Mount rehydrate of an already-ENDED room — straight to the podium. */
  | { type: 'SEED_ENDED'; results: PlayerScore[]; totalQuestions?: number };

export function coreGameReducer(state: CoreGameState, action: CoreGameAction): CoreGameState {
  switch (action.type) {
    case 'QUESTION_START': {
      const d = action.data;
      return {
        ...state,
        questionIndex: d.questionIndex,
        totalQuestions: d.totalQuestions,
        question: d.question,
        timeLimit: d.timeLimit,
        selected: null,
        correctIndex: null,
        submitting: false,
      };
    }
    case 'ROUND_END':
      return { ...state, correctIndex: action.correctIndex, scores: action.scores };
    case 'QUESTION_REVEALED':
      return {
        ...state,
        correctIndex: action.correctIndex,
        scores: action.leaderboard
          ? action.leaderboard.slice().sort((a, b) => b.score - a.score)
          : state.scores,
      };
    case 'SCORE_UPDATE': {
      const d = action.data;
      const upd = [...state.scores];
      const i = upd.findIndex(x => x.playerId === d.playerId);
      if (i >= 0) upd[i] = { ...upd[i], ...d }; else upd.push(d);
      return { ...state, scores: upd.sort((a, b) => b.score - a.score) };
    }
    case 'LEADERBOARD_UPDATE':
      return { ...state, scores: action.data.slice().sort((a, b) => b.score - a.score) };
    case 'SELECT_ANSWER':
      return { ...state, selected: action.index, submitting: true };
    case 'SUBMIT_SETTLED':
      return { ...state, submitting: false };
    case 'REVERT_SUBMIT':
      return { ...state, selected: null, submitting: false };
    case 'SHOW_PODIUM':
      return { ...state, finalResults: action.results, showPodium: true };
    case 'SET_FINAL_RESULTS':
      return { ...state, finalResults: action.results };
    case 'SEED_QUESTION': {
      const d = action.data;
      return {
        ...state,
        questionIndex: d.questionIndex,
        totalQuestions: d.totalQuestions,
        question: d.question,
        timeLimit: d.timeLimit,
      };
    }
    case 'SEED_ENDED':
      return {
        ...state,
        finalResults: action.results,
        scores: action.results,
        totalQuestions: action.totalQuestions ?? state.totalQuestions,
        showPodium: true,
      };
    default:
      return state;
  }
}
