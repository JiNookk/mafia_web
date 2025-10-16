import { useState, useEffect } from 'react';

interface PlayerMemo {
  [playerId: string]: string;
}

export function usePlayerMemo(gameId: string) {
  const [memos, setMemos] = useState<PlayerMemo>({});

  const storageKey = `mafia_memo_${gameId}`;

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
  }, [storageKey]);

  // 메모 저장
  const saveMemo = (playerId: string, memo: string) => {
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

  return {
    memos,
    saveMemo,
    getMemo
  };
}
