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

  const addNightResultEvent = useCallback((deaths: string[] | undefined, playerNames?: Map<string, string>) => {
    if (deaths && deaths.length > 0) {
      // 죽은 사람들 표시
      deaths.forEach(userId => {
        const username = playerNames?.get(userId) || '알 수 없음';
        addEvent({
          id: `night-death-${userId}-${Date.now()}`,
          type: 'death',
          message: `어젯밤 ${username}님이 마피아에게 살해당했습니다`,
          timestamp: new Date().toISOString()
        });
      });
    } else {
      // 아무도 죽지 않음 (의사가 막았거나 공격 없음)
      addEvent({
        id: `night-result-${Date.now()}`,
        type: 'info',
        message: '어젯밤 아무도 죽지 않았습니다',
        timestamp: new Date().toISOString()
      });
    }
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

  const addPoliceCheckResultEvent = useCallback((targetUsername: string, targetRole: string) => {
    const roleText = targetRole === 'MAFIA' ? '마피아' :
                     targetRole === 'POLICE' ? '경찰' :
                     targetRole === 'DOCTOR' ? '의사' : '시민';

    addEvent({
      id: `police-check-${Date.now()}`,
      type: targetRole === 'MAFIA' ? 'death' : 'info',
      message: `조사 결과: ${targetUsername}님은 ${roleText}입니다`,
      timestamp: new Date().toISOString()
    });
  }, [addEvent]);

  return {
    events,
    addEvent,
    addPhaseChangeEvent,
    addDeathEvent,
    addActionEvent,
    addNightResultEvent,
    addVoteResultEvent,
    addPoliceCheckResultEvent
  };
}
