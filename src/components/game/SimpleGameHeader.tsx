import { GamePhase } from '@/types/game.type';

interface SimpleGameHeaderProps {
  dayCount: number;
  currentPhase: GamePhase;
  timer: number;
}

export function SimpleGameHeader({ dayCount, currentPhase, timer }: SimpleGameHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseText = (phase: GamePhase) => {
    switch (phase) {
      case GamePhase.NIGHT:
        return '밤';
      case GamePhase.DAY:
        return '낮';
      case GamePhase.VOTE:
        return '투표';
      case GamePhase.DEFENSE:
        return '변론';
      case GamePhase.RESULT:
        return '결과';
      default:
        return '대기';
    }
  };

  const getPhaseColor = (phase: GamePhase) => {
    switch (phase) {
      case GamePhase.NIGHT:
        return 'text-primary';
      case GamePhase.DAY:
      case GamePhase.VOTE:
        return 'text-warning';
      case GamePhase.DEFENSE:
        return 'text-destructive';
      case GamePhase.RESULT:
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="h-[10vh] bg-card border-b border-border/50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold">
          {dayCount}일차
        </span>
        <span className={`text-base font-semibold ${getPhaseColor(currentPhase)}`}>
          {getPhaseText(currentPhase)}
        </span>
      </div>
      <div className="text-2xl font-bold text-destructive">
        {formatTime(timer)}
      </div>
    </div>
  );
}
