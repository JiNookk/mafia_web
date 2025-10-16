'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { roomsService } from '@/services/rooms';
import { gameService } from '@/services/game';
import { RoomDetailResponse, ChatMessageDto, ChatType } from '@/types/room.type';

export default function WaitingRoom() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const myNickname = typeof window !== 'undefined' ? localStorage.getItem('mafia_nickname') || 'Player' : 'Player';
  const myUserId = typeof window !== 'undefined' ? localStorage.getItem('mafia_session_id') || '' : '';

  const [roomDetail, setRoomDetail] = useState<RoomDetailResponse | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessageDto[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // 방 상세 정보 로드
  useEffect(() => {
    const loadRoomDetail = async () => {
      try {
        const response = await roomsService.getRoomDetail(roomId);
        console.log('Room detail response:', response);

        if (response.success && response.data) {
          setRoomDetail(response.data);
          const hostMember = response.data.members.find(m => m.role === 'HOST');
          setIsHost(hostMember?.userId === myUserId);
        } else {
          console.error('Failed to load room detail:', response.error);
          toast.error(response.error || '방 정보를 불러오지 못했습니다');
          setTimeout(() => {
            window.location.href = '/lobby';
          }, 1000);
        }
      } catch (error) {
        console.error('Error loading room detail:', error);
        toast.error('네트워크 오류가 발생했습니다');
        setTimeout(() => {
          window.location.href = '/lobby';
        }, 1000);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoomDetail();
  }, [roomId, myUserId, router]);

  // 채팅 히스토리 로드
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await roomsService.getChatHistory(roomId, myUserId, ChatType.ALL);
        if (response.success && response.data) {
          setChatMessages(response.data);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    if (myUserId) {
      loadChatHistory();
    }
  }, [roomId, myUserId]);

  // WebSocket 연결
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws/rooms/${roomId}`;

    let isManualClose = false;

    const connectWebSocket = () => {
      // 이미 연결되어 있으면 리턴
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        console.log('WebSocket already connected or connecting');
        return;
      }

      console.log(`Attempting to connect WebSocket (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to room:', roomId);
        reconnectAttemptsRef.current = 0; // 연결 성공 시 재시도 횟수 초기화
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'ROOM_UPDATE' && message.data) {
            // 방 정보 업데이트
            setRoomDetail(message.data);
            const hostMember = message.data.members.find((m: any) => m.role === 'HOST');
            setIsHost(hostMember?.userId === myUserId);
          } else if (message.type === 'CHAT' && message.data) {
            // 채팅 메시지 추가
            setChatMessages(prev => [...prev, message.data]);
          } else if (message.type === 'GAME_STARTED' && message.data) {
            // 게임 시작 - 모든 멤버가 게임 페이지로 이동
            const gameId = message.data.gameId;
            if (gameId) {
              console.log('Game started! Redirecting to game page...', gameId);
              router.push(`/rooms/${roomId}/game/${gameId}`);
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected from room:', roomId, 'Code:', event.code, 'Reason:', event.reason);

        // 수동으로 닫은 경우가 아니고, 재시도 횟수가 남아있으면 재연결 시도
        if (!isManualClose && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 10000); // 지수 백오프 (최대 10초)
          console.log(`Reconnecting in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          toast.error('실시간 연결에 문제가 발생했습니다. 페이지를 새로고침해주세요.');
        }
      };
    };

    connectWebSocket();

    // 연결 해제 처리
    return () => {
      isManualClose = true;

      // 재연결 타이머 정리
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // WebSocket 연결 종료
      if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
        wsRef.current.close();
      }
    };
  }, [roomId, myUserId]);

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleStartGame = async () => {
    if (!roomDetail || roomDetail.currentPlayers < 8) {
      toast.error('8명이 모여야 게임을 시작할 수 있습니다');
      return;
    }

    try {
      const response = await gameService.startGame(roomId);

      if (response.success && response.data) {
        toast.success('게임이 시작되었습니다!');
        router.push(`/rooms/${roomId}/game/${response.data.gameId}`);
      } else {
        toast.error(response.error || '게임 시작에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      toast.error('네트워크 오류가 발생했습니다');
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    console.log('Sending chat message:', {
      roomId,
      userId: myUserId,
      chatType: ChatType.ALL,
      message: chatMessage.trim()
    });

    try {
      const response = await roomsService.sendChat(roomId, {
        userId: myUserId,
        chatType: ChatType.ALL,
        message: chatMessage.trim()
      });

      console.log('Chat send response:', response);

      if (response.success) {
        setChatMessage('');
      } else {
        console.error('Chat send failed:', response.error);
        toast.error(response.error || '메시지 전송에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('메시지 전송에 실패했습니다');
    }
  };

  const handleLeaveRoom = async () => {
    try {
      // WebSocket 연결 먼저 끊기
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }

      const response = await roomsService.leaveRoom(roomId, myUserId);
      if (response.success) {
        toast.success('방을 나갔습니다');
        router.push('/lobby');
      } else {
        toast.error(response.error || '방 나가기에 실패했습니다');
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
      console.error('Leave room error:', error);
    }
  };

  if (isLoading || !roomDetail) {
    return (
      <div className="mobile-container min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="text-primary text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  const emptySlots = roomDetail.maxPlayers - roomDetail.currentPlayers;

  return (
    <div className="mobile-container min-h-screen flex flex-col gradient-bg">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <button onClick={handleLeaveRoom} className="hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-primary">
            {roomDetail.name} ({roomDetail.currentPlayers}/{roomDetail.maxPlayers})
          </h1>
        </div>
        {isHost && (
          <Button
            onClick={handleStartGame}
            className="h-8 px-3 text-xs gradient-primary shadow-glow"
          >
            게임 시작
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* 플레이어 목록 */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {roomDetail.members.map((member, index) => (
              <div
                key={member.userId}
                className={`bg-card/50 rounded-xl p-3 text-center min-h-[100px] flex flex-col justify-center items-center relative animate-fade-in shadow-card ${
                  member.userId === myUserId ? 'ring-2 ring-primary' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {member.role === 'HOST' && (
                  <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                    👑
                  </span>
                )}
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-lg mb-1">
                  👤
                </div>
                <div className="font-semibold text-xs">
                  {member.nickname}
                </div>
              </div>
            ))}

            {Array.from({ length: emptySlots }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="border-2 border-dashed border-border/30 rounded-xl p-3 text-center min-h-[100px] flex items-center justify-center bg-transparent animate-fade-in"
                style={{ animationDelay: `${(roomDetail.currentPlayers + index) * 0.1}s` }}
              >
                <div className="text-muted-foreground text-xs">대기중...</div>
              </div>
            ))}
          </div>
        </div>

        {/* 채팅 영역 */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20"
        >
          {chatMessages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              채팅을 시작해보세요!
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.userId === myUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.userId === myUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1">{msg.nickname}</div>
                  <div className="text-sm">{msg.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 채팅 입력 */}
      <div className="p-4 bg-card border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="메시지를 입력하세요..."
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            className="w-10 h-10 p-0 gradient-primary shadow-glow flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
