import { useState } from 'react';
import { PlayerWithVotes } from '@/hooks/useGameState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PlayerMemoModalProps {
  players: PlayerWithVotes[];
  isOpen: boolean;
  onClose: () => void;
  getMemo: (playerId: string) => string;
  saveMemo: (playerId: string, memo: string) => void;
}

export function PlayerMemoModal({
  players,
  isOpen,
  onClose,
  getMemo,
  saveMemo
}: PlayerMemoModalProps) {
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [tempMemo, setTempMemo] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (playerId: string) => {
    setEditingPlayerId(playerId);
    setTempMemo(getMemo(playerId));
  };

  const handleSave = (playerId: string) => {
    saveMemo(playerId, tempMemo);
    setEditingPlayerId(null);
    setTempMemo('');
  };

  const handleCancel = () => {
    setEditingPlayerId(null);
    setTempMemo('');
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
            const isEditing = editingPlayerId === player.userId;
            const memo = getMemo(player.userId);

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

                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={tempMemo}
                      onChange={(e) => setTempMemo(e.target.value)}
                      placeholder="직업이나 메모 입력..."
                      className="text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSave(player.userId)}
                        className="flex-1 h-8 text-xs"
                      >
                        저장
                      </Button>
                      <Button
                        onClick={handleCancel}
                        className="flex-1 h-8 text-xs bg-muted hover:bg-muted/80"
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleStartEdit(player.userId)}
                    className="cursor-pointer hover:bg-muted/30 rounded p-2 min-h-[32px] transition-colors"
                  >
                    {memo ? (
                      <p className="text-sm">{memo}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">클릭하여 메모 추가</p>
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
