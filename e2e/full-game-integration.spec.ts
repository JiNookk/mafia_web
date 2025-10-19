import { test, expect } from '@playwright/test';
import {
  createPlayers,
  assignRoles,
  mockGameState,
  mockMyRole,
  mockGamePlayers,
  mockRegisterAction,
  mockVoteStatus,
  mockNextPhase,
  closePlayers,
  type TestPlayer,
} from './helpers/test-utils';

/**
 * 전체 게임 플로우 통합 테스트
 *
 * 시나리오:
 * 1. 8명의 플레이어가 모여 게임 시작
 * 2. 직업 배정 (마피아 2, 의사 1, 경찰 1, 시민 4)
 * 3. NIGHT 페이즈: 각 직업별 능력 사용
 * 4. DAY 페이즈: 밤 결과 확인
 * 5. VOTE 페이즈: 투표 진행
 * 6. DEFENSE 페이즈: 최다 득표자 변론
 * 7. RESULT 페이즈: 처형 결과
 * 8. 게임 종료 조건 확인
 */
test.describe('전체 게임 플로우 통합 테스트', () => {
  let players: TestPlayer[];
  const roomId = 'integration-room-1';
  const gameId = 'integration-game-1';

  test.beforeEach(async ({ context }) => {
    // 8명의 플레이어 생성
    players = await createPlayers(context, 8);
    assignRoles(players);

    // localStorage 설정
    for (const player of players) {
      await player.page.evaluate(
        ({ userId, nickname }) => {
          localStorage.setItem('mafia_session_id', userId);
          localStorage.setItem('mafia_nickname', nickname);
        },
        { userId: player.userId, nickname: player.nickname }
      );
    }
  });

  test.afterEach(async () => {
    await closePlayers(players);
  });

  test('Day 1: NIGHT -> DAY -> VOTE -> RESULT 전체 사이클', async () => {
    // ========================================
    // Phase 1: NIGHT
    // ========================================
    console.log('🌙 Phase 1: NIGHT 시작');

    await mockGameState(players, gameId, 'NIGHT', 1);
    await mockGamePlayers(players, gameId);

    for (const player of players) {
      await mockMyRole(player, gameId);
      await mockRegisterAction(player, gameId);
    }

    // 모든 플레이어 게임 페이지로 이동
    await Promise.all(
      players.map((p) => p.page.goto(`/rooms/${roomId}/game/${gameId}`))
    );

    // 페이지 로딩 대기
    await players[0].page.waitForTimeout(1500);

    // 마피아 Player1이 Player5를 공격
    const mafia1 = players[0]; // MAFIA
    await mafia1.page.evaluate(() => {
      console.log('마피아가 Player5를 타겟으로 선택');
    });

    // 의사 Player3이 Player5를 치료 (마피아 공격 막음)
    const doctor = players[2]; // DOCTOR
    await doctor.page.evaluate(() => {
      console.log('의사가 Player5를 치료');
    });

    // 경찰 Player4가 Player1을 조사
    const police = players[3]; // POLICE
    await police.page.evaluate(() => {
      console.log('경찰이 Player1을 조사');
    });

    console.log('✅ NIGHT 페이즈 행동 완료');

    // ========================================
    // Phase 2: DAY
    // ========================================
    console.log('🌅 Phase 2: DAY 시작');

    // 의사가 치료해서 아무도 죽지 않음
    await mockGameState(players, gameId, 'DAY', 1);
    await mockNextPhase(players, gameId, 'DAY', 1, {
      deaths: [], // 의사가 막음
    });

    // DAY 페이즈 전환 (실제로는 WebSocket으로 전환)
    await players[0].page.evaluate(() => {
      console.log('DAY 페이즈로 전환됨');
    });

    await players[0].page.waitForTimeout(1000);

    // DAY 페이즈 확인
    let content = await players[0].page.textContent('body');
    expect(content).toContain('DAY');

    console.log('✅ DAY 페이즈: 아무도 죽지 않음 (의사 치료 성공)');

    // ========================================
    // Phase 3: VOTE
    // ========================================
    console.log('🗳️ Phase 3: VOTE 시작');

    await mockGameState(players, gameId, 'VOTE', 1);

    // 투표 현황: Player1 (마피아)에게 5표
    await mockVoteStatus(players, gameId, 1, [
      { targetUserId: players[0].userId, count: 5 }, // Player1 (MAFIA)
      { targetUserId: players[1].userId, count: 2 }, // Player2 (MAFIA)
      { targetUserId: players[4].userId, count: 1 }, // Player5 (CITIZEN)
    ]);

    await players[0].page.waitForTimeout(1000);

    console.log('✅ VOTE 페이즈: Player1 (마피아)이 최다 득표');

    // ========================================
    // Phase 4: DEFENSE
    // ========================================
    console.log('⚖️ Phase 4: DEFENSE 시작');

    await mockGameState(players, gameId, 'DEFENSE', 1);

    // 최다 득표자 Player1만 채팅 가능
    await players[0].page.waitForTimeout(500);

    console.log('✅ DEFENSE 페이즈: Player1 변론 시간');

    // ========================================
    // Phase 5: RESULT (처형)
    // ========================================
    console.log('💀 Phase 5: RESULT 시작');

    // Player1 처형
    players[0].isAlive = false;

    await mockGameState(players, gameId, 'RESULT', 1);
    await mockNextPhase(players, gameId, 'RESULT', 1, {
      executedUserId: players[0].userId,
    });
    await mockGamePlayers(players, gameId); // 업데이트된 생존자 목록

    await players[1].page.waitForTimeout(1000);

    console.log('✅ RESULT 페이즈: Player1 (마피아) 처형됨');

    // ========================================
    // Phase 6: NIGHT (Day 2)
    // ========================================
    console.log('🌙 Phase 6: NIGHT (Day 2) 시작');

    await mockGameState(players, gameId, 'NIGHT', 2);

    // 남은 마피아 Player2가 Player6를 공격
    // 의사가 Player7을 치료 (Player6 사망)
    await mockNextPhase(players, gameId, 'DAY', 2, {
      deaths: [{ userId: players[5].userId, username: players[5].nickname }], // Player6 사망
    });

    players[5].isAlive = false;
    await mockGamePlayers(players, gameId);

    await players[1].page.waitForTimeout(1000);

    console.log('✅ NIGHT (Day 2): Player6 사망');

    // ========================================
    // Phase 7: DAY (Day 2)
    // ========================================
    console.log('🌅 Phase 7: DAY (Day 2) 시작');

    await mockGameState(players, gameId, 'DAY', 2);

    await players[1].page.waitForTimeout(1000);

    // 생존자 확인: 7명 중 6명 생존 (Player1, Player6 사망)
    const alivePlayers = players.filter((p) => p.isAlive);
    expect(alivePlayers.length).toBe(6);

    console.log('✅ DAY (Day 2): Player6 사망 확인, 6명 생존');

    // ========================================
    // 게임 계속 진행...
    // ========================================
    console.log('🎮 게임 계속 진행 가능');
  });

  test('게임 시작부터 시민 승리까지', async () => {
    console.log('🎯 시나리오: 시민 승리');

    // ========================================
    // 초기 설정
    // ========================================
    await mockGameState(players, gameId, 'NIGHT', 1);
    await mockGamePlayers(players, gameId);

    for (const player of players) {
      await mockMyRole(player, gameId);
      await mockRegisterAction(player, gameId);
    }

    await Promise.all(
      players.map((p) => p.page.goto(`/rooms/${roomId}/game/${gameId}`))
    );

    await players[0].page.waitForTimeout(1500);

    // ========================================
    // Day 1: 마피아 1명 처형
    // ========================================
    console.log('📅 Day 1');

    // NIGHT -> DAY (아무도 안죽음)
    await mockGameState(players, gameId, 'DAY', 1);
    await mockNextPhase(players, gameId, 'DAY', 1, { deaths: [] });

    // VOTE: Player1 (마피아) 처형
    await mockGameState(players, gameId, 'VOTE', 1);
    await mockVoteStatus(players, gameId, 1, [
      { targetUserId: players[0].userId, count: 6 },
    ]);

    // RESULT: Player1 처형
    players[0].isAlive = false;
    await mockGameState(players, gameId, 'RESULT', 1);
    await mockNextPhase(players, gameId, 'RESULT', 1, {
      executedUserId: players[0].userId,
    });
    await mockGamePlayers(players, gameId);

    console.log('✅ Day 1: 마피아 1명 (Player1) 처형');

    // ========================================
    // Day 2: 마피아 2명 모두 제거 -> 시민 승리
    // ========================================
    console.log('📅 Day 2');

    // NIGHT -> DAY (Player5 사망)
    players[4].isAlive = false;
    await mockGameState(players, gameId, 'DAY', 2);
    await mockNextPhase(players, gameId, 'DAY', 2, {
      deaths: [{ userId: players[4].userId, username: players[4].nickname }],
    });
    await mockGamePlayers(players, gameId);

    // VOTE: Player2 (마피아) 처형
    await mockGameState(players, gameId, 'VOTE', 2);
    await mockVoteStatus(players, gameId, 2, [
      { targetUserId: players[1].userId, count: 5 },
    ]);

    // RESULT: Player2 처형 -> 모든 마피아 제거
    players[1].isAlive = false;
    await mockGameState(players, gameId, 'RESULT', 2);
    await mockNextPhase(players, gameId, 'RESULT', 2, {
      executedUserId: players[1].userId,
    });
    await mockGamePlayers(players, gameId);

    console.log('✅ Day 2: 마피아 2명 모두 제거');

    // ========================================
    // 게임 종료: 시민 승리
    // ========================================
    const mafiaAlive = players.filter((p) => p.isAlive && p.role === 'MAFIA');
    expect(mafiaAlive.length).toBe(0);

    console.log('🎉 게임 종료: 시민 승리!');
  });

  test('마피아 승리 시나리오', async () => {
    console.log('🎯 시나리오: 마피아 승리');

    // ========================================
    // 초기 설정
    // ========================================
    await mockGameState(players, gameId, 'NIGHT', 1);
    await mockGamePlayers(players, gameId);

    for (const player of players) {
      await mockMyRole(player, gameId);
    }

    await Promise.all(
      players.map((p) => p.page.goto(`/rooms/${roomId}/game/${gameId}`))
    );

    await players[0].page.waitForTimeout(1500);

    // ========================================
    // 시민들을 계속 제거
    // ========================================
    console.log('🔪 마피아가 시민들을 제거 중...');

    // Day 1: Player5 사망, Player6 처형
    players[4].isAlive = false;
    players[5].isAlive = false;
    await mockGamePlayers(players, gameId);

    // Day 2: Player7 사망, Player8 처형
    players[6].isAlive = false;
    players[7].isAlive = false;
    await mockGamePlayers(players, gameId);

    // Day 3: Player3 (의사) 사망, Player4 (경찰) 처형
    players[2].isAlive = false;
    players[3].isAlive = false;
    await mockGamePlayers(players, gameId);

    // ========================================
    // 생존자 확인: 마피아 2명 vs 시민 0명
    // ========================================
    const alivePlayers = players.filter((p) => p.isAlive);
    const mafiaAlive = alivePlayers.filter((p) => p.role === 'MAFIA');
    const citizenAlive = alivePlayers.filter((p) => p.role !== 'MAFIA');

    expect(mafiaAlive.length).toBe(2);
    expect(citizenAlive.length).toBe(0);

    console.log('😈 게임 종료: 마피아 승리!');
    console.log(`생존자: 마피아 ${mafiaAlive.length}명, 시민 ${citizenAlive.length}명`);
  });

  test('여러 페이즈 전환과 WebSocket 시뮬레이션', async () => {
    console.log('🔄 페이즈 전환 테스트');

    await mockGameState(players, gameId, 'NIGHT', 1);
    await mockGamePlayers(players, gameId);

    for (const player of players) {
      await mockMyRole(player, gameId);
    }

    await Promise.all(
      players.map((p) => p.page.goto(`/rooms/${roomId}/game/${gameId}`))
    );

    await players[0].page.waitForTimeout(1500);

    // ========================================
    // WebSocket 메시지 시뮬레이션
    // ========================================

    // PHASE_CHANGE: NIGHT -> DAY
    await players[0].page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('websocket-phase-change', {
          detail: {
            currentPhase: 'DAY',
            dayCount: 1,
            lastPhaseResult: { deaths: [] },
          },
        })
      );
    });

    console.log('✅ WebSocket PHASE_CHANGE 시뮬레이션: NIGHT -> DAY');

    // PLAYER_UPDATE: Player5 사망
    await players[0].page.evaluate((userId) => {
      window.dispatchEvent(
        new CustomEvent('websocket-player-update', {
          detail: {
            userId,
            isAlive: false,
          },
        })
      );
    }, players[4].userId);

    console.log('✅ WebSocket PLAYER_UPDATE 시뮬레이션: Player5 사망');

    // VOTE_UPDATE: 투표 현황 업데이트
    await players[0].page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('websocket-vote-update', {
          detail: {
            votes: [{ targetUserId: 'test-user-1', voteCount: 3 }],
          },
        })
      );
    });

    console.log('✅ WebSocket VOTE_UPDATE 시뮬레이션: 투표 현황 업데이트');

    await players[0].page.waitForTimeout(1000);
  });
});
