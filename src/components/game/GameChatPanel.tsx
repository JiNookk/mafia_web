import { useMemo } from 'react';
import { ChatMessageDto } from '@/types/room.type';
import { GameEvent } from './EventLog';
import { ChatMessage } from './ChatMessage';
import { EventMessage } from './EventMessage';

interface GameChatPanelProps {
  messages: ChatMessageDto[];
  events: GameEvent[];
  myUserId: string;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  isCompact?: boolean;
}

type CombinedItem =
  | { type: 'event'; data: GameEvent; timestamp: string }
  | { type: 'message'; data: ChatMessageDto; timestamp: string };

export function GameChatPanel({
  messages,
  events,
  myUserId,
  chatContainerRef,
  isCompact = false
}: GameChatPanelProps) {
  // 이벤트와 메시지를 시간순으로 합치기
  const combinedItems = useMemo<CombinedItem[]>(() => {
    return [
      ...events.map(e => ({ type: 'event' as const, data: e, timestamp: e.timestamp })),
      ...messages.map(m => ({ type: 'message' as const, data: m, timestamp: m.timestamp || '' }))
    ].sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  }, [events, messages]);

  return (
    <div className={`flex flex-col transition-all duration-300 ${isCompact ? 'h-[57vh]' : 'flex-1'} min-h-0`}>
      {/* 채팅 + 이벤트 메시지 영역 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      >
        {combinedItems.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            게임이 시작되었습니다!
          </div>
        ) : (
          combinedItems.map((item) => {
            if (item.type === 'event') {
              return <EventMessage key={`event-${item.data.id}`} event={item.data} />;
            } else {
              return (
                <ChatMessage
                  key={`msg-${item.data.id}`}
                  message={item.data}
                  isMyMessage={item.data.userId === myUserId}
                />
              );
            }
          })
        )}
      </div>
    </div>
  );
}
