import { Input } from '@/components/ui/input';
import { ChatMessageDto } from '@/types/room.type';

interface ChatPanelProps {
  messages: ChatMessageDto[];
  inputMessage: string;
  myUserId: string;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
}

export function ChatPanel({
  messages,
  inputMessage,
  myUserId,
  chatContainerRef,
  onInputChange,
  onSendMessage
}: ChatPanelProps) {
  return (
    <>
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-black/20 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            채팅을 시작해보세요!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="animate-fade-in">
              <div className={`${msg.userId === myUserId ? 'ml-auto' : ''} inline-block max-w-[80%]`}>
                {msg.userId !== myUserId && (
                  <div className="text-xs text-primary font-semibold mb-1">{msg.nickname}</div>
                )}
                <div className={`rounded-2xl px-4 py-2 ${
                  msg.userId === myUserId ? 'gradient-primary' : 'bg-card/50'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-3 bg-card border-t border-border/50 flex gap-2 items-center">
        <Input
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
          placeholder="메시지 입력..."
          className="flex-1 rounded-full h-10"
        />
        <button
          onClick={onSendMessage}
          className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          ➤
        </button>
      </div>
    </>
  );
}
