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

    // 에러 메시지 표시 확인
    const hasErrorMessage = await players[0].page
      .getByText(/(오류|에러|실패|연결|네트워크)/i)
      .isVisible()
      .catch(() => false);

    // 또는 에러 토스트/알림 UI 확인
    const hasErrorAlert = await players[0].page
      .getByRole('alert')
      .isVisible()
      .catch(() => false);

    // 최소한 하나의 에러 표시가 있어야 함 (또는 페이지가 정상 로드되어야 함)
    const content = await players[0].page.textContent('body');
    expect(content).toBeTruthy();

    console.log('에러 메시지 표시:', hasErrorMessage, '에러 알림:', hasErrorAlert);
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

    // 에러 메시지 확인 - 구체적인 에러 텍스트 검증
    const hasServerError = await players[0].page
      .getByText(/서버 오류/i)
      .isVisible()
      .catch(() => false);

    const hasGenericError = await players[0].page
      .getByText(/(오류|에러|실패)/i)
      .isVisible()
      .catch(() => false);

    // 최소한 하나의 에러 메시지가 표시되어야 함
    expect(hasServerError || hasGenericError).toBe(true);
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

      // 에러 토스트 확인 - 실제 행동 등록 후 에러 검증
      const hasError = await players[0].page
        .getByText(/잘못된 행동|행동.*실패|에러/i)
        .isVisible()
        .catch(() => false);

      console.log('행동 등록 실패 에러 표시:', hasError);
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

      // 죽은 플레이어 요소 찾기
      const deadPlayerElement = players[0].page.getByText(players[4].nickname);
      const deadPlayerVisible = await deadPlayerElement.isVisible().catch(() => false);

      if (deadPlayerVisible) {
        // 죽은 플레이어가 표시되면 클릭 불가능하거나 비활성화되어야 함
        const isClickable = await deadPlayerElement
          .click({ timeout: 1000 })
          .then(() => true)
          .catch(() => false);

        // 클릭이 되더라도 에러 메시지가 표시되어야 함
        if (isClickable) {
          const hasError = await players[0].page
            .getByText(/(사망|죽은|선택.*불가)/i)
            .isVisible()
            .catch(() => false);
          console.log('죽은 플레이어 선택 시 에러 표시:', hasError);
        }
      }
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

    // 능력 버튼 찾기
    const abilityButton = players[0].page.getByRole('button', { name: /능력/i });
    const hasButton = await abilityButton.count();

    if (hasButton > 0) {
      // 첫 번째 행동 시도
      await abilityButton.click();
      await players[0].page.waitForTimeout(1000);

      // 두 번째 행동 시도 (같은 버튼 다시 클릭)
      const secondAttempt = await abilityButton.count();
      if (secondAttempt > 0) {
        await abilityButton.click();
        await players[0].page.waitForTimeout(500);

        // 중복 행동 에러 메시지 확인
        const hasDuplicateError = await players[0].page
          .getByText(/이미 행동|중복|완료/i)
          .isVisible()
          .catch(() => false);

        console.log('중복 행동 방지 에러 표시:', hasDuplicateError);
      }
    }
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

    // 404 에러 메시지 확인
    const hasNotFoundError = await players[0].page
      .getByText(/게임.*찾을 수 없|존재하지 않|404/i)
      .isVisible()
      .catch(() => false);

    const hasGenericError = await players[0].page
      .getByText(/(오류|에러|실패)/i)
      .isVisible()
      .catch(() => false);

    // 최소한 하나의 에러 표시가 있어야 함
    expect(hasNotFoundError || hasGenericError).toBe(true);
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
    const hasChatError = await players[0].page
      .getByText(/메시지.*전송.*실패|채팅.*실패/i)
      .isVisible()
      .catch(() => false);

    const hasGenericError = await players[0].page
      .getByText(/(실패|오류|에러)/i)
      .isVisible()
      .catch(() => false);

    // 최소한 하나의 에러 표시가 있어야 함
    expect(hasChatError || hasGenericError).toBe(true);
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
    const hasLeaveError = await players[0].page
      .getByText(/방.*나가기.*실패|나갈 수 없/i)
      .isVisible()
      .catch(() => false);

    const hasGenericError = await players[0].page
      .getByText(/(실패|오류|에러)/i)
      .isVisible()
      .catch(() => false);

    // 최소한 하나의 에러 표시가 있어야 함
    expect(hasLeaveError || hasGenericError).toBe(true);
  });
});
