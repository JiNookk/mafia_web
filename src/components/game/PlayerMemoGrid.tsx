import { useState } from 'react';
import { GamePlayerResponse, GameRole } from '@/types/game.type';
import { Button } from '@/components/ui/button';

interface PlayerMemoGridProps {
  players: GamePlayerResponse[];
  getMemo: (playerId: string) => string;
  saveMemo: (playerId: string, memo: string) => void;
  isLocked?: (playerId: string) => boolean;
}

const ROLES = [
  { value: GameRole.CITIZEN, label: '시민', emoji: '👤', color: 'bg-blue-500/20 border-blue-500' },
  { value: GameRole.MAFIA, label: '마피아', emoji: '🔫', color: 'bg-red-500/20 border-red-500' },
  { value: GameRole.DOCTOR, label: '의사', emoji: '⚕️', color: 'bg-green-500/20 border-green-500' },
  { value: GameRole.POLICE, label: '경찰', emoji: '👮', color: 'bg-yellow-500/20 border-yellow-500' },
];

export function PlayerMemoGrid({ players, getMemo, saveMemo, isLocked }: PlayerMemoGridProps) {
  const [selectingPlayerId, setSelectingPlayerId] = useState<string | null>(null);

  const handleCardClick = (playerId: string) => {
    // 잠긴 메모는 선택 불가
    if (isLocked && isLocked(playerId)) {
      return;
    }
    setSelectingPlayerId(playerId);
  };

  const handleSelectRole = (role: string) => {
    if (selectingPlayerId) {
      saveMemo(selectingPlayerId, role);
      setSelectingPlayerId(null);
    }
  };

  const handleClearRole = () => {
    if (selectingPlayerId) {
      saveMemo(selectingPlayerId, '');
      setSelectingPlayerId(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-2 p-3">
        {players.map((player) => {
          const selectedRole = getMemo(player.userId!);
          const roleInfo = ROLES.find(r => r.value === selectedRole);
          const locked = isLocked && isLocked(player.userId!);

          return (
            <div
              key={player.userId}
              onClick={() => player.isAlive && handleCardClick(player.userId!)}
              className={`
                relative rounded-xl p-2 text-center transition-all border
                ${locked ? 'bg-primary/10 border-primary' : 'bg-card/50 hover:bg-card/70 border-border/30'}
                ${!player.isAlive ? 'opacity-60' : locked ? '' : 'cursor-pointer'}
              `}
            >
              {/* 직업 표시 (오른쪽 상단) */}
              {roleInfo && (
                <div className="absolute top-1 right-1 text-base">
                  {roleInfo.emoji}
                </div>
              )}

              {/* 플레이어 이름 */}
              <div className="text-sm font-medium truncate py-1">{player.username}</div>

              {/* 사망 표시 */}
              {!player.isAlive && (
                <div className="absolute inset-0 flex items-center justify-center text-xl">
                  ❌
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 직업 선택 모달 */}
      {selectingPlayerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectingPlayerId(null)}>
          <div className="bg-card rounded-xl p-4 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3 text-center">직업 선택</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleSelectRole(role.value)}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${role.color}`}
                >
                  <div className="text-2xl mb-1">{role.emoji}</div>
                  <div className="text-xs font-medium">{role.label}</div>
                </button>
              ))}
            </div>
            <Button
              onClick={handleClearRole}
              className="w-full h-8 text-xs bg-muted hover:bg-muted/80"
            >
              초기화
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
