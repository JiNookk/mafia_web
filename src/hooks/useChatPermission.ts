import { useMemo } from 'react';
import { GamePhase, GameRole, MyRoleResponse } from '@/types/game.type';
import { ChatType } from '@/types/room.type';

interface UseChatPermissionProps {
  myRole: MyRoleResponse | null;
  currentPhase?: GamePhase;
}

export function useChatPermission({ myRole, currentPhase }: UseChatPermissionProps) {
  const getCurrentChatType = (): ChatType => {
    if (!myRole) return ChatType.GAME_ALL;

    if (!myRole.isAlive) {
      return ChatType.GAME_DEAD;
    }

    if (currentPhase === GamePhase.NIGHT && myRole.role === GameRole.MAFIA) {
      return ChatType.GAME_MAFIA;
    }

    return ChatType.GAME_ALL;
  };

  const currentChatType = getCurrentChatType();

  const canChat = useMemo(() => {
    if (!myRole) return false;

    // 죽은 사람은 죽은 사람 채팅만
    if (!myRole.isAlive) return currentChatType === ChatType.GAME_DEAD;

    // 밤에 마피아는 마피아 채팅
    if (currentPhase === GamePhase.NIGHT && myRole.role === GameRole.MAFIA) {
      return currentChatType === ChatType.GAME_MAFIA;
    }

    // 낮에는 전체 채팅
    if (currentPhase === GamePhase.DAY || currentPhase === GamePhase.VOTE) {
      return currentChatType === ChatType.GAME_ALL;
    }

    return false;
  }, [myRole, currentPhase, currentChatType]);

  return { currentChatType, canChat };
}
