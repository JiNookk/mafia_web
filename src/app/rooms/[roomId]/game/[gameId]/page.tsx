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
  const myNickname = typeof window !== 'undefined' ? localStorage.getItem('mafia_nickname') || '' : '';

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [expandedMode, setExpandedMode] = useState<'vote' | 'ability' | 'memo' | null>(null);
  const [myVotedPlayerId, setMyVotedPlayerId] = useState<string | null>(null);
  const [myAbilityTargetId, setMyAbilityTargetId] = useState<string | null>(null);

  // 커스텀 훅 사용
  const { gameState, setGameState, myRole, players, setPlayers, loadPlayers, loadVoteStatus, isLoading } = useGameState(roomId, myUserId, gameId);
  const { memos, saveMemo, getMemo } = usePlayerMemo(gameId);
  const { events, addPhaseChangeEvent, addDeathEvent, addActionEvent, addNightResultEvent, addVoteResultEvent } = useGameEvents();
  const { currentChatType, canChat } = useChatPermission({ myRole, currentPhase: gameState?.currentPhase as GamePhase | undefined });

  const timer = useGameTimer(gameState, async () => {
    if (gameState?.gameId) {
      console.log('⏰ Timer ended! Current phase:', gameState.currentPhase, 'Calling next-phase API');
      try {
        const response = await gameService.nextPhase(gameState.gameId);
        if (response.success && response.data) {
          const phaseData = response.data;
          console.log('✅ Next phase response:', {
            from: gameState.currentPhase,
            to: phaseData.currentPhase,
            dayCount: phaseData.dayCount
          });

          // 상태 업데이트 (기존 gameId 유지)
          setGameState(prev => prev ? {
            ...prev,
            currentPhase: phaseData.currentPhase,
            dayCount: phaseData.dayCount,
            phaseStartTime: phaseData.phaseStartTime,
            phaseDurationSeconds: phaseData.phaseDurationSeconds
          } : null);
          addPhaseChangeEvent(phaseData.currentPhase as GamePhase, phaseData.dayCount || 0);

          // 페이즈 결과 처리
          if (phaseData.lastPhaseResult) {
            if (phaseData.currentPhase === 'DAY') {
              // 플레이어 이름 맵 생성
              const playerNameMap = new Map(players.map(p => [p.userId!, p.username!]));
              addNightResultEvent(phaseData.lastPhaseResult.deaths, playerNameMap);
            }
            if (phaseData.lastPhaseResult.executedUserId && players.length > 0) {
              const executedPlayer = players.find(p => p.userId === phaseData.lastPhaseResult!.executedUserId);
              if (executedPlayer) {
                addVoteResultEvent(executedPlayer.username);
              }
            }
          }

          // 플레이어 정보 다시 로드
          loadPlayers(gameId);

          // 투표 페이즈면 투표 상태 로드
          if (phaseData.currentPhase === 'VOTE' && phaseData.dayCount) {
            loadVoteStatus(gameId, phaseData.dayCount);
          }
        }
      } catch (error) {
        console.error('❌ Failed to call next-phase:', error);
      }
    }
  });

  const { messages, inputMessage, setInputMessage, chatContainerRef, handleSendMessage: originalSendMessage, addMessage } = useGameChat(gameId, myUserId, currentChatType);

  const { executeAction } = useModalAction({
    gameState,
    myRole,
    players,
    modalType: expandedMode === 'vote' || expandedMode === 'ability' ? expandedMode : null,
    onActionSuccess: addActionEvent,
    onVoteSuccess: (playerId: string) => setMyVotedPlayerId(playerId),
    onAbilitySuccess: (playerId: string) => setMyAbilityTargetId(playerId)
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
      console.log('🎯 PHASE_CHANGE received:', {
        currentPhase: data.currentPhase,
        dayCount: data.dayCount,
        lastPhaseResult: data.lastPhaseResult
      });

      setGameState(prev => prev ? { ...prev, ...data } : null);
      addPhaseChangeEvent(data.currentPhase as GamePhase, data.dayCount || 0);

      // 페이즈 변경시 투표 상태 및 능력 사용 상태 초기화
      setMyVotedPlayerId(null);
      setMyAbilityTargetId(null);

      // 페이즈 결과 처리
      if (data.lastPhaseResult) {
        // 밤 -> 낮: 밤에 죽은 사람 정보
        if (data.currentPhase === GamePhase.DAY) {
          const playerNameMap = new Map(players.map(p => [p.userId!, p.username!]));
          addNightResultEvent(data.lastPhaseResult.deaths, playerNameMap);
        }

        // 투표 결과: 처형된 사람 정보
        if (data.lastPhaseResult.executedUserId && players.length > 0) {
          const executedPlayer = players.find(p => p.userId === data.lastPhaseResult!.executedUserId);
          if (executedPlayer) {
            addVoteResultEvent(executedPlayer.username);
          }
        }
      }

      // 페이즈가 변경될 때마다 플레이어 정보 다시 로드 (생존 상태 업데이트)
      if (gameId) {
        loadPlayers(gameId);
      }

      if (data.currentPhase === GamePhase.VOTE && gameId && data.dayCount) {
        loadVoteStatus(gameId, data.dayCount);
      }
    },
    onPlayerUpdate: (data) => {
      console.log('📡 WebSocket PLAYER_UPDATE received:', {
        username: data.username,
        userId: data.userId,
        isAlive: data.isAlive
      });

      setPlayers(prev => {
        const updated = prev.map(p =>
          p.userId === data.userId ? { ...p, ...data } : p
        );

        const oldPlayer = prev.find(p => p.userId === data.userId);
        if (oldPlayer?.isAlive && !data.isAlive && data.username) {
          addDeathEvent(data.username, data.userId!);
        }

        console.log('📋 Players after PLAYER_UPDATE:', updated.map(p => ({
          username: p.username,
          isAlive: p.isAlive
        })));

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
      // 투표와 능력사용 모두 그리드를 열어둠
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
    <div className="mobile-container h-screen flex flex-col gradient-bg overflow-hidden">
      <SimpleGameHeader
        dayCount={gameState.dayCount || 0}
        currentPhase={gameState.currentPhase as GamePhase}
        timer={timer}
        myRole={myRole.role as GameRole}
        myNickname={myNickname}
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
        onClose={() => {
          setExpandedMode(null);
          setMyVotedPlayerId(null);
          setMyAbilityTargetId(null);
        }}
        players={players}
        onSelectPlayer={handlePlayerSelect}
        getMemo={getMemo}
        saveMemo={saveMemo}
        myVotedPlayerId={myVotedPlayerId}
        myAbilityTargetId={myAbilityTargetId}
      />
    </div>
  );
}
