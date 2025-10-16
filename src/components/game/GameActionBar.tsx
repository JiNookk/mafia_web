import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GamePhase, GameRole } from '@/types/game.type';
import { ChatType } from '@/types/room.type';

interface GameActionBarProps {
  currentPhase: GamePhase;
  myRole: GameRole;
  myIsAlive: boolean;
  inputMessage: string;
  currentChatType: ChatType;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onOpenVote: () => void;
  onOpenMemo: () => void;
  onOpenAbility: () => void;
  canChat: boolean;
}

export function GameActionBar({
  currentPhase,
  myRole,
  myIsAlive,
  inputMessage,
  currentChatType,
  onInputChange,
  onSendMessage,
  onOpenVote,
  onOpenMemo,
  onOpenAbility,
  canChat
}: GameActionBarProps) {
  const getChatPlaceholder = () => {
    if (!myIsAlive) return '사망하여 채팅할 수 없습니다...';
    if (!canChat) return '채팅을 사용할 수 없습니다...';

    switch (currentChatType) {
      case ChatType.ALL:
        return '전체 채팅 입력...';
      case ChatType.MAFIA:
        return '마피아 채팅 입력...';
      case ChatType.DEAD:
        return '사자 채팅 입력...';
      default:
        return '메시지 입력...';
    }
  };

  const isNight = currentPhase === GamePhase.NIGHT;
  const isDay = currentPhase === GamePhase.DAY;
  const isVotePhase = currentPhase === GamePhase.VOTE;

  const showAbilityButton = isNight && myIsAlive && myRole !== GameRole.CITIZEN;
  const showVoteButton = (isDay || isVotePhase) && myIsAlive;

  return (
    <div className="h-[30vh] bg-card border-t border-border/50 flex flex-col">
      {/* 채팅 입력 영역 */}
      <div className="p-4 border-b border-border/30">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && canChat && onSendMessage()}
            placeholder={getChatPlaceholder()}
            className="flex-1 rounded-full h-11"
            disabled={!canChat}
          />
          <button
            onClick={onSendMessage}
            disabled={!canChat || !inputMessage.trim()}
            className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            ➤
          </button>
        </div>
      </div>

      {/* 액션 버튼 영역 */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3 h-full">
          {/* 능력 사용 버튼 (밤) */}
          {showAbilityButton && (
            <Button
              onClick={onOpenAbility}
              className="h-full text-base font-semibold gradient-danger hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">⚡</span>
                <span>능력 사용</span>
              </div>
            </Button>
          )}

          {/* 여론조사 버튼 (낮/투표) */}
          {showVoteButton && (
            <Button
              onClick={onOpenVote}
              className="h-full text-base font-semibold gradient-primary hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">📊</span>
                <span>여론조사</span>
              </div>
            </Button>
          )}

          {/* 메모 버튼 (항상) */}
          <Button
            onClick={onOpenMemo}
            className="h-full text-base font-semibold bg-muted hover:bg-muted/80 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">📝</span>
              <span>메모</span>
            </div>
          </Button>

          {/* 빈 공간 채우기 */}
          {!showAbilityButton && !showVoteButton && (
            <div className="col-span-1"></div>
          )}
        </div>
      </div>
    </div>
  );
}
