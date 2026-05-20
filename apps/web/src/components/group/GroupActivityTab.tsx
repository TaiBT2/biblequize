// GD-12 — Group page color palette (consolidated 2026-05-10):
//   #e8a832 / rgba(232,168,50,*)  — Gold: primary CTAs, links, leader accents
//   #ff8c42 / rgba(255,140,66,*)  — Orange: inactive/soft warnings only
//   #97C459 / rgba(99,153,34,*)   — Emerald: active/success/streak progress
//   #6AB8E8 / rgba(74,158,255,*)  — Sky: analytics-context info
//   #4ade80 / rgba(74,222,128,*)  — Pulse-strong / member badge
// No new orange shades may be introduced inside components/group/*.
// Earlier code had 3 overlapping orange tones (#ff7a59, #ff8c42, #ffa040);
// GD-12 collapsed them all to #ff8c42.
import LiveNowBanner from './LiveNowBanner';
import QuickActionsPanel from './QuickActionsPanel';
import MembersPreviewCard, { MemberPreview } from './MembersPreviewCard';
import QuizSetsPreviewCard, { QuizSetPreview } from './QuizSetsPreviewCard';
import ActivityFeedPlaceholder from './ActivityFeedPlaceholder';
import NewGroupOnboarding from './NewGroupOnboarding';
import CellGroupPulseCard from './CellGroupPulseCard';

interface Props {
  groupId: string;
  groupCreatedAt?: string;
  isLeader: boolean;
  /** Leader OR mod — can access the Câu hỏi tab and see the quiz-sets preview. */
  isLeaderOrMod: boolean;
  memberCount: number;
  announcementsCount: number;
  members: MemberPreview[];
  quizSets: QuizSetPreview[];
  hasActiveScheduledQuiz: boolean;
  scheduledCount: number;
  firstScheduledQuizId?: string | null;
  playingSetId?: string | null;
  onCreateQuizSet: () => void;
  onPostAnnouncement: () => void;
  onInvite: () => void;
  onSwitchToTab: (key: 'members' | 'quizsets' | 'announcements') => void;
  onPlayQuizSet: (id: string) => void;
}

export default function GroupActivityTab(props: Props) {
  return (
    <div className="space-y-5" data-testid="group-activity-tab">
      {/* GD-FIX-1: Pulse placeholder pinned top of Activity tab for leader/mod
          (member view never sees it). Surfaces the Sprint 6 heuristic per
          mockup MOCKUP_GROUP_DETAIL_REDESIGN.html. */}
      {props.isLeader && <CellGroupPulseCard />}

      <NewGroupOnboarding
        groupId={props.groupId}
        groupCreatedAt={props.groupCreatedAt}
        memberCount={props.memberCount}
        quizSetsCount={props.quizSets.length}
        announcementsCount={props.announcementsCount}
        isLeader={props.isLeader}
        onInvite={props.onInvite}
        onCreateQuizSet={props.onCreateQuizSet}
        onPostAnnouncement={props.onPostAnnouncement}
      />

      <LiveNowBanner groupId={props.groupId} />

      <QuickActionsPanel
        groupId={props.groupId}
        memberCount={props.memberCount}
        quizSetsCount={props.quizSets.length}
        isLeader={props.isLeader}
        hasActiveScheduledQuiz={props.hasActiveScheduledQuiz}
        scheduledCount={props.scheduledCount}
        firstScheduledQuizId={props.firstScheduledQuizId ?? null}
        onCreateQuizSet={props.onCreateQuizSet}
        onPostAnnouncement={props.onPostAnnouncement}
        onSwitchToQuizSets={() => props.onSwitchToTab('quizsets')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityFeedPlaceholder />
        </div>
        <div className="space-y-4">
          <MembersPreviewCard
            members={props.members}
            total={props.memberCount}
            onViewAll={() => props.onSwitchToTab('members')}
          />
          {/* Leader/mod only — members can't open the Câu hỏi tab anymore (solo
              practice was removed 2026-05-20), so the preview would dead-end them. */}
          {props.isLeaderOrMod && (
            <QuizSetsPreviewCard
              quizSets={props.quizSets}
              onPlay={props.onPlayQuizSet}
              onViewAll={() => props.onSwitchToTab('quizsets')}
              playingId={props.playingSetId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
