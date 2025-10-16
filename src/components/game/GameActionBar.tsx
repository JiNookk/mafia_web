import { GamePhase, GameRole, GamePlayerResponse } from '@/types/game.type';
import { ChatType } from '@/types/room.type';
import { PlayerMemoGrid } from './PlayerMemoGrid';
import { ExpandedHeader } from './ExpandedHeader';
import { ChatInput } from './ChatInput';
import { ActionButtons } from './ActionButtons';
import { PlayerSelectGrid } from './PlayerSelectGrid';

type ExpandedMode = 'vote' | 'ability' | 'memo' | null;

interface GameActionBarProps {
  currentPhase: GamePhase;
  myRole: GameRole;
  myIsAlive: boolean;
  inputMessage: string;
  currentChatType: ChatType;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  canChat: boolean;
  expandedMode: ExpandedMode;
  onOpenVote: () => void;
  onOpenMemo: () => void;
  onOpenAbility: () => void;
  onClose: () => void;
  players: GamePlayerResponse[];
  onSelectPlayer: (playerId: string) => void;
  getMemo: (playerId: string) => string;
  saveMemo: (playerId: string, memo: string) => void;
}

export function GameActionBar({
  currentPhase,
  myRole,
  myIsAlive,
  inputMessage,
  currentChatType,
  onInputChange,
  onSendMessage,
  canChat,
  expandedMode,
  onOpenVote,
  onOpenMemo,
  onOpenAbility,
  onClose,
  players,
  onSelectPlayer,
  getMemo,
  saveMemo
}: GameActionBarProps) {
  const isExpanded = expandedMode !== null;

  return (
    <div
      className={`bg-card border-t border-border/50 flex flex-col transition-all duration-300 ${
        isExpanded ? 'h-[33vh]' : 'h-auto'
      }`}
    >
      {/* 펼쳐진 상태: 헤더 */}
      {isExpanded && <ExpandedHeader expandedMode={expandedMode} onClose={onClose} />}

      {/* 채팅 입력 (항상 표시) */}
      <ChatInput
        inputMessage={inputMessage}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        canChat={canChat}
        myIsAlive={myIsAlive}
        currentChatType={currentChatType}
      />

      {/* 액션 버튼 영역 (항상 표시) */}
      <ActionButtons
        currentPhase={currentPhase}
        myRole={myRole}
        myIsAlive={myIsAlive}
        isExpanded={isExpanded}
        onOpenVote={onOpenVote}
        onOpenMemo={onOpenMemo}
        onOpenAbility={onOpenAbility}
      />

      {/* 펼쳐진 상태: 플레이어 그리드 (맨 아래) */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          {expandedMode === 'memo' ? (
            <PlayerMemoGrid players={players} getMemo={getMemo} saveMemo={saveMemo} />
          ) : (
            <PlayerSelectGrid players={players} onSelectPlayer={onSelectPlayer} />
          )}
        </div>
      )}
    </div>
  );
}
