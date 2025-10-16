'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { gameService } from '@/services/game';
import { GamePhase } from '@/types/game.type';
import { useGameState } from '@/hooks/useGameState';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useGameChat } from '@/hooks/useGameChat';
import { usePlayerMemo } from '@/hooks/usePlayerMemo';
import { useChatPermission } from '@/hooks/useChatPermission';
import { useGameEvents } from '@/hooks/useGameEvents';
import { useModalAction } from '@/hooks/useModalAction';
import { SimpleGameHeader } from '@/components/game/SimpleGameHeader';
import { GameChatPanel } from '@/components/game/GameChatPanel';
import { GameActionBar } from '@/components/game/GameActionBar';
import { PlayerSelectModal } from '@/components/game/PlayerSelectModal';
import { PlayerMemoGrid } from '@/components/game/PlayerMemoGrid';

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const gameId = params.gameId as string;
  const myUserId = typeof window !== 'undefined' ? localStorage.getItem('mafia_session_id') || '' : '';

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'vote' | 'ability' | null>(null);
  const [showMemoGrid, setShowMemoGrid] = useState(false);

  // 커스텀 훅 사용
  const { gameState, setGameState, myRole, players, setPlayers, loadVoteStatus, isLoading } = useGameState(roomId, myUserId, gameId);
  const { memos, saveMemo, getMemo } = usePlayerMemo(gameId);
  const { events, addPhaseChangeEvent, addDeathEvent, addActionEvent } = useGameEvents();
  const { currentChatType, canChat } = useChatPermission({ myRole, currentPhase: gameState?.currentPhase });

  const timer = useGameTimer(gameState, () => {
    if (gameState?.gameId) {
      gameService.getGameState(gameState.gameId).then(res => {
        if (res.success && res.data) {
          setGameState(res.data);
        }
      });
    }
  });

  const { messages, inputMessage, setInputMessage, chatContainerRef, handleSendMessage: originalSendMessage, addMessage } = useGameChat(roomId, myUserId);

  const { executeAction } = useModalAction({
    gameState,
    myRole,
    players,
    modalType,
    onActionSuccess: addActionEvent
  });

  const handleSendMessage = () => {
    if (!canChat) return;
    originalSendMessage();
  };

  useGameWebSocket({
    roomId,
    gameState,
    onPhaseChange: (data) => {
      setGameState(prev => prev ? { ...prev, ...data } : null);
      addPhaseChangeEvent(data.currentPhase, data.dayCount);

      if (data.currentPhase === GamePhase.VOTE && gameState?.gameId) {
        loadVoteStatus(gameState.gameId, data.dayCount);
      }
    },
    onPlayerUpdate: (data) => {
      setPlayers(prev => {
        const updated = prev.map(p =>
          p.userId === data.userId ? { ...p, ...data } : p
        );

        const oldPlayer = prev.find(p => p.userId === data.userId);
        if (oldPlayer?.isAlive && !data.isAlive) {
          addDeathEvent(data.username, data.userId);
        }

        return updated;
      });

      if (selectedPlayer === data.userId && !data.isAlive) {
        setSelectedPlayer(null);
      }
    },
    onChatMessage: addMessage,
    onVoteUpdate: () => {
      if (gameState?.gameId) {
        loadVoteStatus(gameState.gameId, gameState.dayCount);
      }
    }
  });

  const handlePlayerSelect = (playerId: string) => {
    if (modalType === 'vote' || modalType === 'ability') {
      setSelectedPlayer(playerId);
      executeAction(playerId);
    }
  };

  if (isLoading || !gameState || !myRole) {
    return (
      <div className="mobile-container min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="text-primary text-lg">게임 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen flex flex-col bg-background">
      <SimpleGameHeader
        dayCount={gameState.dayCount}
        currentPhase={gameState.currentPhase}
        timer={timer}
      />

      {!showMemoGrid && (
        <GameChatPanel
          messages={messages}
          events={events}
          myUserId={myUserId}
          chatContainerRef={chatContainerRef}
        />
      )}

      {showMemoGrid && (
        <div className="h-[60vh] overflow-y-auto bg-background/50">
          <PlayerMemoGrid
            players={players}
            getMemo={getMemo}
            saveMemo={saveMemo}
          />
        </div>
      )}

      <GameActionBar
        currentPhase={gameState.currentPhase}
        myRole={myRole.role}
        myIsAlive={myRole.isAlive}
        inputMessage={inputMessage}
        currentChatType={currentChatType}
        onInputChange={setInputMessage}
        onSendMessage={handleSendMessage}
        onOpenVote={() => setModalType('vote')}
        onOpenMemo={() => setShowMemoGrid(!showMemoGrid)}
        onOpenAbility={() => setModalType('ability')}
        canChat={canChat}
      />

      <PlayerSelectModal
        players={players}
        isOpen={modalType === 'vote' || modalType === 'ability'}
        onClose={() => setModalType(null)}
        onSelect={handlePlayerSelect}
        title={modalType === 'vote' ? '투표할 플레이어 선택' : '능력 사용 대상 선택'}
        selectedPlayerId={selectedPlayer}
        showOnlyAlive={true}
      />
    </div>
  );
}
