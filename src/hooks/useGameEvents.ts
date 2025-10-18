import { useState, useCallback } from 'react';
import { GameEvent } from '@/components/game/EventLog';
import { GamePhase } from '@/types/game.type';

export function useGameEvents() {
  const [events, setEvents] = useState<GameEvent[]>([]);

  const addEvent = useCallback((event: GameEvent) => {
    setEvents(prev => [...prev, event]);
  }, []);

  const addPhaseChangeEvent = useCallback((phase: GamePhase, dayCount: number) => {
    const phaseText = phase === GamePhase.NIGHT ? '밤' :
                      phase === GamePhase.DAY ? '낮' :
                      phase === GamePhase.VOTE ? '투표' : '결과';

    addEvent({
      id: `phase-${Date.now()}`,
      type: 'phase',
      message: `${dayCount}일차 ${phaseText}이 시작되었습니다`,
      timestamp: new Date().toISOString()
    });
  }, [addEvent]);

  const addDeathEvent = useCallback((username: string, userId: string) => {
    addEvent({
      id: `death-${userId}-${Date.now()}`,
      type: 'death',
      message: `${username}님이 사망했습니다`,
      timestamp: new Date().toISOString()
    });
  }, [addEvent]);

  const addActionEvent = useCallback((username: string, actionText: string) => {
    addEvent({
      id: `action-${Date.now()}`,
      type: 'info',
      message: `${username}님을 ${actionText}`,
      timestamp: new Date().toISOString()
    });
  }, [addEvent]);

  const addNightResultEvent = useCallback((deaths: string[] | undefined) => {
    if (!deaths || deaths.length === 0) {
      // 아무도 죽지 않음 (의사가 막음)
      addEvent({
        id: `night-result-${Date.now()}`,
        type: 'info',
        message: '어젯밤 아무도 죽지 않았습니다. 의사가 공격을 막은 것 같습니다!',
        timestamp: new Date().toISOString()
      });
    }
    // deaths가 있을 경우는 PLAYER_UPDATE로 개별 처리됨
  }, [addEvent]);

  const addVoteResultEvent = useCallback((executedUsername: string | undefined) => {
    if (executedUsername) {
      addEvent({
        id: `vote-result-${Date.now()}`,
        type: 'death',
        message: `투표 결과 ${executedUsername}님이 처형되었습니다`,
        timestamp: new Date().toISOString()
      });
    }
  }, [addEvent]);

  return {
    events,
    addEvent,
    addPhaseChangeEvent,
    addDeathEvent,
    addActionEvent,
    addNightResultEvent,
    addVoteResultEvent
  };
}
