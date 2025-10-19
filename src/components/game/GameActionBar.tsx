import { useState, useEffect, useCallback } from 'react';
import { GamePhase, GameRole, CheckResult } from '@/types/game.type';
import { ChatType } from '@/types/room.type';
import { PlayerWithVotes } from '@/hooks/useGameState';
import { gameService } from '@/services/game';
import { PlayerMemoGrid } from './PlayerMemoGrid';
import { ExpandedHeader } from './ExpandedHeader';
import { ChatInput } from './ChatInput';
import { ActionButtons } from './ActionButtons';
import { PlayerSelectGrid } from './PlayerSelectGrid';
import { PoliceCheckResults } from './PoliceCheckResults';

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
  players: PlayerWithVotes[];
  onSelectPlayer: (playerId: string) => void;
  getMemo: (playerId: string) => string;
  saveMemo: (playerId: string, memo: string) => void;
  isLocked?: (playerId: string) => boolean;
  myVotedPlayerId?: string | null;
  myAbilityTargetId?: string | null;
  gameId: string;
  myUserId: string;
  policeCheckTrigger?: number;
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
  saveMemo,
  isLocked,
  myVotedPlayerId,
  myAbilityTargetId,
  gameId,
  myUserId,
  policeCheckTrigger
}: GameActionBarProps) {
  const isExpanded = expandedMode !== null;
  const [policeCheckResults, setPoliceCheckResults] = useState<CheckResult[]>([]);

  // 경찰 조사 결과 로드 함수
  const loadPoliceCheckResults = useCallback(() => {
    console.log('🔍 경찰 조사 결과 로드 중...', { gameId, myUserId });
    gameService.getPoliceCheckResults(gameId, myUserId).then(response => {
      console.log('🔍 경찰 조사 결과 응답:', response);
      if (response.success && response.data?.results) {
        console.log('🔍 조사 결과:', response.data.results);
        setPoliceCheckResults(response.data.results);
      } else {
        console.log('🔍 조사 결과 없음 또는 실패:', response);
      }
    });
  }, [gameId, myUserId]);

  // 경찰이 능력 사용 모드를 열 때 조사 결과 로드
  useEffect(() => {
    console.log('🔍 useEffect 실행:', { myRole, expandedMode, policeCheckTrigger, isPolice: myRole === GameRole.POLICE, isAbility: expandedMode === 'ability' });

    if (myRole === GameRole.POLICE && expandedMode === 'ability') {
      loadPoliceCheckResults();
    }
  }, [myRole, expandedMode, loadPoliceCheckResults, policeCheckTrigger]);

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
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {expandedMode === 'memo' ? (
            <PlayerMemoGrid players={players} getMemo={getMemo} saveMemo={saveMemo} isLocked={isLocked} />
          ) : (
            <>
              <PlayerSelectGrid
                players={players}
                onSelectPlayer={onSelectPlayer}
                myVotedPlayerId={myVotedPlayerId}
                myAbilityTargetId={myAbilityTargetId}
              />
              {/* 경찰이 능력 사용 모드일 때 조사 결과 표시 */}
              {myRole === GameRole.POLICE && expandedMode === 'ability' && (
                <PoliceCheckResults results={policeCheckResults} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
