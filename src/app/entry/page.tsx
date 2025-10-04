'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { authService } from '@/services/auth';

export default function EntryPage() {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    if (!nickname.trim()) {
      toast.error('닉네임을 입력해주세요');
      return;
    }
    if (nickname.length > 10) {
      toast.error('닉네임은 최대 10자까지 가능합니다');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.signup(nickname);

      if (response.success && response.data) {
        // 세션 정보를 로컬스토리지에 저장
        localStorage.setItem('mafia_session_id', response.data.sessionId);
        localStorage.setItem('mafia_nickname', response.data.nickname);

        toast.success(`환영합니다, ${response.data.nickname}님!`);
        router.push('/lobby');
      } else {
        toast.error(response.error || '회원가입에 실패했습니다');
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-container min-h-screen flex flex-col items-center justify-center p-5 gradient-bg">
      {/* 타이틀 */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-7xl font-black mb-2 text-primary neon-text tracking-wider">
          MAFIA
        </h1>
        <div className="text-4xl font-bold text-secondary" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}>
          Online
        </div>
      </div>

      {/* 메인 카드 */}
      <div className="w-full max-w-[340px] card-mafia rounded-2xl p-8 animate-slide-up">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              닉네임
            </label>
            <Input
              type="text"
              placeholder="최대 10자"
              maxLength={10}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleStart()}
              disabled={isLoading}
              className="input-primary text-base"
            />
          </div>

          <Button
            onClick={handleStart}
            disabled={isLoading}
            className="btn-gradient text-base"
          >
            {isLoading ? '로딩 중...' : '게임 시작'}
          </Button>
        </div>

        {/* 구분선 */}
        <div className="my-6 border-t border-border/50"></div>

        {/* 게임 정보 */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">온라인 마피아 추리 게임</p>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-medium">
              8인 멀티플레이어
            </span>
          </div>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="mt-8 text-center animate-fade-in">
        <p className="text-xs text-muted-foreground/60">
          밤과 낮이 번갈아 찾아오는 마을에서
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          숨겨진 마피아를 찾아내세요
        </p>
      </div>
    </div>
  );
}
