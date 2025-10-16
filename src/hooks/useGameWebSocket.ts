import { useEffect, useRef } from 'react';
import { GamePlayerResponse, GamePhase, GameStateResponse } from '@/types/game.type';
import { ChatMessageDto } from '@/types/room.type';

interface PhaseChangeData {
  currentPhase: GamePhase;
  dayCount: number;
  phaseStartTime: string;
  phaseDurationSeconds: number;
}

interface UseGameWebSocketProps {
  roomId: string;
  gameState: GameStateResponse | null;
  onPhaseChange: (data: PhaseChangeData) => void;
  onPlayerUpdate: (data: GamePlayerResponse) => void;
  onChatMessage: (message: ChatMessageDto) => void;
  onVoteUpdate: () => void;
}

interface WebSocketHandlers {
  onPhaseChangeRef: React.MutableRefObject<(data: PhaseChangeData) => void>;
  onPlayerUpdateRef: React.MutableRefObject<(data: GamePlayerResponse) => void>;
  onChatMessageRef: React.MutableRefObject<(message: ChatMessageDto) => void>;
  onVoteUpdateRef: React.MutableRefObject<() => void>;
}

const getReconnectDelay = (attemptNumber: number): number => {
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 10000);
};

const createMessageHandler = (handlers: WebSocketHandlers) => (event: MessageEvent) => {
  try {
    const message = JSON.parse(event.data);

    if (message.type === 'PHASE_CHANGE' && message.data) {
      handlers.onPhaseChangeRef.current(message.data);
    } else if (message.type === 'PLAYER_UPDATE' && message.data) {
      handlers.onPlayerUpdateRef.current(message.data);
    } else if (message.type === 'CHAT' && message.data) {
      handlers.onChatMessageRef.current(message.data);
    } else if (message.type === 'VOTE_UPDATE' && message.data) {
      handlers.onVoteUpdateRef.current();
    }
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
  }
};

const createCloseHandler = (
  roomId: string,
  isManualCloseRef: { current: boolean },
  reconnectAttemptsRef: React.MutableRefObject<number>,
  reconnectTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  connectWebSocket: () => void,
  maxReconnectAttempts: number
) => (event: CloseEvent) => {
  console.log('WebSocket disconnected from game room:', roomId, 'Code:', event.code);

  if (!isManualCloseRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
    reconnectAttemptsRef.current++;
    const delay = getReconnectDelay(reconnectAttemptsRef.current);
    console.log(`Reconnecting in ${delay}ms...`);

    reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
  } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
    console.error('Max reconnection attempts reached');
  }
};

export function useGameWebSocket({
  roomId,
  gameState,
  onPhaseChange,
  onPlayerUpdate,
  onChatMessage,
  onVoteUpdate
}: UseGameWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const onPhaseChangeRef = useRef(onPhaseChange);
  const onPlayerUpdateRef = useRef(onPlayerUpdate);
  const onChatMessageRef = useRef(onChatMessage);
  const onVoteUpdateRef = useRef(onVoteUpdate);

  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange;
    onPlayerUpdateRef.current = onPlayerUpdate;
    onChatMessageRef.current = onChatMessage;
    onVoteUpdateRef.current = onVoteUpdate;
  }, [onPhaseChange, onPlayerUpdate, onChatMessage, onVoteUpdate]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws/rooms/${roomId}`;
    const isManualCloseRef = { current: false };

    const handlers: WebSocketHandlers = {
      onPhaseChangeRef,
      onPlayerUpdateRef,
      onChatMessageRef,
      onVoteUpdateRef
    };

    const connectWebSocket = () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        console.log('WebSocket already connected or connecting');
        return;
      }

      console.log(`Attempting to connect WebSocket (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to game room:', roomId);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = createMessageHandler(handlers);
      ws.onerror = (error) => console.error('WebSocket error:', error);
      ws.onclose = createCloseHandler(
        roomId,
        isManualCloseRef,
        reconnectAttemptsRef,
        reconnectTimeoutRef,
        connectWebSocket,
        maxReconnectAttempts
      );
    };

    connectWebSocket();

    return () => {
      isManualCloseRef.current = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
    };
  }, [roomId]);

  return wsRef;
}
