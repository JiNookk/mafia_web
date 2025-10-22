import { Button } from '@/components/ui/button';

interface FinalVoteModalProps {
  isOpen: boolean;
  defendantUsername: string;
  isDefendant: boolean;
  myVotedPlayerId?: string | null;
  onVoteExecute: () => void;
  onClose: () => void;
}

export function FinalVoteModal({
  isOpen,
  defendantUsername,
  isDefendant,
  myVotedPlayerId,
  onVoteExecute,
  onClose
}: FinalVoteModalProps) {
  console.log('📊 FinalVoteModal render:', { isOpen, defendantUsername, isDefendant, myVotedPlayerId });

  if (!isOpen) return null;

  const hasVoted = myVotedPlayerId !== null && myVotedPlayerId !== undefined;

  const handleVoteExecute = () => {
    onVoteExecute();
    // 투표 후 잠시 후에 모달 닫기
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-primary">⚖️ 최종 투표</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:text-destructive transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-base font-semibold mb-2">
              {isDefendant
                ? '당신은 재판 대상자입니다'
                : `${defendantUsername}님을 처형하시겠습니까?`}
            </p>
            {!isDefendant && !hasVoted && (
              <p className="text-sm text-muted-foreground">
                살리기는 투표하지 않으면 자동으로 살리기 표가 됩니다
              </p>
            )}
          </div>

          {isDefendant ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              재판 대상자는 투표할 수 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleVoteExecute}
                disabled={hasVoted}
                className={`h-16 text-base font-bold transition-all ${
                  hasVoted
                    ? 'gradient-danger ring-2 ring-red-500 ring-offset-2 ring-offset-card'
                    : 'gradient-danger hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {hasVoted ? '✅ 처형 투표 완료' : '☠️ 처형'}
              </Button>

              <Button
                onClick={onClose}
                disabled={hasVoted}
                className={`h-16 text-base font-bold transition-all ${
                  hasVoted
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'gradient-primary hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {hasVoted ? '투표 완료' : '🙏 살리기'}
              </Button>
            </div>
          )}

          {hasVoted && !isDefendant && (
            <p className="text-sm text-center text-green-500 font-semibold">
              ✅ 투표가 완료되었습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
