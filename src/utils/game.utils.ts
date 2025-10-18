import { GameRole, ActionType, GamePhase } from '@/types/game.type';

export function getActionType(role: GameRole, phase: GamePhase): ActionType | null {
  if (phase === GamePhase.NIGHT) {
    if (role === GameRole.MAFIA) return ActionType.MAFIA_KILL;
    if (role === GameRole.POLICE) return ActionType.POLICE_CHECK;
    if (role === GameRole.DOCTOR) return ActionType.DOCTOR_HEAL;
    return null;
  } else if (phase === GamePhase.VOTE) {
    return ActionType.VOTE;
  }
  return null;
}

export function getActionSuccessMessage(role: GameRole, phase: GamePhase, playerName: string): string {
  if (phase === GamePhase.NIGHT) {
    if (role === GameRole.MAFIA) return `${playerName}을(를) 처형 대상으로 선택했습니다`;
    if (role === GameRole.POLICE) return `${playerName}을(를) 조사했습니다`;
    if (role === GameRole.DOCTOR) return `${playerName}을(를) 치료했습니다`;
  } else if (phase === GamePhase.VOTE) {
    return `${playerName}에게 투표했습니다`;
  }
  return '행동을 완료했습니다';
}
