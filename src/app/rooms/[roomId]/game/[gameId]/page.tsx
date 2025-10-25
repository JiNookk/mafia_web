'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gameService } from '@/services/game';
import { GamePhase, GameRole, ActionType } from '@/types/game.type';
import { useGameState } from '@/hooks/useGameState';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useGameChat } from '@/hooks/useGameChat';
import { usePlayerMemo } from '@/hooks/usePlayerMemo';
import { useChatPermission } from '@/hooks/useChatPermission';
import { useGameEvents } from '@/hooks/useGameEvents';
import { useModalAction } from '@/hooks/useModalAction';
import { useDeathSound } from '@/hooks/useDeathSound';
import { SimpleGameHeader } from '@/components/game/SimpleGameHeader';
import { GameChatPanel } from '@/components/game/GameChatPanel';
import { GameActionBar } from '@/components/game/GameActionBar';
import { FinalVoteModal } from '@/components/game/FinalVoteModal';
import { GameResultModal } from '@/components/game/GameResultModal';

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
  const [previousPhase, setPreviousPhase] = useState<GamePhase | null>(null);
  const [showFinalVoteModal, setShowFinalVoteModal] = useState(false);
  const [showGameResultModal, setShowGameResultModal] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState<'CITIZEN' | 'MAFIA' | null>(null);

  // 커스텀 훅 사용
  const { gameState, setGameState, myRole, players, setPlayers, voteStatus, loadPlayers, loadMyRole, loadVoteStatus, isLoading } = useGameState(roomId, myUserId, gameId);
  const { saveMemo, getMemo, addPoliceCheckMemo, loadPoliceCheckResults, isLocked } = usePlayerMemo(gameId);
  const { events, addPhaseChangeEvent, addDeathEvent, addActionEvent, addNightResultEvent, addVoteResultEvent, addPoliceCheckResultEvent } = useGameEvents();
  const { currentChatType, canChat } = useChatPermission({ myRole, currentPhase: gameState?.currentPhase as GamePhase | undefined });
  const { playDeathSound, playHealSound, playVoteDeathSound } = useDeathSound();

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

  const handleFinalVote = async () => {
    const defendantUserId = voteStatus?.topVotedUserId;
    if (!gameState?.gameId || !defendantUserId) return;

    try {
      const response = await gameService.registerAction(gameState.gameId, {
        type: ActionType.FINAL_VOTE,
        targetUserId: defendantUserId,
        actorUserId: myUserId
      });

      if (response.success) {
        setMyVotedPlayerId(defendantUserId);
        const defendantUsername = players.find(p => p.userId === defendantUserId)?.username || '알 수 없음';
        addActionEvent(defendantUsername, '처형에 투표했습니다');
      }
    } catch (error) {
      console.error('Failed to register final vote:', error);
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myRole?.role, gameState?.gameId, myUserId]);

  useGameWebSocket({
    gameId,
    myRole: (myRole?.role as GameRole) || null,
    myIsAlive: myRole?.isAlive || false,
    gameState,
    onGameEnd: (data) => {
      // 게임 결과 모달 표시
      if (data.winnerTeam) {
        setWinnerTeam(data.winnerTeam as 'CITIZEN' | 'MAFIA');
        setShowGameResultModal(true);
      }

      // 3초 후 방으로 리다이렉트
      setTimeout(() => {
        router.push(`/rooms/${roomId}`);
      }, 3000);
    },
    onPhaseChange: (data) => {
      const newPhase = data.currentPhase as GamePhase;

      setGameState(prev => prev ? { ...prev, ...data } : null);
      addPhaseChangeEvent(newPhase, data.dayCount || 0);

      // 페이즈 변경시 투표 상태 및 능력 사용 상태 초기화
      // RESULT 페이즈로 전환될 때도 초기화 (새로운 최종 투표를 위해)
      setMyVotedPlayerId(null);
      setMyAbilityTargetId(null);

      // 페이즈에 맞지 않는 모달 닫기
      if (expandedMode === 'vote' && newPhase !== GamePhase.DAY && newPhase !== GamePhase.VOTE) {
        setExpandedMode(null);
      }
      if (expandedMode === 'ability' && newPhase !== GamePhase.NIGHT) {
        setExpandedMode(null);
      }

      // VOTE 페이즈에서 투표 상태 로드 (topVotedUserId를 얻기 위해)
      if (newPhase === GamePhase.VOTE && gameId && data.dayCount) {
        loadVoteStatus(gameId, data.dayCount);
      }

      // RESULT 페이즈 시작 시 최종 투표 모달 표시 (재판 대상자가 아닌 경우만)
      if (newPhase === GamePhase.RESULT) {
        const defendantUserId = voteStatus?.topVotedUserId;
        console.log('🔍 Phase change debug (RESULT):', {
          newPhase,
          defendantUserId,
          myUserId,
          myIsAlive: myRole?.isAlive,
          isDefendant: defendantUserId === myUserId,
          voteStatus
        });

        if (defendantUserId && defendantUserId !== myUserId && myRole?.isAlive) {
          console.log('✅ Opening final vote modal');
          setShowFinalVoteModal(true);
        }
      }

      // RESULT 페이즈가 아니면 모달 닫기
      if (newPhase !== GamePhase.RESULT) {
        setShowFinalVoteModal(false);
      }

      // 페이즈 결과 처리
      if (data.lastPhaseResult) {
        // 밤 -> 낮: 밤에 죽은 사람 정보
        if (newPhase === GamePhase.DAY) {
          const playerNameMap = new Map(players.map(p => [p.userId!, p.username!]));

          // 효과음 재생
          if (data.lastPhaseResult.deaths && data.lastPhaseResult.deaths.length > 0) {
            // 사망자가 있으면 사망 효과음
            playDeathSound();
          } else if (data.lastPhaseResult.wasSavedByDoctor) {
            // 의사가 살렸으면 힐 효과음
            playHealSound();
          }

          addNightResultEvent(data.lastPhaseResult.deaths, playerNameMap, data.lastPhaseResult.wasSavedByDoctor);

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

        // 최종 투표 결과: 처형된 사람 정보 (RESULT -> NIGHT 전환 시에만)
        if (previousPhase === GamePhase.RESULT && newPhase === GamePhase.NIGHT && data.lastPhaseResult.executedUserId && players.length > 0) {
          const executedPlayer = players.find(p => p.userId === data.lastPhaseResult!.executedUserId);
          if (executedPlayer) {
            playVoteDeathSound();
            addVoteResultEvent(executedPlayer.username);
          }
        }
      }

      // 이전 페이즈 업데이트
      setPreviousPhase(newPhase);

      // 페이즈가 변경될 때마다 플레이어 정보 다시 로드 (생존 상태 업데이트)
      if (gameId) {
        loadPlayers(gameId);
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
        defendantUsername={voteStatus?.topVotedUserId ? players.find(p => p.userId === voteStatus.topVotedUserId)?.username : undefined}
      />

      <GameChatPanel
        messages={messages}
        events={events}
        myUserId={myUserId}
        chatContainerRef={chatContainerRef}
        isCompact={expandedMode !== null}
        deadPlayerIds={players.filter(p => !p.isAlive).map(p => p.userId!)}
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
        defendantUserId={voteStatus?.topVotedUserId}
        onFinalVote={handleFinalVote}
      />

      <FinalVoteModal
        isOpen={showFinalVoteModal}
        defendantUsername={(() => {
          const defendantUserId = voteStatus?.topVotedUserId;
          const username = defendantUserId ? players.find(p => p.userId === defendantUserId)?.username || '알 수 없음' : '';
          console.log('👤 Defendant username lookup:', {
            defendantUserId,
            playersCount: players.length,
            players: players.map(p => ({ userId: p.userId, username: p.username })),
            foundUsername: username
          });
          return username;
        })()}
        isDefendant={voteStatus?.topVotedUserId === myUserId}
        myVotedPlayerId={myVotedPlayerId}
        onVoteExecute={handleFinalVote}
        onClose={() => {
          console.log('🚪 Closing modal');
          setShowFinalVoteModal(false);
        }}
      />

      <GameResultModal
        isOpen={showGameResultModal}
        winnerTeam={winnerTeam}
        onClose={() => setShowGameResultModal(false)}
      />
    </div>
  );
}
