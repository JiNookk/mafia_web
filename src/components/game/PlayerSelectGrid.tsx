import { GamePlayerResponse } from '@/types/game.type';

interface PlayerSelectGridProps {
  players: GamePlayerResponse[];
  onSelectPlayer: (playerId: string) => void;
}

export function PlayerSelectGrid({ players, onSelectPlayer }: PlayerSelectGridProps) {
  const alivePlayers = players.filter(p => p.isAlive === true);

  console.log('👥 PlayerSelectGrid - All players:', players.map(p => ({
    username: p.username,
    isAlive: p.isAlive
  })));
  console.log('✅ PlayerSelectGrid - Alive players:', alivePlayers.map(p => p.username));

  return (
    <div className="grid grid-cols-4 gap-2 p-3">
      {alivePlayers.map((player) => (
        <button
          key={player.userId}
          onClick={() => onSelectPlayer(player.userId!)}
          className="relative rounded-xl p-2 text-center transition-all bg-card/50 hover:bg-card/70 active:scale-[0.98] border border-border/30"
        >
          {/* 플레이어 번호 (오른쪽 상단) */}
          <div className="absolute top-1 right-1 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">{player.position}</span>
          </div>

          <div className="text-sm font-medium truncate py-1">{player.username}</div>
        </button>
      ))}
    </div>
  );
}
