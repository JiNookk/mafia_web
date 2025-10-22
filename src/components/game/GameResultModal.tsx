'use client';

import { useEffect } from 'react';

interface GameResultModalProps {
  isOpen: boolean;
  winnerTeam: 'CITIZEN' | 'MAFIA' | null;
  onClose: () => void;
}

export function GameResultModal({ isOpen, winnerTeam, onClose }: GameResultModalProps) {
  useEffect(() => {
    if (isOpen) {
      // 3초 후 자동으로 닫기 (방으로 리다이렉트)
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !winnerTeam) return null;

  const isCitizenWin = winnerTeam === 'CITIZEN';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700 animate-fadeIn">
        <div className="text-center">
          {/* 승리 팀 아이콘 */}
          <div className="mb-6">
            {isCitizenWin ? (
              <div className="text-6xl mb-4">👨‍⚖️</div>
            ) : (
              <div className="text-6xl mb-4">🎭</div>
            )}
          </div>

          {/* 승리 메시지 */}
          <h2 className={`text-3xl font-bold mb-4 ${isCitizenWin ? 'text-blue-400' : 'text-red-400'}`}>
            {isCitizenWin ? '시민팀 승리!' : '마피아팀 승리!'}
          </h2>

          <p className="text-gray-300 mb-6">
            {isCitizenWin
              ? '정의가 승리했습니다!'
              : '어둠이 마을을 집어삼켰습니다...'}
          </p>

          {/* 자동 종료 안내 */}
          <div className="text-sm text-gray-400">
            잠시 후 방으로 돌아갑니다...
          </div>
        </div>
      </div>
    </div>
  );
}