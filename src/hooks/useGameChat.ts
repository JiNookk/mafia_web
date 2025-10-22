import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { gameService } from '@/services/game';
import { ChatMessageDto, ChatType } from '@/types/room.type';

const getChatTypeParam = (chatType: ChatType): string => {
  switch (chatType) {
    case ChatType.GAME_ALL:
      return 'all';
    case ChatType.GAME_MAFIA:
      return 'mafia';
    case ChatType.GAME_DEAD:
      return 'dead';
    default:
      return 'all';
  }
};

export function useGameChat(gameId: string, myUserId: string, currentChatType: ChatType) {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        // 현재 채팅 타입의 히스토리만 로드
        const chatTypeParam = getChatTypeParam(currentChatType);
        const response = await gameService.getGameChatHistory(gameId, chatTypeParam, myUserId);

        if (response.success && response.data) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, [gameId, myUserId, currentChatType]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      const chatTypeParam = getChatTypeParam(currentChatType);
      const response = await gameService.sendGameChat(gameId, chatTypeParam, {
        userId: myUserId,
        chatType: currentChatType,
        message: inputMessage.trim()
      });

      if (response.success) {
        setInputMessage('');
      } else {
        toast.error(response.error || '메시지 전송에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('메시지 전송에 실패했습니다');
    }
  };

  const addMessage = (message: ChatMessageDto) => {
    setMessages(prev => {
      // 중복 메시지 방지 (ID 기반)
      if (prev.some(msg => msg.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    chatContainerRef,
    handleSendMessage,
    addMessage
  };
}
