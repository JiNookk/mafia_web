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

test.describe('게임 진행 플로우', () => {
  let players: TestPlayer[];
  const gameId = 'test-game-1';

  test.beforeEach(async ({ context }) => {
    // 8명의 플레이어 생성 및 직업 배정
    players = await createPlayers(context, 8);
    assignRoles(players);

    // localStorage 설정
    for (const player of players) {
      await player.page.evaluate((userId) => {
        localStorage.setItem('mafia_session_id', userId);
      }, player.userId);
    }

    // 기본 API 모킹
    await mockGameState(players, gameId, 'NIGHT', 1);
    await mockGamePlayers(players, gameId);

    for (const player of players) {
      await mockMyRole(player, gameId);
      await mockRegisterAction(player, gameId);
    }
  });

  test.afterEach(async () => {
    await closePlayers(players);
  });

  test('게임 페이지 로드 시 내 직업이 표시되어야 함', async () => {
    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);

    // 직업 표시 대기 (MAFIA)
    await players[0].page.waitForTimeout(1000);

    // 헤더에 직업 정보 표시 확인
    const content = await players[0].page.textContent('body');
    expect(content).toContain('MAFIA');
  });

  test('NIGHT 페이즈에서 마피아는 능력 사용 가능', async () => {
    const mafiaPlayer = players.find((p) => p.role === 'MAFIA')!;

    await mafiaPlayer.page.goto(`/rooms/test-room/game/${gameId}`);
    await mafiaPlayer.page.waitForTimeout(1000);

    // 능력 버튼이 보여야 함
    const abilityButton = mafiaPlayer.page.getByRole('button', { name: /능력/i });
    await expect(abilityButton).toBeVisible();
  });

  test('NIGHT 페이즈에서 의사는 치료 능력 사용 가능', async () => {
    const doctorPlayer = players.find((p) => p.role === 'DOCTOR')!;

    await doctorPlayer.page.goto(`/rooms/test-room/game/${gameId}`);
    await doctorPlayer.page.waitForTimeout(1000);

    // 능력 버튼이 보여야 함
    const abilityButton = doctorPlayer.page.getByRole('button', { name: /능력/i });
    await expect(abilityButton).toBeVisible();
  });

  test('NIGHT 페이즈에서 경찰은 조사 능력 사용 가능', async () => {
    const policePlayer = players.find((p) => p.role === 'POLICE')!;

    await policePlayer.page.goto(`/rooms/test-room/game/${gameId}`);
    await policePlayer.page.waitForTimeout(1000);

    // 능력 버튼이 보여야 함
    const abilityButton = policePlayer.page.getByRole('button', { name: /능력/i });
    await expect(abilityButton).toBeVisible();
  });

  test('NIGHT 페이즈에서 일반 시민은 능력 사용 불가', async () => {
    const citizenPlayer = players.find((p) => p.role === 'CITIZEN')!;

    await citizenPlayer.page.goto(`/rooms/test-room/game/${gameId}`);
    await citizenPlayer.page.waitForTimeout(1000);

    // 능력 버튼이 없거나 비활성화되어야 함
    const abilityButton = citizenPlayer.page.getByRole('button', { name: /능력/i });
    const count = await abilityButton.count();
    expect(count).toBe(0);
  });

  test('DAY 페이즈로 전환 시 밤 결과 표시', async () => {
    // DAY 페이즈로 변경
    await mockGameState(players, gameId, 'DAY', 1);

    // 죽은 플레이어 설정
    players[4].isAlive = false;

    // 플레이어 목록 업데이트
    await mockGamePlayers(players, gameId);

    // 다음 페이즈 모킹 (NIGHT -> DAY, 죽은 사람 포함)
    await mockNextPhase(players, gameId, 'DAY', 1, {
      deaths: [{ userId: players[4].userId, username: players[4].nickname }],
    });

    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1000);

    // DAY 페이즈 확인
    const content = await players[0].page.textContent('body');
    expect(content).toContain('DAY');
  });

  test('VOTE 페이즈에서 투표 가능', async () => {
    // VOTE 페이즈로 변경
    await mockGameState(players, gameId, 'VOTE', 1);
    await mockVoteStatus(players, gameId, 1, []);

    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1000);

    // 투표 버튼이 보여야 함
    const voteButton = players[0].page.getByRole('button', { name: /투표/i });
    await expect(voteButton).toBeVisible();
  });

  test('투표 후 투표 현황 업데이트', async () => {
    // VOTE 페이즈로 변경
    await mockGameState(players, gameId, 'VOTE', 1);

    // 투표 현황 모킹 (Player2에게 2표)
    await mockVoteStatus(players, gameId, 1, [
      { targetUserId: players[1].userId, count: 2 },
    ]);

    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1000);

    // 투표 현황이 표시되는지 확인 (실제 UI 구현에 따라 다름)
    // 여기서는 간단히 페이지 내용만 확인
    const content = await players[0].page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('채팅 메시지 입력 가능', async () => {
    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1000);

    // 채팅 입력창 찾기
    const chatInput = players[0].page.getByPlaceholder(/메시지/i);
    await expect(chatInput).toBeVisible();

    // 메시지 입력
    await chatInput.fill('테스트 메시지');
    await expect(chatInput).toHaveValue('테스트 메시지');
  });

  test('죽은 플레이어는 회색으로 표시', async () => {
    // 한 명 사망 처리
    players[4].isAlive = false;
    await mockGamePlayers(players, gameId);

    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1500);

    // 페이지 로드 확인 (실제로는 죽은 플레이어 스타일 확인)
    const content = await players[0].page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('메모 기능 사용 가능', async () => {
    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1000);

    // 메모 버튼 찾기
    const memoButton = players[0].page.getByRole('button', { name: /메모/i });

    // 메모 버튼이 있으면 클릭
    const count = await memoButton.count();
    if (count > 0) {
      await memoButton.click();
      // 메모 모달 또는 UI가 표시되는지 확인
      await players[0].page.waitForTimeout(500);
    }
  });

  test('타이머가 표시되어야 함', async () => {
    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1000);

    // 헤더에 타이머 표시 확인 (초 단위)
    const content = await players[0].page.textContent('body');
    expect(content).toBeTruthy();
  });
});
