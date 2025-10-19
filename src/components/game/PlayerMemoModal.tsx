import { useState } from 'react';
import { PlayerWithVotes } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { GameRole } from '@/types/game.type';

interface PlayerMemoModalProps {
  players: PlayerWithVotes[];
  isOpen: boolean;
  onClose: () => void;
  getMemo: (playerId: string) => string;
  saveMemo: (playerId: string, memo: string) => void;
}

const ROLES = [
  { value: GameRole.CITIZEN, label: '시민', emoji: '👤', color: 'bg-blue-500/20 border-blue-500' },
  { value: GameRole.MAFIA, label: '마피아', emoji: '🔫', color: 'bg-red-500/20 border-red-500' },
  { value: GameRole.DOCTOR, label: '의사', emoji: '⚕️', color: 'bg-green-500/20 border-green-500' },
  { value: GameRole.POLICE, label: '경찰', emoji: '👮', color: 'bg-yellow-500/20 border-yellow-500' },
];

export function PlayerMemoModal({
  players,
  isOpen,
  onClose,
  getMemo,
  saveMemo
}: PlayerMemoModalProps) {
  const [selectingPlayerId, setSelectingPlayerId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenRoleSelect = (playerId: string) => {
    setSelectingPlayerId(playerId);
  };

  const handleSelectRole = (playerId: string, role: string) => {
    saveMemo(playerId, role);
    setSelectingPlayerId(null);
  };

  const handleClearRole = (playerId: string) => {
    saveMemo(playerId, '');
    setSelectingPlayerId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">플레이어 메모</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:text-destructive transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1">
          {players.map((player) => {
            const isSelecting = selectingPlayerId === player.userId;
            const selectedRole = getMemo(player.userId!);
            const roleInfo = ROLES.find(r => r.value === selectedRole);

            return (
              <div
                key={player.userId}
                className="bg-card/50 rounded-xl p-3 border border-border/30"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                    {player.isAlive ? player.position : '💀'}
                  </div>
                  <span className="font-semibold text-sm flex-1">
                    {player.username}
                  </span>
                  {!player.isAlive && (
                    <span className="text-xs text-muted-foreground">사망</span>
                  )}
                </div>

                {isSelecting ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {ROLES.map((role) => (
                        <button
                          key={role.value}
                          onClick={() => handleSelectRole(player.userId!, role.value)}
                          className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${role.color}`}
                        >
                          <div className="text-lg">{role.emoji}</div>
                          <div className="text-xs font-medium">{role.label}</div>
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={() => handleClearRole(player.userId!)}
                      className="w-full h-8 text-xs bg-muted hover:bg-muted/80"
                    >
                      초기화
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => handleOpenRoleSelect(player.userId!)}
                    className="cursor-pointer hover:bg-muted/30 rounded p-2 min-h-[32px] transition-colors flex items-center justify-center"
                  >
                    {roleInfo ? (
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border-2 ${roleInfo.color}`}>
                        <span>{roleInfo.emoji}</span>
                        <span className="text-sm font-medium">{roleInfo.label}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">클릭하여 직업 선택</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
