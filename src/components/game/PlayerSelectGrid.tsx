import { PlayerWithVotes } from '@/hooks/useGameState';

interface PlayerSelectGridProps {
  players: PlayerWithVotes[];
  onSelectPlayer: (playerId: string) => void;
  myVotedPlayerId?: string | null;
  myAbilityTargetId?: string | null;
}

export function PlayerSelectGrid({ players, onSelectPlayer, myVotedPlayerId, myAbilityTargetId }: PlayerSelectGridProps) {
  const alivePlayers = players.filter(p => p.isAlive === true);

  console.log('👥 PlayerSelectGrid - All players:', players.map(p => ({
    username: p.username,
    isAlive: p.isAlive,
    voteCount: p.voteCount
  })));
  console.log('✅ PlayerSelectGrid - Alive players:', alivePlayers.map(p => p.username));
  console.log('🎯 myVotedPlayerId:', myVotedPlayerId);
  console.log('🎯 myAbilityTargetId:', myAbilityTargetId);

  return (
    <div className="grid grid-cols-4 gap-2 p-3">
      {alivePlayers.map((player) => {
        const isMyVote = myVotedPlayerId === player.userId;
        const isMyAbilityTarget = myAbilityTargetId === player.userId;
        const isHighlighted = isMyVote || isMyAbilityTarget;
        const hasVotes = player.voteCount > 0;

        return (
          <button
            key={player.userId}
            onClick={() => onSelectPlayer(player.userId!)}
            className={`relative rounded-xl p-2 text-center transition-all border ${
              isHighlighted
                ? 'bg-primary/30 border-primary border-2 scale-105'
                : 'bg-card/50 hover:bg-card/70 active:scale-[0.98] border-border/30'
            }`}
          >
            {/* 플레이어 번호 (오른쪽 상단) */}
            <div className="absolute top-1 right-1 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">{player.position}</span>
            </div>

            {/* 득표수 (왼쪽 상단) */}
            {hasVotes && (
              <div className="absolute top-1 left-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{player.voteCount}</span>
              </div>
            )}

            <div className="text-sm font-medium truncate py-1">{player.username}</div>
          </button>
        );
      })}
    </div>
  );
}
