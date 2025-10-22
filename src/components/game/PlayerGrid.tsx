import { GamePhase } from '@/types/game.type';
import { PlayerWithVotes } from '@/hooks/useGameState';

interface PlayerGridProps {
  players: PlayerWithVotes[];
  selectedPlayer: string | null;
  currentPhase?: GamePhase;
  myIsAlive: boolean;
  onPlayerClick: (playerId: string, playerAlive: boolean) => void;
}

export function PlayerGrid({
  players,
  selectedPlayer,
  currentPhase,
  myIsAlive,
  onPlayerClick
}: PlayerGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {players.map((player, index) => (
        <div
          key={player.userId}
          onClick={() => onPlayerClick(player.userId!, player.isAlive!)}
          className={`
            bg-card/50 rounded-xl p-3 text-center transition-all cursor-pointer relative
            ${selectedPlayer === player.userId ? 'bg-primary/30 border-2 border-primary' : ''}
            ${!player.isAlive ? 'opacity-40 bg-destructive/10' : 'hover:bg-card/70 active:scale-95'}
            animate-fade-in
          `}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {currentPhase === GamePhase.VOTE && player.voteCount > 0 && player.isAlive && (
            <div className="absolute top-1 right-1 bg-destructive text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
              {player.voteCount}
            </div>
          )}
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-1 text-lg">
            {player.isAlive ? player.position : '💀'}
          </div>
          <div className="text-xs truncate">{player.username}</div>
          {!player.isAlive && (
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              ❌
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
