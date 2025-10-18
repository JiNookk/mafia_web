import { ChatMessageDto, ChatType } from '@/types/room.type';
import { getChatTypeLabel, getChatTypeColor } from '@/utils/chatType.utils';

interface ChatMessageProps {
  message: ChatMessageDto;
  isMyMessage: boolean;
}

export function ChatMessage({ message, isMyMessage }: ChatMessageProps) {
  return (
    <div className="animate-fade-in">
      <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          <div className="flex items-center gap-2 mb-1">
            {!isMyMessage && (
              <span className="text-xs font-semibold text-primary">
                {message.nickname}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${getChatTypeColor(message.chatType as ChatType)}`}>
              {getChatTypeLabel(message.chatType as ChatType)}
            </span>
          </div>
          <div
            className={`rounded-2xl px-4 py-2 ${
              isMyMessage
                ? 'gradient-primary text-primary-foreground'
                : 'bg-card'
            }`}
          >
            <p className="text-sm">{message.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
