import { GameRole, GamePhase } from '@/types/game.type';

interface RoleInfoProps {
  role?: GameRole;
  currentPhase: GamePhase;
}

export function RoleInfo({ role, currentPhase }: RoleInfoProps) {
  const getRoleInfo = (role?: GameRole) => {
    switch (role) {
      case GameRole.MAFIA:
        return { icon: '🔫', name: '마피아', color: 'text-destructive' };
      case GameRole.POLICE:
        return { icon: '👮', name: '경찰', color: 'text-primary' };
      case GameRole.DOCTOR:
        return { icon: '💊', name: '의사', color: 'text-success' };
      case GameRole.CITIZEN:
        return { icon: '👤', name: '시민', color: 'text-foreground' };
      default:
        return { icon: '👤', name: '시민', color: 'text-foreground' };
    }
  };

  if (currentPhase !== GamePhase.NIGHT) return null;

  const roleInfo = getRoleInfo(role);

  return (
    <div className="gradient-primary mx-4 mt-4 p-4 rounded-xl text-center text-lg font-semibold shadow-glow animate-fade-in">
      {roleInfo.icon} 당신은 {roleInfo.name}입니다
    </div>
  );
}
