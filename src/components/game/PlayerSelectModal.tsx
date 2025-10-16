import { PlayerWithVotes } from '@/hooks/useGameState';

interface PlayerSelectModalProps {
  players: PlayerWithVotes[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (playerId: string) => void;
  title: string;
  selectedPlayerId?: string | null;
  showOnlyAlive?: boolean;
}

export function PlayerSelectModal({
  players,
  isOpen,
  onClose,
  onSelect,
  title,
  selectedPlayerId,
  showOnlyAlive = false
}: PlayerSelectModalProps) {
  if (!isOpen) return null;

  const filteredPlayers = showOnlyAlive
    ? players.filter(p => p.isAlive)
    : players;

  const handleSelect = (playerId: string) => {
    onSelect(playerId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:text-destructive transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
          {filteredPlayers.map((player) => (
            <button
              key={player.userId}
              onClick={() => handleSelect(player.userId)}
              className={`
                relative rounded-xl p-3 text-center transition-all
                ${selectedPlayerId === player.userId
                  ? 'bg-primary/30 border-2 border-primary scale-105'
                  : 'bg-card/50 hover:bg-card/70'
                }
                ${!player.isAlive ? 'opacity-40' : 'active:scale-95'}
              `}
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-1 text-base">
                {player.isAlive ? player.position : '💀'}
              </div>
              <div className="text-xs truncate">{player.username}</div>
              {!player.isAlive && (
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  ❌
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
