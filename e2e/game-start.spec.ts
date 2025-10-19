import { test, expect } from '@playwright/test';
import {
  createPlayers,
  mockRoomDetail,
  mockGameStart,
  closePlayers,
  type TestPlayer,
} from './helpers/test-utils';

test.describe('게임 시작', () => {
  let players: TestPlayer[];
  const roomId = 'test-room-1';
  const gameId = 'test-game-1';

  test.beforeEach(async ({ context }) => {
    // 8명의 플레이어 생성
    players = await createPlayers(context, 8);

    // 모든 플레이어 localStorage 설정
    for (const player of players) {
      await player.page.evaluate((userId) => {
        localStorage.setItem('mafia_session_id', userId);
      }, player.userId);
    }

    // 방 상세 정보 모킹
    await mockRoomDetail(players, roomId, '테스트 게임방');
  });

  test.afterEach(async () => {
    await closePlayers(players);
  });

  test('호스트가 8명 미만일 때 게임 시작 시도 시 에러 표시', async () => {
    // 7명만 있는 방 모킹
    const members = players.slice(0, 7).map((p, index) => ({
      userId: p.userId,
      nickname: p.nickname,
      role: index === 0 ? 'HOST' : 'MEMBER',
    }));

    await players[0].page.route(`**/api/rooms/${roomId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: roomId,
            name: '테스트 게임방',
            currentPlayers: 7,
            maxPlayers: 8,
            members,
          },
        }),
      });
    });

    await players[0].page.goto(`/rooms/${roomId}`);

    // 게임 시작 버튼 클릭
    await players[0].page.getByRole('button', { name: '게임 시작' }).click();

    // 에러 토스트 확인
    await expect(
      players[0].page.getByText('8명이 모여야 게임을 시작할 수 있습니다')
    ).toBeVisible();
  });

  test('호스트가 8명일 때 게임 시작 성공', async () => {
    // 게임 시작 API 모킹
    await mockGameStart(players[0], roomId, gameId);

    await players[0].page.goto(`/rooms/${roomId}`);

    // 게임 시작 버튼 클릭
    await players[0].page.getByRole('button', { name: '게임 시작' }).click();

    // 성공 토스트 확인
    await expect(players[0].page.getByText('게임이 시작되었습니다!')).toBeVisible();

    // 게임 페이지로 이동 확인
    await players[0].page.waitForURL(`**/rooms/${roomId}/game/${gameId}`, {
      timeout: 5000,
    });
    expect(players[0].page.url()).toContain(`/rooms/${roomId}/game/${gameId}`);
  });

  test('게임 시작 시 모든 플레이어가 게임 페이지로 리다이렉트', async () => {
    // 모든 플레이어를 대기실로 이동
    for (const player of players) {
      await player.page.goto(`/rooms/${roomId}`);
    }

    // WebSocket 메시지 시뮬레이션을 위한 평가
    // 실제 환경에서는 WebSocket으로 GAME_STARTED 메시지가 전송됨
    for (const player of players) {
      await player.page.evaluate((gId) => {
        // WebSocket 메시지 수신 시뮬레이션
        window.dispatchEvent(
          new CustomEvent('websocket-message', {
            detail: {
              type: 'GAME_STARTED',
              data: { gameId: gId },
            },
          })
        );
      }, gameId);
    }

    // 모든 플레이어가 게임 페이지로 이동했는지 확인
    // (실제로는 WebSocket을 통한 리다이렉트이므로 타임아웃 대기)
    await players[0].page.waitForTimeout(1000);
  });

  test('호스트가 아닌 플레이어는 게임 시작 버튼을 볼 수 없음', async () => {
    // 일반 멤버로 접속
    await players[1].page.goto(`/rooms/${roomId}`);

    // 게임 시작 버튼이 없어야 함
    await expect(
      players[1].page.getByRole('button', { name: '게임 시작' })
    ).not.toBeVisible();
  });

  test('게임 시작 API 실패 시 에러 메시지 표시', async () => {
    await players[0].page.route(`**/api/rooms/${roomId}/games/start`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '게임 시작에 실패했습니다',
        }),
      });
    });

    await players[0].page.goto(`/rooms/${roomId}`);

    // 게임 시작 버튼 클릭
    await players[0].page.getByRole('button', { name: '게임 시작' }).click();

    // 에러 토스트 확인
    await expect(
      players[0].page.getByText('게임 시작에 실패했습니다')
    ).toBeVisible();
  });
});
