import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { roomsService } from '@/services/rooms';
import { ChatMessageDto, ChatType } from '@/types/room.type';

export function useGameChat(roomId: string, myUserId: string) {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await roomsService.getChatHistory(roomId, myUserId, ChatType.ALL);
        if (response.success && response.data) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, [roomId, myUserId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      const response = await roomsService.sendChat(roomId, {
        userId: myUserId,
        chatType: ChatType.ALL,
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
