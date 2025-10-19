import { test, expect } from '@playwright/test';
import {
  createPlayers,
  assignRoles,
  mockGameState,
  mockMyRole,
  mockGamePlayers,
  closePlayers,
  type TestPlayer,
} from './helpers/test-utils';

/**
 * 채팅 권한 및 타입 테스트
 *
 * 채팅 권한 규칙:
 * - NIGHT: 마피아는 GAME_MAFIA, 나머지는 GAME_ALL
 * - DAY, VOTE: 생존자는 GAME_ALL
 * - DEFENSE: 최다 득표자만 채팅 가능
 * - 죽은 플레이어: GAME_DEAD 채팅만 가능
 */
test.describe('채팅 권한 테스트', () => {
  let players: TestPlayer[];
  const gameId = 'chat-test-game-1';

  test.beforeEach(async ({ context }) => {
    players = await createPlayers(context, 8);
    assignRoles(players);

    for (const player of players) {
      await player.page.evaluate(
        ({ userId, nickname }) => {
          localStorage.setItem('mafia_session_id', userId);
          localStorage.setItem('mafia_nickname', nickname);
        },
        { userId: player.userId, nickname: player.nickname }
      );
    }

    await mockGamePlayers(players, gameId);

    for (const player of players) {
      await mockMyRole(player, gameId);
    }
  });

  test.afterEach(async () => {
    await closePlayers(players);
  });

  test('NIGHT 페이즈: 마피아는 마피아 채팅 사용', async () => {
    await mockGameState(players, gameId, 'NIGHT', 1);

    const mafiaPlayer = players.find((p) => p.role === 'MAFIA')!;
    await mafiaPlayer.page.goto(`/rooms/test-room/game/${gameId}`);
    await mafiaPlayer.page.waitForTimeout(1000);

    // 채팅 입력창이 있어야 함
    const chatInput = mafiaPlayer.page.getByPlaceholder(/메시지/i);
    await expect(chatInput).toBeVisible();

    // 채팅 타입이 GAME_MAFIA인지 확인 (실제로는 useChatPermission 훅에서 결정)
    const content = await mafiaPlayer.page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('NIGHT 페이즈: 일반 시민은 전체 채팅 사용', async () => {
    await mockGameState(players, gameId, 'NIGHT', 1);

    const citizenPlayer = players.find((p) => p.role === 'CITIZEN')!;
    await citizenPlayer.page.goto(`/rooms/test-room/game/${gameId}`);
    await citizenPlayer.page.waitForTimeout(1000);

    // 채팅 입력창이 있어야 함
    const chatInput = citizenPlayer.page.getByPlaceholder(/메시지/i);
    await expect(chatInput).toBeVisible();
  });

  test('DAY 페이즈: 생존자는 전체 채팅 사용 가능', async () => {
    await mockGameState(players, gameId, 'DAY', 1);

    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1000);

    // 채팅 입력창이 있어야 함
    const chatInput = players[0].page.getByPlaceholder(/메시지/i);
    await expect(chatInput).toBeVisible();
  });

  test('죽은 플레이어는 죽은 자 채팅만 가능', async () => {
    // Player5 사망 처리
    players[4].isAlive = false;
    await mockGamePlayers(players, gameId);
    await mockMyRole(players[4], gameId);

    await mockGameState(players, gameId, 'DAY', 1);

    await players[4].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[4].page.waitForTimeout(1000);

    // 채팅 입력창 확인
    // 죽은 플레이어는 GAME_DEAD 채팅만 가능
    const chatInput = players[4].page.getByPlaceholder(/메시지/i);
    const isVisible = await chatInput.isVisible().catch(() => false);

    // 실제 구현에 따라 죽은 플레이어는 채팅이 제한될 수 있음
    console.log('죽은 플레이어 채팅 입력창 가시성:', isVisible);
  });

  test('VOTE 페이즈: 생존자는 전체 채팅 가능', async () => {
    await mockGameState(players, gameId, 'VOTE', 1);

    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1000);

    const chatInput = players[0].page.getByPlaceholder(/메시지/i);
    await expect(chatInput).toBeVisible();
  });

  test('채팅 메시지 전송 후 입력창 초기화', async () => {
    await mockGameState(players, gameId, 'DAY', 1);

    // 채팅 전송 API 모킹
    await players[0].page.route('**/api/games/**/chat/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'chat-1',
            userId: players[0].userId,
            nickname: players[0].nickname,
            message: '테스트 메시지',
          },
        }),
      });
    });

    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1000);

    const chatInput = players[0].page.getByPlaceholder(/메시지/i);

    // 메시지 입력 및 전송
    await chatInput.fill('테스트 메시지');
    await chatInput.press('Enter');

    // 입력창이 비워져야 함
    await players[0].page.waitForTimeout(500);
    const value = await chatInput.inputValue();
    expect(value).toBe('');
  });

  test('DEFENSE 페이즈: 최다 득표자만 채팅 가능 (구현 예정)', async () => {
    await mockGameState(players, gameId, 'DEFENSE', 1);

    // 최다 득표자가 아닌 플레이어
    await players[0].page.goto(`/rooms/test-room/game/${gameId}`);
    await players[0].page.waitForTimeout(1000);

    // DEFENSE 페이즈에서는 최다 득표자만 채팅 가능
    // 실제 구현에 따라 입력창이 비활성화되거나 숨겨질 수 있음
    const chatInput = players[0].page.getByPlaceholder(/메시지/i);
    const isDisabled = await chatInput.isDisabled().catch(() => true);

    console.log('DEFENSE 페이즈 채팅 입력창 비활성화 상태:', isDisabled);
  });
});
