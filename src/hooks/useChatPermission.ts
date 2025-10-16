import { useMemo } from 'react';
import { GamePhase, GameRole, MyRoleResponse } from '@/types/game.type';
import { ChatType } from '@/types/room.type';

interface UseChatPermissionProps {
  myRole: MyRoleResponse | null;
  currentPhase?: GamePhase;
}

export function useChatPermission({ myRole, currentPhase }: UseChatPermissionProps) {
  const getCurrentChatType = (): ChatType => {
    if (!myRole) return ChatType.ALL;

    if (!myRole.isAlive) {
      return ChatType.DEAD;
    }

    if (currentPhase === GamePhase.NIGHT && myRole.role === GameRole.MAFIA) {
      return ChatType.MAFIA;
    }

    return ChatType.ALL;
  };

  const currentChatType = getCurrentChatType();

  const canChat = useMemo(() => {
    if (!myRole) return false;

    // 죽은 사람은 죽은 사람 채팅만
    if (!myRole.isAlive) return currentChatType === ChatType.DEAD;

    // 밤에 마피아는 마피아 채팅
    if (currentPhase === GamePhase.NIGHT && myRole.role === GameRole.MAFIA) {
      return currentChatType === ChatType.MAFIA;
    }

    // 낮에는 전체 채팅
    if (currentPhase === GamePhase.DAY || currentPhase === GamePhase.VOTE) {
      return currentChatType === ChatType.ALL;
    }

    return false;
  }, [myRole, currentPhase, currentChatType]);

  return { currentChatType, canChat };
}
