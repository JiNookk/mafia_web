import { useState, useEffect, useRef } from 'react';
import { GameStateResponse } from '@/types/game.type';

export function useGameTimer(gameState: GameStateResponse | null) {
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!gameState) return;

    const calculateRemainingTime = () => {
      if (!gameState.phaseStartTime || !gameState.phaseDurationSeconds) return 0;
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
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState]);

  return timer;
}
