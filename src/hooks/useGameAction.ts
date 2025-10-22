import { toast } from 'sonner';
import { gameService } from '@/services/game';
import { GameRole, GamePhase, MyRoleResponse, GameStateResponse } from '@/types/game.type';
import { getActionType, getActionSuccessMessage } from '@/utils/game.utils';
import { PlayerWithVotes } from './useGameState';

interface UseGameActionProps {
  gameState: GameStateResponse | null;
  myRole: MyRoleResponse | null;
  players: PlayerWithVotes[];
  selectedPlayer: string | null;
  onActionComplete: () => void;
}

export function useGameAction({
  gameState,
  myRole,
  players,
  selectedPlayer,
  onActionComplete
}: UseGameActionProps) {
  const validateAction = () => {
    if (!gameState || !myRole || !selectedPlayer) {
      toast.error('대상을 선택해주세요');
      return false;
    }

    if (!myRole.isAlive) {
      toast.error('사망한 플레이어는 행동할 수 없습니다');
      return false;
    }

    const player = players.find(p => p.userId === selectedPlayer);
    if (!player) {
      return false;
    }

    return true;
  };

  const getValidatedActionType = () => {
    if (!gameState || !myRole || !myRole.role || !gameState.currentPhase) return null;

    const actionType = getActionType(myRole.role as GameRole, gameState.currentPhase as GamePhase);

    if (!actionType) {
      toast.info('지금은 행동할 수 없습니다');
      return null;
    }

    return actionType;
  };

  const executeAction = async () => {
    if (!validateAction()) return;

    const actionType = getValidatedActionType();
    if (!actionType) return;

    if (!gameState || !myRole || !selectedPlayer) return;

    const player = players.find(p => p.userId === selectedPlayer);
    if (!player) return;

    try {
      const actorUserId = localStorage.getItem('mafia_session_id') || '';
      const response = await gameService.registerAction(gameState.gameId!, {
        type: actionType,
        targetUserId: selectedPlayer,
        actorUserId
      });

      if (response.success) {
        const successMessage = getActionSuccessMessage(myRole.role as GameRole, gameState.currentPhase as GamePhase, player.username!);
        toast.success(successMessage);
        onActionComplete();
      } else {
        toast.error(response.error || '행동 등록에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to register action:', error);
      toast.error('네트워크 오류가 발생했습니다');
    }
  };

  return { executeAction };
}
