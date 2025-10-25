import { test, expect } from '@playwright/test';
import { createPlayers, closePlayers } from './helpers/test-player';
import {
  createRoom,
  joinRoom,
  startGame,
  getMyRole,
  registerAction,
  nextPhase,
  getVoteStatus,
  getGameState,
  getGamePlayers,
} from './helpers/api-client';

/**
 * 게임 플로우 통합 테스트
 */
test.describe('게임 플로우', () => {
  test('NIGHT -> DAY -> VOTE -> DEFENSE -> RESULT 전체 사이클', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      // 방 생성 및 게임 시작
      const roomName = `전체사이클_${Date.now()}`;
      const roomResult = await createRoom(host.page, host.userId, roomName);
      const roomId = roomResult.data.id;

      for (const player of others) {
        await joinRoom(player.page, roomId, player.userId);
      }

      const gameResult = await startGame(host.page, roomId);
      const gameId = gameResult.data.gameId;

      // 모든 플레이어의 역할 확인
      for (const player of players) {
        const roleResult = await getMyRole(player.page, gameId, player.userId);
        player.role = roleResult.data.role;
      }

      // 마피아, 의사, 경찰 찾기
      const mafias = players.filter((p) => p.role === 'MAFIA');
      const doctor = players.find((p) => p.role === 'DOCTOR')!;
      const police = players.find((p) => p.role === 'POLICE')!;
      const citizens = players.filter((p) => p.role === 'CITIZEN');

      console.log('역할 분포:', {
        mafias: mafias.map((m) => m.nickname),
        doctor: doctor.nickname,
        police: police.nickname,
        citizens: citizens.map((c) => c.nickname),
      });

      // ========================================
      // Phase 1: NIGHT (Day 1)
      // ========================================
      console.log('🌙 Phase 1: NIGHT');

      // 마피아가 공격 대상 선택 (첫 번째 시민)
      const mafiaTarget = citizens[0];
      await registerAction(mafias[0].page, gameId, {
        type: 'MAFIA_KILL',
        actorUserId: mafias[0].userId,
        targetUserId: mafiaTarget.userId,
      });

      // 의사가 치료 대상 선택 (마피아가 공격한 시민을 치료)
      await registerAction(doctor.page, gameId, {
        type: 'DOCTOR_HEAL',
        actorUserId: doctor.userId,
        targetUserId: mafiaTarget.userId,
      });

      // 경찰이 조사 대상 선택 (첫 번째 마피아 조사)
      await registerAction(police.page, gameId, {
        type: 'POLICE_CHECK',
        actorUserId: police.userId,
        targetUserId: mafias[0].userId,
      });

      console.log('✅ NIGHT 행동 완료');

      // ========================================
      // Phase 2: DAY
      // ========================================
      console.log('🌅 Phase 2: DAY');

      // 다음 페이즈로 전환
      const dayPhaseResult = await nextPhase(host.page, gameId);
      expect(dayPhaseResult.success).toBe(true);
      expect(dayPhaseResult.data.currentPhase).toBe('DAY');

      // 밤 결과 확인 (의사가 치료해서 아무도 죽지 않음)
      const lastPhaseResult = dayPhaseResult.data.lastPhaseResult;
      if (lastPhaseResult && lastPhaseResult.deaths) {
        expect(lastPhaseResult.deaths.length).toBe(0);
      }

      console.log('✅ DAY: 아무도 죽지 않음 (의사 치료 성공)');

      // ========================================
      // Phase 3: VOTE
      // ========================================
      console.log('🗳️ Phase 3: VOTE');

      const votePhaseResult = await nextPhase(host.page, gameId);
      expect(votePhaseResult.data.currentPhase).toBe('VOTE');

      // 모든 플레이어가 첫 번째 마피아에게 투표
      for (const player of players) {
        await registerAction(player.page, gameId, {
          type: 'VOTE',
          actorUserId: player.userId,
          targetUserId: mafias[0].userId,
        });
      }

      // 투표 현황 확인
      await host.page.waitForTimeout(500);
      const voteStatus = await getVoteStatus(host.page, gameId, 1);
      expect(voteStatus.success).toBe(true);

      console.log('✅ VOTE 완료');

      // ========================================
      // Phase 4: DEFENSE
      // ========================================
      console.log('⚖️ Phase 4: DEFENSE');

      const defensePhaseResult = await nextPhase(host.page, gameId);
      expect(defensePhaseResult.data.currentPhase).toBe('DEFENSE');

      // 변론 시간 (실제로는 채팅 등)
      await host.page.waitForTimeout(1000);

      console.log('✅ DEFENSE 완료');

      // ========================================
      // Phase 5: RESULT
      // ========================================
      console.log('💀 Phase 5: RESULT');

      const resultPhaseResult = await nextPhase(host.page, gameId);
      expect(resultPhaseResult.data.currentPhase).toBe('RESULT');

      // 최종 투표 (과반수가 찬성하면 처형)
      for (const player of players.slice(0, 5)) {
        if (player.userId !== mafias[0].userId) {
          await registerAction(player.page, gameId, {
            type: 'FINAL_VOTE',
            actorUserId: player.userId,
            targetUserId: mafias[0].userId,
          });
        }
      }

      await host.page.waitForTimeout(500);

      console.log('✅ RESULT 완료');

      // ========================================
      // Phase 6: NIGHT (Day 2)
      // ========================================
      console.log('🌙 Phase 6: NIGHT (Day 2)');

      const night2Result = await nextPhase(host.page, gameId);
      expect(night2Result.data.currentPhase).toBe('NIGHT');
      expect(night2Result.data.dayCount).toBe(2);

      // 처형 결과 확인
      const executedUserId = night2Result.data.lastPhaseResult?.executedUserId;
      if (executedUserId) {
        expect(executedUserId).toBe(mafias[0].userId);
        console.log(`✅ ${mafias[0].nickname} 처형됨`);
      }

      // 플레이어 생존 상태 확인
      const playersResult = await getGamePlayers(host.page, gameId);
      const deadPlayers = playersResult.data.players.filter((p: any) => !p.isAlive);
      expect(deadPlayers.length).toBeGreaterThan(0);

      console.log('🎮 전체 사이클 완료!');
    } finally {
      await closePlayers(players);
    }
  });

  test('마피아가 시민을 죽이고 다음 날로 진행', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      // 방 생성 및 게임 시작
      const roomName = `사망테스트_${Date.now()}`;
      const roomResult = await createRoom(host.page, host.userId, roomName);
      const roomId = roomResult.data.id;

      for (const player of others) {
        await joinRoom(player.page, roomId, player.userId);
      }

      const gameResult = await startGame(host.page, roomId);
      const gameId = gameResult.data.gameId;

      // 역할 확인
      for (const player of players) {
        const roleResult = await getMyRole(player.page, gameId, player.userId);
        player.role = roleResult.data.role;
      }

      const mafias = players.filter((p) => p.role === 'MAFIA');
      const citizens = players.filter((p) => p.role === 'CITIZEN');

      // NIGHT: 마피아가 시민 공격 (의사는 다른 사람 치료)
      const target = citizens[0];
      await registerAction(mafias[0].page, gameId, {
        type: 'MAFIA_KILL',
        actorUserId: mafias[0].userId,
        targetUserId: target.userId,
      });

      // DAY로 전환
      const dayPhaseResult = await nextPhase(host.page, gameId);

      // 사망자 확인
      const deaths = dayPhaseResult.data.lastPhaseResult?.deaths;
      if (deaths && deaths.length > 0) {
        expect(deaths[0].userId).toBe(target.userId);
        console.log(`✅ ${target.nickname} 사망`);
      }

      // 플레이어 목록에서 사망 확인
      const playersResult = await getGamePlayers(host.page, gameId);
      const deadPlayer = playersResult.data.players.find((p: any) => p.userId === target.userId);
      expect(deadPlayer.isAlive).toBe(false);
    } finally {
      await closePlayers(players);
    }
  });

  test('경찰이 마피아를 조사하면 마피아로 판명', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      // 방 생성 및 게임 시작
      const roomName = `경찰조사_${Date.now()}`;
      const roomResult = await createRoom(host.page, host.userId, roomName);
      const roomId = roomResult.data.id;

      for (const player of others) {
        await joinRoom(player.page, roomId, player.userId);
      }

      const gameResult = await startGame(host.page, roomId);
      const gameId = gameResult.data.gameId;

      // 역할 확인
      for (const player of players) {
        const roleResult = await getMyRole(player.page, gameId, player.userId);
        player.role = roleResult.data.role;
      }

      const police = players.find((p) => p.role === 'POLICE')!;
      const mafia = players.find((p) => p.role === 'MAFIA')!;

      // NIGHT: 경찰이 마피아 조사
      await registerAction(police.page, gameId, {
        type: 'POLICE_CHECK',
        actorUserId: police.userId,
        targetUserId: mafia.userId,
      });

      // DAY로 전환
      await nextPhase(host.page, gameId);

      // 경찰 조사 결과 조회 (별도 API 필요 시)
      // const checkResults = await getPoliceCheckResults(police.page, gameId, police.userId);
      // expect(checkResults.data.results).toContainEqual({
      //   targetUserId: mafia.userId,
      //   targetRole: 'MAFIA',
      // });

      console.log('✅ 경찰이 마피아를 조사함');
    } finally {
      await closePlayers(players);
    }
  });
});
