import { Input } from '@/components/ui/input';
import { ChatType } from '@/types/room.type';

interface ChatInputProps {
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  canChat: boolean;
  myIsAlive: boolean;
  currentChatType: ChatType;
}

export function ChatInput({
  inputMessage,
  onInputChange,
  onSendMessage,
  canChat,
  myIsAlive,
  currentChatType
}: ChatInputProps) {
  const getChatPlaceholder = () => {
    if (!myIsAlive) return '사망하여 채팅할 수 없습니다...';
    if (!canChat) return '채팅을 사용할 수 없습니다...';

    switch (currentChatType) {
      case ChatType.WAITING_ROOM:
        return '대기실 채팅 입력...';
      case ChatType.GAME_ALL:
        return '전체 채팅 입력...';
      case ChatType.GAME_MAFIA:
        return '마피아 채팅 입력...';
      case ChatType.GAME_DEAD:
        return '사자 채팅 입력...';
      default:
        return '메시지 입력...';
    }
  };

  return (
    <div className="p-3 border-b border-border/30">
      <div className="flex gap-2">
        <Input
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && canChat && onSendMessage()}
          placeholder={getChatPlaceholder()}
          className="flex-1 rounded-full h-10"
          disabled={!canChat}
        />
        <button
          onClick={onSendMessage}
          disabled={!canChat || !inputMessage.trim()}
          className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
