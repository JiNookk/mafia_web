import { GamePhase, GameStateResponse } from '@/types/game.type';
import { PlayerWithVotes } from '@/hooks/useGameState';

interface GameHeaderProps {
  gameState: GameStateResponse;
  timer: number;
  players: PlayerWithVotes[];
}

export function GameHeader({ gameState, timer, players }: GameHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseInfo = (phase?: GamePhase) => {
    switch (phase) {
      case GamePhase.NIGHT:
        return { icon: '🌙', title: '밤이 되었습니다', color: 'text-primary' };
      case GamePhase.DAY:
        return { icon: '☀️', title: '낮이 되었습니다', color: 'text-warning' };
      case GamePhase.VOTE:
        return { icon: '⚖️', title: '투표 시간', color: 'text-warning' };
      case GamePhase.DEFENSE:
        return { icon: '🛡️', title: '최후 변론', color: 'text-destructive' };
      case GamePhase.RESULT:
        return { icon: '🎯', title: '결과 발표', color: 'text-success' };
      default:
        return { icon: '🌙', title: '대기 중', color: 'text-muted-foreground' };
    }
  };

  const phaseInfo = getPhaseInfo(gameState.currentPhase as GamePhase | undefined);

  const topVotedPlayer = gameState.currentPhase === GamePhase.VOTE && players.length > 0
    ? players.reduce((max, p) => p.voteCount > (max?.voteCount || 0) ? p : max, players[0])
    : null;

  return (
    <>
      <div className="bg-gradient-to-b from-card to-background p-4 text-center border-b-2 border-primary/30">
        <div className={`text-lg font-semibold mb-2 ${phaseInfo.color}`}>
          {phaseInfo.icon} {phaseInfo.title}
        </div>
        <div className="text-3xl font-bold text-destructive">{formatTime(timer)}</div>
      </div>

      {topVotedPlayer && topVotedPlayer.voteCount > 0 && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-card/50 animate-fade-in">
          <div className="text-sm text-muted-foreground text-center mb-1">최다 득표</div>
          <div className="text-lg font-semibold text-destructive text-center">
            {topVotedPlayer.username} ({topVotedPlayer.voteCount}표)
          </div>
        </div>
      )}
    </>
  );
}
