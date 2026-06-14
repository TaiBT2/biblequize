import React from 'react';
import { TeamScoreBar } from '../RoomOverlays';
import { FILL_STYLE } from '../roomQuizCore';
import type { TeamVsTeamState } from '../hooks/useTeamVsTeam';

/**
 * FMR-4 — Team vs Team mode fragments.
 * Default export renders the live team-score header bar; named exports cover
 * the header badge and the perfect-round banner. Mode gating stays with the
 * shell so render conditions match the pre-split page 1:1.
 */
const TeamVsTeamView: React.FC<{ team: TeamVsTeamState }> = ({ team }) => (
  <TeamScoreBar
    scoreA={team.teamScoreA}
    scoreB={team.teamScoreB}
    perfectA={team.perfectA}
    perfectB={team.perfectB}
  />
);

/** Header pill: which team the viewer plays for. */
export const TeamHeaderBadge: React.FC<{ myTeam: string }> = ({ myTeam }) => (
  <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
    myTeam === 'A'
      ? 'bg-bq-sapphire/10 border-bq-sapphire/20'
      : 'bg-bq-ruby/10 border-bq-ruby/20'
  }`}>
    <span className={`w-2 h-2 rounded-full ${myTeam === 'A' ? 'bg-bq-sapphire' : 'bg-bq-ruby'}`} />
    <span className={`text-[10px] font-black ${myTeam === 'A' ? 'text-bq-sapphire' : 'text-bq-ruby'}`}>
      Team {myTeam}
    </span>
  </div>
);

/** Banner under the answer grid when a team aced the round (+50 bonus). */
export const PerfectRoundBanner: React.FC<{
  perfectA: boolean; perfectB: boolean; myTeam: string | null;
}> = ({ perfectA, perfectB, myTeam }) => (
  <div className={`p-4 rounded-2xl border text-center font-bold text-sm animate-pulse ${
    (perfectA && myTeam === 'A') || (perfectB && myTeam === 'B')
      ? 'border-bq-amber/30 bg-bq-amber/5 text-bq-amberd'
      : 'border-bq-emerald/30 bg-bq-emerald/5 text-bq-emerald'
  }`}>
    <span className="material-symbols-outlined text-sm mr-1" style={FILL_STYLE}>stars</span>
    Perfect Round! {perfectA ? 'Team A' : ''}{perfectA && perfectB ? ' & ' : ''}{perfectB ? 'Team B' : ''} +50 diem!
  </div>
);

export default TeamVsTeamView;
