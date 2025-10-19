import { GamePhase, GameRole } from '@/types/game.type';

interface SimpleGameHeaderProps {
  dayCount: number;
  currentPhase: GamePhase;
  timer: number;
  myRole: GameRole;
  myNickname?: string;
  defendantUsername?: string;
}

export function SimpleGameHeader({ dayCount, currentPhase, timer, myRole, myNickname, defendantUsername }: SimpleGameHeaderProps) {
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
        return '최종 투표';
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

  const getRoleInfo = (role: GameRole) => {
    switch (role) {
      case GameRole.CITIZEN:
        return { icon: '👤', text: '시민', color: 'text-muted-foreground' };
      case GameRole.MAFIA:
        return { icon: '🔫', text: '마피아', color: 'text-destructive' };
      case GameRole.DOCTOR:
        return { icon: '💊', text: '의사', color: 'text-success' };
      case GameRole.POLICE:
        return { icon: '🔍', text: '경찰', color: 'text-primary' };
      default:
        return { icon: '❓', text: '알 수 없음', color: 'text-muted-foreground' };
    }
  };

  const roleInfo = getRoleInfo(myRole);

  return (
    <div className="h-[10vh] bg-card border-b border-border/50 flex flex-col justify-center px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">
            {dayCount}일차
          </span>
          <span className={`text-base font-semibold ${getPhaseColor(currentPhase)}`}>
            {getPhaseText(currentPhase)}
          </span>
          <div className="h-6 w-px bg-border/50" />
          <span className={`text-base font-semibold ${roleInfo.color}`}>
            {roleInfo.icon} {roleInfo.text}
            {myNickname && <span className="text-muted-foreground ml-1">({myNickname})</span>}
          </span>
        </div>
        <div className="text-2xl font-bold text-destructive">
          {formatTime(timer)}
        </div>
      </div>

      {/* 재판 대상자 표시 (DEFENSE/RESULT 페이즈) */}
      {(currentPhase === GamePhase.DEFENSE || currentPhase === GamePhase.RESULT) && defendantUsername && (
        <div className="mt-1 text-sm">
          <span className="text-muted-foreground">재판 대상자:</span>
          <span className="ml-2 font-bold text-destructive">{defendantUsername}</span>
        </div>
      )}
    </div>
  );
}
