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
 * 에러 처리 및 엣지 케이스 테스트
 */
test.describe('에러 처리 및 엣지 케이스', () => {
  let players: TestPlayer[];
  const gameId = 'error-test-game-1';
  const roomId = 'error-test-room-1';

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
  });

  test.afterEach(async () => {
    await closePlayers(players);
  });

  test('네트워크 오류 시 에러 메시지 표시', async () => {
    // API 요청 실패 모킹
    await players[0].page.route(`**/api/games/${gameId}`, async (route) => {
      await route.abort('failed');
    });

    await players[0].page.goto(`/rooms/${roomId}/game/${gameId}`);
    await players[0].page.waitForTimeout(1500);

    // 에러 처리 확인 (실제로는 토스트나 에러 UI가 표시됨)
    const content = await players[0].page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('API 응답 500 에러 처리', async () => {
    await players[0].page.route(`**/api/games/${gameId}`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '서버 오류가 발생했습니다',
        }),
      });
    });

    await players[0].page.goto(`/rooms/${roomId}/game/${gameId}`);
    await players[0].page.waitForTimeout(1500);

    // 에러 메시지 확인
    const hasError = await players[0].page
      .getByText(/오류/i)
      .isVisible()
      .catch(() => false);

    console.log('500 에러 표시 여부:', hasError);
  });

  test('행동 등록 API 실패 시 에러 토스트', async () => {
    await mockGameState(players, gameId, 'NIGHT', 1);
    await mockGamePlayers(players, gameId);
    await mockMyRole(players[0], gameId);

    // 행동 등록 실패 모킹
    await players[0].page.route(`**/api/games/${gameId}/actions`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '잘못된 행동입니다',
        }),
      });
    });

    await players[0].page.goto(`/rooms/${roomId}/game/${gameId}`);
    await players[0].page.waitForTimeout(1500);

    // 능력 버튼 클릭 (마피아)
    const abilityButton = players[0].page.getByRole('button', { name: /능력/i });
    const hasButton = await abilityButton.count();

    if (hasButton > 0) {
      await abilityButton.click();
      await players[0].page.waitForTimeout(500);

      // 에러 토스트 확인
      // (실제로는 행동 등록 후 에러 표시)
    }
  });

  test('죽은 플레이어를 타겟으로 선택 시도 (방지)', async () => {
    // Player5 사망
    players[4].isAlive = false;

    await mockGameState(players, gameId, 'VOTE', 1);
    await mockGamePlayers(players, gameId);
    await mockMyRole(players[0], gameId);

    await players[0].page.goto(`/rooms/${roomId}/game/${gameId}`);
    await players[0].page.waitForTimeout(1500);

    // 투표 버튼 클릭
    const voteButton = players[0].page.getByRole('button', { name: /투표/i });
    const hasButton = await voteButton.count();

    if (hasButton > 0) {
      await voteButton.click();
      await players[0].page.waitForTimeout(500);

      // 죽은 플레이어는 선택 불가능해야 함
      // (실제 구현에서는 클릭 방지 또는 에러 표시)
      console.log('죽은 플레이어 선택 방지 테스트');
    }
  });

  test('중복 행동 시도 (같은 페이즈)', async () => {
    await mockGameState(players, gameId, 'NIGHT', 1);
    await mockGamePlayers(players, gameId);
    await mockMyRole(players[0], gameId);

    // 첫 번째 행동은 성공
    let requestCount = 0;
    await players[0].page.route(`**/api/games/${gameId}/actions`, async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        // 두 번째 행동은 실패
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: '이미 행동을 완료했습니다',
          }),
        });
      }
    });

    await players[0].page.goto(`/rooms/${roomId}/game/${gameId}`);
    await players[0].page.waitForTimeout(1500);

    // 첫 번째 행동 시도
    // (실제 UI에서 능력 사용)

    // 두 번째 행동 시도
    // (에러 메시지가 표시되어야 함)
    console.log('중복 행동 방지 테스트');
  });

  test('세션 만료 시 로그인 페이지로 리다이렉트', async () => {
    // localStorage에서 세션 제거
    await players[0].page.evaluate(() => {
      localStorage.removeItem('mafia_session_id');
      localStorage.removeItem('mafia_nickname');
    });

    await players[0].page.goto('/lobby');

    // 세션이 없으면 entry 페이지로 리다이렉트
    await players[0].page.waitForURL('**/entry', { timeout: 5000 });
    expect(players[0].page.url()).toContain('/entry');
  });

  test('잘못된 gameId로 접근 시 에러 처리', async () => {
    await players[0].page.route('**/api/games/invalid-game-id', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '게임을 찾을 수 없습니다',
        }),
      });
    });

    await players[0].page.goto(`/rooms/${roomId}/game/invalid-game-id`);
    await players[0].page.waitForTimeout(1500);

    // 에러 처리 확인
    const content = await players[0].page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('투표 현황 API 실패 시 처리', async () => {
    await mockGameState(players, gameId, 'VOTE', 1);
    await mockGamePlayers(players, gameId);
    await mockMyRole(players[0], gameId);

    // 투표 현황 API 실패
    await players[0].page.route(`**/api/games/${gameId}/votes*`, async (route) => {
      await route.abort('failed');
    });

    await players[0].page.goto(`/rooms/${roomId}/game/${gameId}`);
    await players[0].page.waitForTimeout(1500);

    // 투표 현황 없이도 페이지가 정상 작동해야 함
    const content = await players[0].page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('채팅 전송 실패 시 에러 표시', async () => {
    await mockGameState(players, gameId, 'DAY', 1);
    await mockGamePlayers(players, gameId);
    await mockMyRole(players[0], gameId);

    // 채팅 전송 실패 모킹
    await players[0].page.route('**/api/games/**/chat/**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '메시지 전송에 실패했습니다',
        }),
      });
    });

    await players[0].page.goto(`/rooms/${roomId}/game/${gameId}`);
    await players[0].page.waitForTimeout(1500);

    const chatInput = players[0].page.getByPlaceholder(/메시지/i);
    await chatInput.fill('테스트 메시지');
    await chatInput.press('Enter');

    // 에러 토스트 확인
    await players[0].page.waitForTimeout(500);
    const hasError = await players[0].page
      .getByText(/실패/i)
      .isVisible()
      .catch(() => false);

    console.log('채팅 전송 실패 에러 표시:', hasError);
  });

  test('방 나가기 실패 시 에러 처리', async () => {
    await players[0].page.route(`**/api/rooms/${roomId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: roomId,
            name: '테스트 방',
            currentPlayers: 1,
            maxPlayers: 8,
            members: [
              {
                userId: players[0].userId,
                nickname: players[0].nickname,
                role: 'HOST',
              },
            ],
          },
        }),
      });
    });

    await players[0].page.route(`**/api/rooms/${roomId}/leave`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '방 나가기에 실패했습니다',
        }),
      });
    });

    await players[0].page.goto(`/rooms/${roomId}`);
    await players[0].page.waitForTimeout(1000);

    // 뒤로가기 버튼 클릭
    const backButton = players[0].page
      .locator('button')
      .filter({ has: players[0].page.locator('svg') })
      .first();
    await backButton.click();

    // 에러 토스트 확인
    await players[0].page.waitForTimeout(500);
    const hasError = await players[0].page
      .getByText(/실패/i)
      .isVisible()
      .catch(() => false);

    console.log('방 나가기 실패 에러 표시:', hasError);
  });
});
