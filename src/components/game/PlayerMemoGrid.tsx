import { useState } from 'react';
import { GamePlayerResponse } from '@/types/game.type';
import { Input } from '@/components/ui/input';

interface PlayerMemoGridProps {
  players: GamePlayerResponse[];
  getMemo: (playerId: string) => string;
  saveMemo: (playerId: string, memo: string) => void;
}

export function PlayerMemoGrid({ players, getMemo, saveMemo }: PlayerMemoGridProps) {
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [tempMemo, setTempMemo] = useState('');

  const handleCardClick = (playerId: string) => {
    setEditingPlayerId(playerId);
    setTempMemo(getMemo(playerId));
  };

  const handleSave = () => {
    if (editingPlayerId) {
      saveMemo(editingPlayerId, tempMemo);
      setEditingPlayerId(null);
      setTempMemo('');
    }
  };

  const handleCancel = () => {
    setEditingPlayerId(null);
    setTempMemo('');
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-2 p-3">
        {players.map((player) => {
          const memo = getMemo(player.userId!);
          const isEditing = editingPlayerId === player.userId;

          return (
            <div
              key={player.userId}
              onClick={() => !isEditing && handleCardClick(player.userId!)}
              className={`
                relative rounded-xl p-2 text-center transition-all border
                ${isEditing ? 'bg-primary/30 border-2 border-primary' : 'bg-card/50 hover:bg-card/70 border-border/30'}
                ${!player.isAlive ? 'opacity-60' : 'cursor-pointer'}
              `}
            >
              {/* 메모 표시 (오른쪽 상단) */}
              {memo && !isEditing && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-warning rounded-full flex items-center justify-center">
                  <span className="text-[10px]">!</span>
                </div>
              )}

              {/* 플레이어 이름 */}
              <div className="text-sm font-medium truncate py-1">{player.username}</div>

              {/* 메모 표시 (카드 하단) */}
              {memo && !isEditing && (
                <div className="text-xs text-warning truncate">
                  {memo}
                </div>
              )}

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

      {/* 메모 편집 영역 */}
      {editingPlayerId && (
        <div className="p-3 bg-card border-t border-border/50">
          <div className="space-y-2">
            <Input
              value={tempMemo}
              onChange={(e) => setTempMemo(e.target.value)}
              placeholder="직업이나 메모 입력..."
              className="text-sm h-9"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm"
              >
                저장
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 h-8 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
