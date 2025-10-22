import { ChatType } from '@/types/room.type';

export function getChatTypeLabel(chatType: ChatType): string {
  switch (chatType) {
    case ChatType.WAITING_ROOM:
      return '대기실';
    case ChatType.GAME_ALL:
      return '전체';
    case ChatType.GAME_MAFIA:
      return '마피아';
    case ChatType.GAME_DEAD:
      return '사자';
    default:
      return '';
  }
}

export function getChatTypeColor(chatType: ChatType): string {
  switch (chatType) {
    case ChatType.WAITING_ROOM:
      return 'bg-secondary/20 text-secondary';
    case ChatType.GAME_ALL:
      return 'bg-primary/20 text-primary';
    case ChatType.GAME_MAFIA:
      return 'bg-destructive/20 text-destructive';
    case ChatType.GAME_DEAD:
      return 'bg-muted text-muted-foreground';
    default:
      return '';
  }
}
