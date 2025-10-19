'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const roomId = params.roomId as string;
  const gameId = params.gameId as string;
  const myUserId = typeof window !== 'undefined' ? localStorage.getItem('mafia_session_id') || '' : '';
  const myNickname = typeof window !== 'undefined' ? localStorage.getItem('mafia_nickname') || '' : '';

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [expandedMode, setExpandedMode] = useState<'vote' | 'ability' | 'memo' | null>(null);
  const [myVotedPlayerId, setMyVotedPlayerId] = useState<string | null>(null);
  const [myAbilityTargetId, setMyAbilityTargetId] = useState<string | null>(null);
  const [policeCheckTrigger, setPoliceCheckTrigger] = useState(0);

  // 커스텀 훅 사용
  const { gameState, setGameState, myRole, players, setPlayers, loadPlayers, loadMyRole, loadVoteStatus, isLoading } = useGameState(roomId, myUserId, gameId);
  const { memos, saveMemo, getMemo, addPoliceCheckMemo, loadPoliceCheckResults, isLocked } = usePlayerMemo(gameId);
  const { events, addPhaseChangeEvent, addDeathEvent, addActionEvent, addNightResultEvent, addVoteResultEvent, addPoliceCheckResultEvent } = useGameEvents();
  const { currentChatType, canChat } = useChatPermission({ myRole, currentPhase: gameState?.currentPhase as GamePhase | undefined });

  const timer = useGameTimer(gameState);

  const { messages, inputMessage, setInputMessage, chatContainerRef, handleSendMessage: originalSendMessage, addMessage } = useGameChat(gameId, myUserId, currentChatType);

  const { executeAction } = useModalAction({
    gameState,
    myRole,
    players,
    modalType: expandedMode === 'vote' || expandedMode === 'ability' ? expandedMode : null,
    onActionSuccess: addActionEvent,
    onVoteSuccess: (playerId: string) => setMyVotedPlayerId(playerId),
    onAbilitySuccess: (playerId: string) => setMyAbilityTargetId(playerId),
    onPoliceCheckSuccess: () => setPoliceCheckTrigger(prev => prev + 1)
  });

  const handleSendMessage = () => {
    if (!canChat) return;
    originalSendMessage();
  };

  // 경찰 조사 결과 로드 (게임 시작시)
  useEffect(() => {
    if (myRole?.role === GameRole.POLICE && gameState?.gameId) {
      gameService.getPoliceCheckResults(gameState.gameId, myUserId).then(response => {
        if (response.success && response.data?.results) {
          loadPoliceCheckResults(response.data.results.map(r => ({
            targetUserId: r.targetUserId!,
            targetRole: r.targetRole!
          })));
        }
      });
    }
  }, [myRole?.role, gameState?.gameId, myUserId, loadPoliceCheckResults]);

  useGameWebSocket({
    gameId,
    myRole: (myRole?.role as GameRole) || null,
    myIsAlive: myRole?.isAlive || false,
    gameState,
    onGameEnd: (data) => {
      setTimeout(() => {
        router.push(`/rooms/${roomId}`);
      }, 3000);
    },
    onPhaseChange: (data) => {
      setGameState(prev => prev ? { ...prev, ...data } : null);
      addPhaseChangeEvent(data.currentPhase as GamePhase, data.dayCount || 0);

      // 페이즈 변경시 투표 상태 및 능력 사용 상태 초기화
      setMyVotedPlayerId(null);
      setMyAbilityTargetId(null);

      // 페이즈에 맞지 않는 모달 닫기
      const newPhase = data.currentPhase as GamePhase;
      if (expandedMode === 'vote' && newPhase !== GamePhase.DAY && newPhase !== GamePhase.VOTE) {
        setExpandedMode(null);
      }
      if (expandedMode === 'ability' && newPhase !== GamePhase.NIGHT) {
        setExpandedMode(null);
      }

      // 페이즈 결과 처리
      if (data.lastPhaseResult) {
        // 밤 -> 낮: 밤에 죽은 사람 정보
        if (data.currentPhase === GamePhase.DAY) {
          const playerNameMap = new Map(players.map(p => [p.userId!, p.username!]));
          addNightResultEvent(data.lastPhaseResult.deaths, playerNameMap);

          // 경찰 조사 결과 표시 (경찰만)
          if (myRole?.role === GameRole.POLICE && gameState?.gameId) {
            gameService.getPoliceCheckResults(gameState.gameId, myUserId).then(response => {
              if (response.success && response.data?.results) {
                // 현재 dayCount와 일치하는 조사 결과만 표시 (어젯밤에 조사한 것)
                const currentDayResults = response.data.results.filter(
                  r => r.dayCount === data.dayCount
                );
                currentDayResults.forEach(result => {
                  if (result.targetUsername && result.targetRole && result.targetUserId) {
                    // 이벤트 로그에 표시
                    addPoliceCheckResultEvent(result.targetUsername, result.targetRole);
                    // 메모에 조사 결과 추가 (읽기 전용)
                    addPoliceCheckMemo(result.targetUserId, result.targetUsername, result.targetRole);
                  }
                });
              }
            });
          }
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

      // 내가 죽었다면 myRole 다시 로드
      if (data.userId === myUserId && !data.isAlive && gameId) {
        loadMyRole(gameId);
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
        isLocked={isLocked}
        myVotedPlayerId={myVotedPlayerId}
        myAbilityTargetId={myAbilityTargetId}
        gameId={gameId}
        myUserId={myUserId}
        policeCheckTrigger={policeCheckTrigger}
      />
    </div>
  );
}
