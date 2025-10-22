import { Button } from '@/components/ui/button';

interface FinalVoteButtonsProps {
  defendantUsername: string;
  isDefendant: boolean;
  myVotedPlayerId?: string | null;
  onVoteExecute: () => void;
}

export function FinalVoteButtons({
  defendantUsername,
  isDefendant,
  myVotedPlayerId,
  onVoteExecute
}: FinalVoteButtonsProps) {
  const hasVoted = myVotedPlayerId !== null && myVotedPlayerId !== undefined;

  return (
    <div className="p-4 space-y-3">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          {isDefendant ? '당신은 재판 대상자입니다' : `${defendantUsername}님을 처형하시겠습니까?`}
        </p>
      </div>

      {isDefendant ? (
        <div className="text-center text-sm text-muted-foreground py-4">
          재판 대상자는 투표할 수 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onVoteExecute}
            disabled={hasVoted}
            className={`h-14 text-base font-bold transition-all ${
              hasVoted
                ? 'gradient-danger ring-2 ring-red-500 ring-offset-2 ring-offset-card'
                : 'gradient-danger hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {hasVoted ? '✅ 처형 투표 완료' : '☠️ 처형'}
          </Button>

          <Button
            disabled={hasVoted}
            className={`h-14 text-base font-bold transition-all ${
              hasVoted
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'gradient-primary hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {hasVoted ? '투표 완료' : '🙏 살리기'}
          </Button>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        {isDefendant ? '' : hasVoted ? '투표가 완료되었습니다' : '살리기는 투표하지 않으면 자동으로 살리기 표가 됩니다'}
      </p>
    </div>
  );
}
