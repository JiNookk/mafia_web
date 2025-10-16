import { Button } from '@/components/ui/button';
import { GamePhase, GameRole } from '@/types/game.type';

interface ActionButtonsProps {
  currentPhase: GamePhase;
  myRole: GameRole;
  myIsAlive: boolean;
  isExpanded: boolean;
  onOpenVote: () => void;
  onOpenMemo: () => void;
  onOpenAbility: () => void;
}

export function ActionButtons({
  currentPhase,
  myRole,
  myIsAlive,
  isExpanded,
  onOpenVote,
  onOpenMemo,
  onOpenAbility
}: ActionButtonsProps) {
  const isNight = currentPhase === GamePhase.NIGHT;
  const isDay = currentPhase === GamePhase.DAY;
  const isVotePhase = currentPhase === GamePhase.VOTE;

  const showAbilityButton = isNight && myIsAlive && myRole !== GameRole.CITIZEN;
  const showVoteButton = (isDay || isVotePhase) && myIsAlive;

  return (
    <div className={`p-3 ${isExpanded ? 'border-b border-border/30' : ''}`}>
      <div className="grid grid-cols-2 gap-2">
        {/* 능력 사용 버튼 (밤) */}
        {showAbilityButton && (
          <Button
            onClick={onOpenAbility}
            className="h-12 text-sm font-semibold gradient-danger hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span>능력 사용</span>
            </div>
          </Button>
        )}

        {/* 여론조사 버튼 (낮/투표) */}
        {showVoteButton && (
          <Button
            onClick={onOpenVote}
            className="h-12 text-sm font-semibold gradient-primary hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <span>여론조사</span>
            </div>
          </Button>
        )}

        {/* 메모 버튼 (항상) */}
        <Button
          onClick={onOpenMemo}
          className="h-12 text-sm font-semibold bg-muted hover:bg-muted/80 hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <span>메모</span>
          </div>
        </Button>

        {/* 빈 공간 채우기 */}
        {!showAbilityButton && !showVoteButton && (
          <div className="col-span-1"></div>
        )}
      </div>
    </div>
  );
}
