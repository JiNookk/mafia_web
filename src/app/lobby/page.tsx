'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { roomsService } from '@/services/rooms';
import { RoomSummary } from '@/types/room.type';
import { authService } from '@/services/auth';

export default function LobbyPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 방 목록 로드
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const response = await roomsService.getLists();

      if (response.success && response.data) {
        setRooms(response.data.list);
      } else {
        toast.error(response.error || '방 목록을 불러오는데 실패했습니다');
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
      console.error('Load rooms error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) {
      toast.error('방 제목을 입력해주세요');
      return;
    }

    const username = localStorage.getItem('mafia_nickname');
    if (!username) {
      toast.error('닉네임 정보가 없습니다');
      router.push('/entry');
      return;
    }

    try {
      const response = await roomsService.createRoom({
        username,
        roomName: newRoomTitle,
      });

      if (response.success && response.data) {
        toast.success('방이 생성되었습니다');
        router.push(`/rooms/${response.data.id}`);
      } else {
        toast.error(response.error || '방 생성에 실패했습니다');
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
      console.error('Create room error:', error);
    } finally {
      setNewRoomTitle('');
      setOpen(false);
    }
  };

  const handleJoinRoom = async (room: RoomSummary) => {
    const username = localStorage.getItem('mafia_nickname');
    if (!username) {
      toast.error('로그인 정보가 없습니다');
      router.push('/entry');
      return;
    }

    try {
      const response = await roomsService.joinRoom(room.id, username);

      if (response.success && response.data) {
        toast.success('방에 참여했습니다');
        router.push(`/rooms/${room.id}`);
      } else {
        // 백엔드 에러 코드에 따른 처리
        if (response.errorCode === 'ROOM_FULL') {
          toast.error('방이 가득 찼습니다');
        } else if (response.errorCode === 'GAME_ALREADY_STARTED') {
          toast.error('이미 게임이 진행중인 방입니다');
        } else {
          toast.error(response.error || '방 참여에 실패했습니다');
        }
        // 에러 발생 시 방 목록 새로고침
        loadRooms();
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
      console.error('Join room error:', error);
      // 에러 발생 시 방 목록 새로고침
      loadRooms();
    }
  };

  return (
    <div className="mobile-container min-h-screen flex flex-col gradient-bg">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <h1 className="text-2xl font-bold text-primary">방 목록</h1>
        <button className="p-2 hover:bg-card/50 rounded-lg transition-colors">
          <Settings className="w-6 h-6 text-primary" />
        </button>
      </div>

      {/* 방 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 백도어 버튼 */}
        <div
          onClick={() => router.push('/game/test')}
          className="card-mafia rounded-2xl p-4 border-2 border-secondary/50 hover:border-secondary active:scale-[0.98] transition-all cursor-pointer animate-fade-in"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-base text-secondary">🔓 테스트 게임 (백도어)</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary/20 text-secondary border border-secondary/30">
              개발자용
            </span>
          </div>
          <div className="flex justify-between text-sm text-secondary/70">
            <span>바로 게임 시작</span>
            <span>테스트 모드</span>
          </div>
        </div>

        {/* 일반 방 목록 */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            로딩 중...
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            생성된 방이 없습니다
          </div>
        ) : (
          rooms.map((room, index) => (
            <div
              key={room.id}
              onClick={() => handleJoinRoom(room)}
              className="card-mafia rounded-2xl p-4 hover:bg-card active:scale-[0.98] transition-all cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-base">{room.name}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  room.status === 'AVAILABLE'
                    ? 'bg-secondary/20 text-secondary border border-secondary/30'
                    : room.status === 'IN_GAME'
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted-foreground/20 text-muted-foreground border border-muted-foreground/30'
                }`}>
                  {room.status === 'AVAILABLE' ? '대기중' : room.status === 'IN_GAME' ? '게임중' : '풀방'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>👥 {room.currentPlayers}/{room.maxPlayers}명</span>
                <span>일반 게임</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 방 만들기 버튼 */}
      <div className="p-4">
        <button
          onClick={() => setOpen(true)}
          className="w-full card-mafia rounded-2xl p-4 border-2 border-primary/50 hover:border-primary active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg text-primary">방 만들기</span>
          </div>
        </button>
      </div>

      {/* 방 만들기 모달 */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-50 animate-fade-in">
            <div className="card-mafia rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-center text-primary">방 만들기</h3>
              <Input
                placeholder="방 제목 입력"
                value={newRoomTitle}
                onChange={(e) => setNewRoomTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                className="w-full h-12 bg-background/50 border-border/30"
                autoFocus
              />
              <p className="text-sm text-muted-foreground text-center">
                8명이 모이면 게임이 시작됩니다
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 h-12 rounded-xl bg-background/50 hover:bg-background/70 border border-border/30 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="flex-1 h-12 rounded-xl gradient-primary shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-transform font-medium"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
