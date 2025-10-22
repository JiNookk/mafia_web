import { useCallback, useRef, useEffect } from 'react';

export function useDeathSound() {
  const deathAudioRef = useRef<HTMLAudioElement | null>(null);
  const healAudioRef = useRef<HTMLAudioElement | null>(null);
  const voteDeathAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 오디오 객체 생성 및 프리로드
    deathAudioRef.current = new Audio('/sounds/death.mp3');
    deathAudioRef.current.preload = 'auto';
    deathAudioRef.current.volume = 0.5; // 볼륨 50%

    healAudioRef.current = new Audio('/sounds/heal.mp3');
    healAudioRef.current.preload = 'auto';
    healAudioRef.current.volume = 0.5; // 볼륨 50%

    voteDeathAudioRef.current = new Audio('/sounds/vote_death.mp3');
    voteDeathAudioRef.current.preload = 'auto';
    voteDeathAudioRef.current.volume = 0.5; // 볼륨 50%

    return () => {
      if (deathAudioRef.current) {
        deathAudioRef.current.pause();
        deathAudioRef.current = null;
      }
      if (healAudioRef.current) {
        healAudioRef.current.pause();
        healAudioRef.current = null;
      }
      if (voteDeathAudioRef.current) {
        voteDeathAudioRef.current.pause();
        voteDeathAudioRef.current = null;
      }
    };
  }, []);

  const playDeathSound = useCallback(() => {
    try {
      if (deathAudioRef.current) {
        // 오디오를 처음부터 재생
        deathAudioRef.current.currentTime = 0;
        deathAudioRef.current.play().catch(error => {
          console.error('Failed to play death sound:', error);
        });
      }
    } catch (error) {
      console.error('Failed to play death sound:', error);
    }
  }, []);

  const playHealSound = useCallback(() => {
    try {
      if (healAudioRef.current) {
        // 오디오를 처음부터 재생
        healAudioRef.current.currentTime = 0;
        healAudioRef.current.play().catch(error => {
          console.error('Failed to play heal sound:', error);
        });
      }
    } catch (error) {
      console.error('Failed to play heal sound:', error);
    }
  }, []);

  const playVoteDeathSound = useCallback(() => {
    try {
      if (voteDeathAudioRef.current) {
        // 오디오를 처음부터 재생
        voteDeathAudioRef.current.currentTime = 0;
        voteDeathAudioRef.current.play().catch(error => {
          console.error('Failed to play vote death sound:', error);
        });
      }
    } catch (error) {
      console.error('Failed to play vote death sound:', error);
    }
  }, []);

  return { playDeathSound, playHealSound, playVoteDeathSound };
}
