'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { gameService } from '@/services/game';
import { GamePhase, GameRole } from '@/types/game.type';
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

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const gameId = params.gameId as string;
  const myUserId = typeof window !== 'undefined' ? localStorage.getItem('mafia_session_id') || '' : '';

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [expandedMode, setExpandedMode] = useState<'vote' | 'ability' | 'memo' | null>(null);

  // 커스텀 훅 사용
  const { gameState, setGameState, myRole, players, setPlayers, loadPlayers, loadVoteStatus, isLoading } = useGameState(roomId, myUserId, gameId);
  const { memos, saveMemo, getMemo } = usePlayerMemo(gameId);
  const { events, addPhaseChangeEvent, addDeathEvent, addActionEvent } = useGameEvents();
  const { currentChatType, canChat } = useChatPermission({ myRole, currentPhase: gameState?.currentPhase as GamePhase | undefined });

  const timer = useGameTimer(gameState, () => {
    if (gameState?.gameId) {
      gameService.getGameState(gameState.gameId).then(res => {
        if (res.success && res.data) {
          setGameState(res.data);
        }
      });
    }
  });

  const { messages, inputMessage, setInputMessage, chatContainerRef, handleSendMessage: originalSendMessage, addMessage } = useGameChat(gameId, myUserId, currentChatType);

  const { executeAction } = useModalAction({
    gameState,
    myRole,
    players,
    modalType: expandedMode === 'vote' || expandedMode === 'ability' ? expandedMode : null,
    onActionSuccess: addActionEvent
  });

  const handleSendMessage = () => {
    if (!canChat) return;
    originalSendMessage();
  };

  useGameWebSocket({
    gameId,
    myRole: (myRole?.role as GameRole) || null,
    myIsAlive: myRole?.isAlive || false,
    gameState,
    onPhaseChange: (data) => {
      setGameState(prev => prev ? { ...prev, ...data } : null);
      addPhaseChangeEvent(data.currentPhase as GamePhase, data.dayCount || 0);

      // 페이즈가 변경될 때마다 플레이어 정보 다시 로드 (생존 상태 업데이트)
      if (gameState?.gameId) {
        loadPlayers(gameState.gameId);
      }

      if (data.currentPhase === GamePhase.VOTE && gameState?.gameId && data.dayCount) {
        loadVoteStatus(gameState.gameId, data.dayCount);
      }
    },
    onPlayerUpdate: (data) => {
      setPlayers(prev => {
        const updated = prev.map(p =>
          p.userId === data.userId ? { ...p, ...data } : p
        );

        const oldPlayer = prev.find(p => p.userId === data.userId);
        if (oldPlayer?.isAlive && !data.isAlive && data.username) {
          addDeathEvent(data.username, data.userId!);
        }

        return updated;
      });

      if (selectedPlayer === data.userId && !data.isAlive) {
        setSelectedPlayer(null);
      }
    },
    onChatMessage: addMessage,
    onVoteUpdate: () => {
      if (gameState?.gameId && gameState.dayCount) {
        loadVoteStatus(gameState.gameId, gameState.dayCount);
      }
    }
  });

  const handlePlayerSelect = (playerId: string) => {
    if (expandedMode === 'vote' || expandedMode === 'ability') {
      setSelectedPlayer(playerId);
      executeAction(playerId);
      setExpandedMode(null);
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
    <div className="mobile-container min-h-screen flex flex-col gradient-bg">
      <SimpleGameHeader
        dayCount={gameState.dayCount || 0}
        currentPhase={gameState.currentPhase as GamePhase}
        timer={timer}
        myRole={myRole.role as GameRole}
      />

      <GameChatPanel
        messages={messages}
        events={events}
        myUserId={myUserId}
        chatContainerRef={chatContainerRef}
        isCompact={expandedMode !== null}
      />

      <GameActionBar
        currentPhase={gameState.currentPhase as GamePhase}
        myRole={myRole.role as GameRole}
        myIsAlive={myRole.isAlive || false}
        inputMessage={inputMessage}
        currentChatType={currentChatType}
        onInputChange={setInputMessage}
        onSendMessage={handleSendMessage}
        canChat={canChat}
        expandedMode={expandedMode}
        onOpenVote={() => setExpandedMode('vote')}
        onOpenMemo={() => setExpandedMode('memo')}
        onOpenAbility={() => setExpandedMode('ability')}
        onClose={() => setExpandedMode(null)}
        players={players}
        onSelectPlayer={handlePlayerSelect}
        getMemo={getMemo}
        saveMemo={saveMemo}
      />
    </div>
  );
}
