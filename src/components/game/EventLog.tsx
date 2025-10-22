interface GameEvent {
  id: string;
  type: 'death' | 'save' | 'vote' | 'phase' | 'info';
  message: string;
  timestamp: string;
}

interface EventLogProps {
  events: GameEvent[];
}

export function EventLog({ events }: EventLogProps) {
  const getEventIcon = (type: GameEvent['type']) => {
    switch (type) {
      case 'death':
        return '💀';
      case 'save':
        return '💊';
      case 'vote':
        return '⚖️';
      case 'phase':
        return '🔔';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const getEventColor = (type: GameEvent['type']) => {
    switch (type) {
      case 'death':
        return 'text-destructive';
      case 'save':
        return 'text-success';
      case 'vote':
        return 'text-warning';
      case 'phase':
        return 'text-primary';
      case 'info':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-card/30 rounded-lg p-3 animate-fade-in"
        >
          <div className="flex items-start gap-2">
            <span className={`text-lg ${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </span>
            <div className="flex-1">
              <p className={`text-sm ${getEventColor(event.type)}`}>
                {event.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export type { GameEvent };
