import { useState, useEffect } from 'react';
import { GameRole } from '@/types/game.type';

interface PlayerMemo {
  [playerId: string]: string;
}

interface LockedMemos {
  [playerId: string]: boolean;
}

export function usePlayerMemo(gameId: string) {
  const [memos, setMemos] = useState<PlayerMemo>({});
  const [lockedMemos, setLockedMemos] = useState<LockedMemos>({});

  const storageKey = `mafia_memo_${gameId}`;
  const lockedKey = `mafia_memo_locked_${gameId}`;

  // 로컬 스토리지에서 메모 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMemos(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load memos:', error);
      }
    }

    const savedLocked = localStorage.getItem(lockedKey);
    if (savedLocked) {
      try {
        setLockedMemos(JSON.parse(savedLocked));
      } catch (error) {
        console.error('Failed to load locked memos:', error);
      }
    }
  }, [storageKey, lockedKey]);

  // 메모 저장
  const saveMemo = (playerId: string, memo: string) => {
    // 잠긴 메모는 수정 불가
    if (lockedMemos[playerId]) {
      console.warn('Cannot modify locked memo for player:', playerId);
      return;
    }

    const newMemos = { ...memos, [playerId]: memo };
    setMemos(newMemos);

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(newMemos));
    }
  };

  // 메모 가져오기
  const getMemo = (playerId: string): string => {
    return memos[playerId] || '';
  };

  // 조사 결과를 메모에 추가 (읽기 전용)
  const addPoliceCheckMemo = (playerId: string, targetUsername: string, targetRole: string) => {
    // 기존 메모 이모티콘 사용
    const roleEmoji = targetRole === 'MAFIA' ? GameRole.MAFIA :
                      targetRole === 'POLICE' ? GameRole.POLICE :
                      targetRole === 'DOCTOR' ? GameRole.DOCTOR : GameRole.CITIZEN;

    const newMemos = { ...memos, [playerId]: roleEmoji };
    const newLockedMemos = { ...lockedMemos, [playerId]: true };

    setMemos(newMemos);
    setLockedMemos(newLockedMemos);

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(newMemos));
      localStorage.setItem(lockedKey, JSON.stringify(newLockedMemos));
    }
  };

  // 메모가 잠겨있는지 확인
  const isLocked = (playerId: string): boolean => {
    return lockedMemos[playerId] || false;
  };

  // 여러 조사 결과를 한번에 추가
  const loadPoliceCheckResults = (results: Array<{targetUserId: string, targetRole: string}>) => {
    const newMemos = { ...memos };
    const newLockedMemos = { ...lockedMemos };

    results.forEach(result => {
      const roleEmoji = result.targetRole === 'MAFIA' ? GameRole.MAFIA :
                        result.targetRole === 'POLICE' ? GameRole.POLICE :
                        result.targetRole === 'DOCTOR' ? GameRole.DOCTOR : GameRole.CITIZEN;

      newMemos[result.targetUserId] = roleEmoji;
      newLockedMemos[result.targetUserId] = true;
    });

    setMemos(newMemos);
    setLockedMemos(newLockedMemos);

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(newMemos));
      localStorage.setItem(lockedKey, JSON.stringify(newLockedMemos));
    }
  };

  return {
    memos,
    saveMemo,
    getMemo,
    addPoliceCheckMemo,
    loadPoliceCheckResults,
    isLocked
  };
}
