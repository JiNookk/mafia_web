'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { roomsService } from '@/services/rooms';
import { RoomSummary } from '@/types/room.type';

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

  const handleCreateRoom = () => {
    if (!newRoomTitle.trim()) {
      toast.error('방 제목을 입력해주세요');
      return;
    }
    // TODO: API 연동 필요
    toast.success('방 생성 API 연동 예정');
    setNewRoomTitle('');
    setOpen(false);
  };

  const handleJoinRoom = (room: RoomSummary) => {
    if (room.status === '게임중') {
      toast.error('이미 게임이 진행중인 방입니다');
      return;
    }
    if (room.status === '풀방') {
      toast.error('방이 가득 찼습니다');
      return;
    }
    router.push(`/room/${room.id}`);
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
                <span className="font-semibold text-base">{room.title}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  room.status === '대기중'
                    ? 'bg-secondary/20 text-secondary border border-secondary/30'
                    : room.status === '게임중'
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted-foreground/20 text-muted-foreground border border-muted-foreground/30'
                }`}>
                  {room.status}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>👥 {room.players}/{room.maxPlayers}명</span>
                <span>일반 게임</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 방 만들기 버튼 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full gradient-primary shadow-glow hover:scale-110 active:scale-95 transition-transform z-10 flex items-center justify-center"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-center text-primary">방 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="방 제목 입력"
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              className="input-primary text-base"
            />
            <p className="text-sm text-muted-foreground text-center">
              8명이 모이면 게임이 시작됩니다
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setOpen(false)}
                className="flex-1 h-12 border border-border hover:bg-card/50 transition-colors"
              >
                취소
              </Button>
              <Button
                onClick={handleCreateRoom}
                className="flex-1 btn-gradient text-base"
              >
                생성
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
