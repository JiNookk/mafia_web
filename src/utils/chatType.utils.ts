import { ChatType } from '@/types/room.type';

export function getChatTypeLabel(chatType: ChatType): string {
  switch (chatType) {
    case ChatType.ALL:
      return '전체';
    case ChatType.MAFIA:
      return '마피아';
    case ChatType.DEAD:
      return '사자';
    default:
      return '';
  }
}

export function getChatTypeColor(chatType: ChatType): string {
  switch (chatType) {
    case ChatType.ALL:
      return 'bg-primary/20 text-primary';
    case ChatType.MAFIA:
      return 'bg-destructive/20 text-destructive';
    case ChatType.DEAD:
      return 'bg-muted text-muted-foreground';
    default:
      return '';
  }
}
