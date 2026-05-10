import LiveNowBanner from './LiveNowBanner';
import QuickActionsPanel from './QuickActionsPanel';
import MembersPreviewCard, { MemberPreview } from './MembersPreviewCard';
import QuizSetsPreviewCard, { QuizSetPreview } from './QuizSetsPreviewCard';
import ActivityFeedPlaceholder from './ActivityFeedPlaceholder';

interface Props {
  groupId: string;
  isLeader: boolean;
  memberCount: number;
  members: MemberPreview[];
  quizSets: QuizSetPreview[];
  hasActiveScheduledQuiz: boolean;
  scheduledCount: number;
  playingSetId?: string | null;
  onCreateQuizSet: () => void;
  onPostAnnouncement: () => void;
  onSwitchToTab: (key: 'members' | 'quizsets' | 'announcements') => void;
  onPlayQuizSet: (id: string) => void;
}

export default function GroupActivityTab(props: Props) {
  return (
    <div className="space-y-5" data-testid="group-activity-tab">
      <LiveNowBanner groupId={props.groupId} />

      <QuickActionsPanel
        groupId={props.groupId}
        memberCount={props.memberCount}
        quizSetsCount={props.quizSets.length}
        isLeader={props.isLeader}
        hasActiveScheduledQuiz={props.hasActiveScheduledQuiz}
        scheduledCount={props.scheduledCount}
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
          <QuizSetsPreviewCard
            quizSets={props.quizSets}
            onPlay={props.onPlayQuizSet}
            onViewAll={() => props.onSwitchToTab('quizsets')}
            playingId={props.playingSetId}
          />
        </div>
      </div>
    </div>
  );
}
