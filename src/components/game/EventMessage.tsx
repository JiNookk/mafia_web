import { GameEvent } from './EventLog';

interface EventMessageProps {
  event: GameEvent;
}

export function EventMessage({ event }: EventMessageProps) {
  return (
    <div className="bg-card/30 rounded-lg p-3 animate-fade-in text-center">
      <p className="text-sm text-muted-foreground">
        {event.message}
      </p>
    </div>
  );
}
