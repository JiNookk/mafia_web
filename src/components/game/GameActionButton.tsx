import { Button } from '@/components/ui/button';
import { GamePhase, GameRole, MyRoleResponse } from '@/types/game.type';

interface GameActionButtonProps {
  gameState: { currentPhase?: GamePhase };
  myRole: MyRoleResponse | null;
  selectedPlayer: string | null;
  onClick: () => void;
}

export function GameActionButton({ gameState, myRole, selectedPlayer, onClick }: GameActionButtonProps) {
  const getButtonText = () => {
    if (!myRole?.isAlive) return '사망 - 관전 중';
    if (!gameState?.currentPhase) return '로딩 중...';

    if (gameState.currentPhase === GamePhase.NIGHT) {
      if (myRole.role === GameRole.MAFIA) return '처형 대상 선택';
      if (myRole.role === GameRole.POLICE) return '조사 대상 선택';
      if (myRole.role === GameRole.DOCTOR) return '치료 대상 선택';
      return '밤 시간 - 대기중';
    } else if (gameState.currentPhase === GamePhase.DAY) {
      return '토론 시간 (채팅 사용)';
    } else if (gameState.currentPhase === GamePhase.VOTE) {
      return '투표하기';
    } else if (gameState.currentPhase === GamePhase.DEFENSE) {
      return '최종 변론';
    }
    return '대기 중';
  };

  return (
    <div className="p-4 bg-card border-t border-border/50">
      <Button
        onClick={onClick}
        disabled={gameState?.currentPhase === GamePhase.DAY || !selectedPlayer || !myRole?.isAlive}
        className="w-full h-14 text-base font-semibold gradient-danger hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {getButtonText()}
      </Button>
    </div>
  );
}
