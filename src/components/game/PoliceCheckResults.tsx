import { CheckResult } from '@/types/game.type';

interface PoliceCheckResultsProps {
  results: CheckResult[];
}

export function PoliceCheckResults({ results }: PoliceCheckResultsProps) {
  console.log('👮 PoliceCheckResults 렌더링, results:', results);

  if (results.length === 0) {
    return (
      <div className="p-4 bg-card/50 rounded-lg border border-border/30 text-center text-muted-foreground">
        조사 결과가 없습니다
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MAFIA':
        return 'bg-destructive text-white';
      case 'POLICE':
        return 'bg-blue-500 text-white';
      case 'DOCTOR':
        return 'bg-green-500 text-white';
      case 'CITIZEN':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'MAFIA':
        return '마피아';
      case 'POLICE':
        return '경찰';
      case 'DOCTOR':
        return '의사';
      case 'CITIZEN':
        return '시민';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-foreground px-2">조사 결과</div>
      {results.map((result, index) => (
        <div
          key={index}
          className="p-3 bg-card/50 rounded-lg border border-border/30 flex items-center justify-between"
        >
          <div className="flex flex-col gap-1">
            <div className="font-medium">{result.targetUsername}</div>
            <div className="text-xs text-muted-foreground">
              {result.dayCount}일차
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(result.targetRole || '')}`}>
            {getRoleText(result.targetRole || '')}
          </div>
        </div>
      ))}
    </div>
  );
}
