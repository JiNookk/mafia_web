import { useCallback } from 'react';
import { gameService } from '@/services/game';
import { GameRole, MyRoleResponse, GameStateResponse, ActionType } from '@/types/game.type';
import { PlayerWithVotes } from './useGameState';

type ModalType = 'vote' | 'ability' | 'memo' | null;

interface UseModalActionProps {
  gameState: GameStateResponse | null;
  myRole: MyRoleResponse | null;
  players: PlayerWithVotes[];
  modalType: ModalType;
  onActionSuccess: (username: string, actionText: string) => void;
}

export function useModalAction({
  gameState,
  myRole,
  players,
  modalType,
  onActionSuccess
}: UseModalActionProps) {
  const getActionType = useCallback((modalType: ModalType): ActionType | null => {
    if (modalType === 'vote') return ActionType.VOTE;
    if (modalType === 'ability' && myRole) {
      switch (myRole.role) {
        case GameRole.MAFIA:
          return ActionType.MAFIA_KILL;
        case GameRole.DOCTOR:
          return ActionType.DOCTOR_HEAL;
        case GameRole.POLICE:
          return ActionType.POLICE_CHECK;
        default:
          return null;
      }
    }
    return null;
  }, [myRole]);

  const getActionText = useCallback((modalType: ModalType): string => {
    if (modalType === 'vote') return '투표했습니다';
    if (modalType === 'ability' && myRole) {
      switch (myRole.role) {
        case GameRole.MAFIA:
          return '처형 대상으로 선택했습니다';
        case GameRole.DOCTOR:
          return '치료 대상으로 선택했습니다';
        case GameRole.POLICE:
          return '조사 대상으로 선택했습니다';
        default:
          return '';
      }
    }
    return '';
  }, [myRole]);

  const executeAction = useCallback(async (playerId: string) => {
    if (!gameState || !myRole || !modalType) return;
    if (modalType === 'memo') return; // 메모는 액션이 아님

    const actionType = getActionType(modalType);
    if (!actionType) return;

    try {
      const actorUserId = localStorage.getItem('mafia_session_id') || '';
      const response = await gameService.registerAction(gameState.gameId!, {
        type: actionType,
        targetUserId: playerId,
        actorUserId
      });

      if (response.success) {
        const player = players.find(p => p.userId === playerId);
        const actionText = getActionText(modalType);

        if (player && player.username) {
          onActionSuccess(player.username, actionText);
        }
      }
    } catch (error) {
      console.error('Failed to register action:', error);
    }
  }, [gameState, myRole, modalType, players, getActionType, getActionText, onActionSuccess]);

  return { executeAction };
}
