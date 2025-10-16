import { useState, useEffect, useRef } from 'react';
import { GameStateResponse } from '@/types/game.type';

export function useGameTimer(gameState: GameStateResponse | null, onTimerEnd?: () => void) {
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledTimerEndRef = useRef(false);
  const onTimerEndRef = useRef(onTimerEnd);

  // onTimerEnd 콜백 최신 상태 유지
  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  }, [onTimerEnd]);

  useEffect(() => {
    if (!gameState) return;

    // 페이즈가 변경되면 플래그 초기화
    hasCalledTimerEndRef.current = false;

    const calculateRemainingTime = () => {
      const startTime = new Date(gameState.phaseStartTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, gameState.phaseDurationSeconds - elapsed);
      return remaining;
    };

    setTimer(calculateRemainingTime());

    timerIntervalRef.current = setInterval(() => {
      const remaining = calculateRemainingTime();
      setTimer(remaining);

      // 타이머 종료 시 한 번만 호출
      if (remaining === 0 && !hasCalledTimerEndRef.current) {
        hasCalledTimerEndRef.current = true;
        if (onTimerEndRef.current) {
          onTimerEndRef.current();
        }
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState]);

  return timer;
}
