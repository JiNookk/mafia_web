import { useEffect, useRef } from 'react';
import { GamePlayerResponse, GamePhase, GameStateResponse, GameRole, PhaseResult } from '@/types/game.type';
import { ChatMessageDto } from '@/types/room.type';

interface PhaseChangeData {
  currentPhase: GamePhase;
  dayCount: number;
  phaseStartTime: string;
  phaseDurationSeconds: number;
  lastPhaseResult?: PhaseResult;
}

interface UseGameWebSocketProps {
  gameId: string;
  myRole: GameRole | null;
  myIsAlive: boolean;
  gameState: GameStateResponse | null;
  onPhaseChange: (data: PhaseChangeData) => void;
  onPlayerUpdate: (data: GamePlayerResponse) => void;
  onChatMessage: (message: ChatMessageDto) => void;
  onVoteUpdate: () => void;
  onGameEnd?: (data: { gameId: string; winnerTeam: string }) => void;
}

interface WebSocketHandlers {
  onPhaseChangeRef: React.MutableRefObject<(data: PhaseChangeData) => void>;
  onPlayerUpdateRef: React.MutableRefObject<(data: GamePlayerResponse) => void>;
  onChatMessageRef: React.MutableRefObject<(message: ChatMessageDto) => void>;
  onVoteUpdateRef: React.MutableRefObject<() => void>;
  onGameEndRef: React.MutableRefObject<((data: { gameId: string; winnerTeam: string }) => void) | undefined>;
}

const getReconnectDelay = (attemptNumber: number): number => {
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 10000);
};

const createMessageHandler = (handlers: WebSocketHandlers) => (event: MessageEvent) => {
  try {
    const message = JSON.parse(event.data);

    if ((message.type === 'PHASE_CHANGE' || message.type === 'PHASE_CHANGED') && message.data) {
      handlers.onPhaseChangeRef.current(message.data);
    } else if (message.type === 'PLAYER_UPDATE' && message.data) {
      handlers.onPlayerUpdateRef.current(message.data);
    } else if (message.type === 'PLAYER_DIED' && message.data) {
      // PLAYER_DIED 이벤트도 PLAYER_UPDATE와 동일하게 처리
      // 여러 플레이어가 죽었을 수 있으므로 배열로 처리
      if (message.data.deadPlayerIds && Array.isArray(message.data.deadPlayerIds)) {
        message.data.deadPlayerIds.forEach((userId: string) => {
          handlers.onPlayerUpdateRef.current({ userId, isAlive: false });
        });
      }
    } else if (message.type === 'CHAT' && message.data) {
      handlers.onChatMessageRef.current(message.data);
    } else if (message.type === 'VOTE_UPDATE' && message.data) {
      handlers.onVoteUpdateRef.current();
    } else if (message.type === 'GAME_ENDED' && message.data) {
      if (handlers.onGameEndRef.current) {
        handlers.onGameEndRef.current(message.data);
      }
    }
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
  }
};

export function useGameWebSocket({
  gameId,
  myRole,
  myIsAlive,
  gameState,
  onPhaseChange,
  onPlayerUpdate,
  onChatMessage,
  onVoteUpdate,
  onGameEnd
}: UseGameWebSocketProps) {
  const wsRefs = useRef<{ [key: string]: WebSocket }>({});
  const reconnectTimeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const reconnectAttemptsRefs = useRef<{ [key: string]: number }>({});
  const maxReconnectAttempts = 5;

  const onPhaseChangeRef = useRef(onPhaseChange);
  const onPlayerUpdateRef = useRef(onPlayerUpdate);
  const onChatMessageRef = useRef(onChatMessage);
  const onVoteUpdateRef = useRef(onVoteUpdate);
  const onGameEndRef = useRef(onGameEnd);

  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange;
    onPlayerUpdateRef.current = onPlayerUpdate;
    onChatMessageRef.current = onChatMessage;
    onVoteUpdateRef.current = onVoteUpdate;
    onGameEndRef.current = onGameEnd;
  }, [onPhaseChange, onPlayerUpdate, onChatMessage, onVoteUpdate, onGameEnd]);

  useEffect(() => {
    if (!myRole) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const wsBaseUrl = apiUrl.replace(/^http/, 'ws');
    const isManualCloseRef = { current: false };

    // 연결할 웹소켓 채널 결정
    const channels: string[] = ['all', 'events']; // all: 채팅, events: 게임 이벤트 (페이즈 변경, 플레이어 사망 등)

    if (!myIsAlive) {
      channels.push('dead'); // 죽은 플레이어는 dead 채널 추가
    } else if (myRole === GameRole.MAFIA) {
      channels.push('mafia'); // 살아있는 마피아는 mafia 채널 추가
    }

    const handlers: WebSocketHandlers = {
      onPhaseChangeRef,
      onPlayerUpdateRef,
      onChatMessageRef,
      onVoteUpdateRef,
      onGameEndRef
    };

    const connectWebSocket = (channel: string) => {
      if (wsRefs.current[channel] &&
          (wsRefs.current[channel].readyState === WebSocket.OPEN ||
           wsRefs.current[channel].readyState === WebSocket.CONNECTING)) {
        return;
      }

      if (!reconnectAttemptsRefs.current[channel]) {
        reconnectAttemptsRefs.current[channel] = 0;
      }

      const wsUrl = `${wsBaseUrl}/ws/games/${gameId}/${channel}`;
      const ws = new WebSocket(wsUrl);
      wsRefs.current[channel] = ws;

      ws.onopen = () => {
        reconnectAttemptsRefs.current[channel] = 0;
      };

      ws.onmessage = createMessageHandler(handlers);
      ws.onerror = (error) => console.error(`WebSocket [${channel}] error:`, error);
      ws.onclose = (event: CloseEvent) => {
        if (!isManualCloseRef.current && reconnectAttemptsRefs.current[channel] < maxReconnectAttempts) {
          reconnectAttemptsRefs.current[channel]++;
          const delay = getReconnectDelay(reconnectAttemptsRefs.current[channel]);

          reconnectTimeoutRefs.current[channel] = setTimeout(() => connectWebSocket(channel), delay);
        } else if (reconnectAttemptsRefs.current[channel] >= maxReconnectAttempts) {
          console.error(`Max reconnection attempts reached for [${channel}]`);
        }
      };
    };

    // 각 채널에 연결
    channels.forEach(channel => connectWebSocket(channel));

    return () => {
      isManualCloseRef.current = true;

      // 모든 재연결 타이머 정리
      Object.values(reconnectTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });

      // 모든 웹소켓 연결 종료
      Object.values(wsRefs.current).forEach(ws => {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          ws.close();
        }
      });

      // refs 초기화
      wsRefs.current = {};
      reconnectTimeoutRefs.current = {};
      reconnectAttemptsRefs.current = {};
    };
  }, [gameId, myRole, myIsAlive]);

  return wsRefs;
}
