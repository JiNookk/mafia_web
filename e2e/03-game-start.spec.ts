import { test, expect } from '@playwright/test';
import { createPlayers, closePlayers } from './helpers/test-player';
import { createRoom, joinRoom, startGame, getMyRole, getGamePlayers } from './helpers/api-client';

/**
 * 게임 시작 및 역할 배정 테스트
 */
test.describe('게임 시작 및 역할 배정', () => {
  test('8명이 모여 게임 시작', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      // 호스트가 방 생성
      const roomName = `게임시작테스트_${Date.now()}`;
      const roomResult = await createRoom(host.page, host.userId, roomName);
      const roomId = roomResult.data.id;

      // 나머지 플레이어들 참여
      for (const player of others) {
        await joinRoom(player.page, roomId, player.userId);
      }

      // 모든 플레이어가 방으로 이동
      for (const player of players) {
        await player.page.goto(`/rooms/${roomId}`);
      }

      await players[0].page.waitForTimeout(1000);

      // 호스트가 게임 시작
      const startButton = host.page.getByRole('button', { name: /게임 시작/i });
      await startButton.click();

      // 게임 페이지로 이동 확인
      await host.page.waitForURL('**/game/**', { timeout: 5000 });
      expect(host.page.url()).toContain('/game/');

      // 게임 ID 추출
      const gameUrl = host.page.url();
      const gameId = gameUrl.split('/game/')[1];

      // 모든 플레이어가 게임 페이지로 이동
      for (const player of others) {
        await player.page.goto(`/rooms/${roomId}/game/${gameId}`);
      }

      await players[0].page.waitForTimeout(1000);

      // 모든 플레이어의 역할 확인
      const roles: string[] = [];
      for (const player of players) {
        const roleResult = await getMyRole(player.page, gameId, player.userId);
        expect(roleResult.success).toBe(true);
        expect(roleResult.data?.role).toBeTruthy();

        player.role = roleResult.data.role;
        roles.push(roleResult.data.role);
      }

      // 역할 분포 확인 (마피아 2명, 의사 1명, 경찰 1명, 시민 4명)
      const mafiaCount = roles.filter((r) => r === 'MAFIA').length;
      const doctorCount = roles.filter((r) => r === 'DOCTOR').length;
      const policeCount = roles.filter((r) => r === 'POLICE').length;
      const citizenCount = roles.filter((r) => r === 'CITIZEN').length;

      expect(mafiaCount).toBe(2);
      expect(doctorCount).toBe(1);
      expect(policeCount).toBe(1);
      expect(citizenCount).toBe(4);

      // 게임 플레이어 목록 확인
      const playersResult = await getGamePlayers(host.page, gameId);
      expect(playersResult.success).toBe(true);
      expect(playersResult.data.players.length).toBe(8);

      // 모든 플레이어가 생존 상태
      for (const player of playersResult.data.players) {
        expect(player.isAlive).toBe(true);
      }
    } finally {
      await closePlayers(players);
    }
  });

  test('5명 미만일 때 게임 시작 불가', async ({ context }) => {
    const players = await createPlayers(context, 4);
    const [host, ...others] = players;

    try {
      // 호스트가 방 생성
      const roomName = `인원부족_${Date.now()}`;
      const roomResult = await createRoom(host.page, host.userId, roomName);
      const roomId = roomResult.data.id;

      // 나머지 플레이어들 참여 (총 4명)
      for (const player of others) {
        await joinRoom(player.page, roomId, player.userId);
      }

      // 호스트가 방으로 이동
      await host.page.goto(`/rooms/${roomId}`);
      await host.page.waitForTimeout(500);

      // 게임 시작 버튼 확인
      const startButton = host.page.getByRole('button', { name: /게임 시작/i });

      // 버튼이 비활성화되어 있거나, 클릭 시 에러 메시지 표시
      const isDisabled = await startButton.isDisabled();
      if (!isDisabled) {
        // 버튼이 활성화되어 있다면 클릭 시 에러 처리
        await startButton.click();
        await host.page.waitForTimeout(500);

        // 여전히 방 페이지에 있어야 함 (게임 시작 안됨)
        expect(host.page.url()).toContain(`/rooms/${roomId}`);
      }
    } finally {
      await closePlayers(players);
    }
  });

  test('게임 시작 후 NIGHT 페이즈로 시작', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      // 방 생성 및 플레이어 참여
      const roomName = `페이즈테스트_${Date.now()}`;
      const roomResult = await createRoom(host.page, host.userId, roomName);
      const roomId = roomResult.data.id;

      for (const player of others) {
        await joinRoom(player.page, roomId, player.userId);
      }

      // 게임 시작
      const gameResult = await startGame(host.page, roomId);
      expect(gameResult.success).toBe(true);
      expect(gameResult.data?.currentPhase).toBe('NIGHT');
      expect(gameResult.data?.dayCount).toBe(1);

      const gameId = gameResult.data.gameId;

      // 모든 플레이어가 게임 페이지로 이동
      for (const player of players) {
        await player.page.goto(`/rooms/${roomId}/game/${gameId}`);
      }

      await players[0].page.waitForTimeout(1000);

      // NIGHT 페이즈 UI 확인
      await expect(host.page.getByText(/NIGHT/i).or(host.page.getByText(/밤/i))).toBeVisible();
    } finally {
      await closePlayers(players);
    }
  });

  test('마피아는 다른 마피아를 볼 수 있음', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      // 방 생성 및 게임 시작
      const roomName = `마피아확인_${Date.now()}`;
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

      // 마피아 플레이어 찾기
      const mafias = players.filter((p) => p.role === 'MAFIA');
      expect(mafias.length).toBe(2);

      // 첫 번째 마피아가 게임 페이지로 이동
      await mafias[0].page.goto(`/rooms/${roomId}/game/${gameId}`);
      await mafias[0].page.waitForTimeout(1000);

      // 마피아는 다른 마피아의 닉네임을 볼 수 있어야 함
      // (UI에서 마피아끼리 구별 가능하도록 표시됨)
      const otherMafiaNickname = mafias[1].nickname;
      await expect(mafias[0].page.getByText(otherMafiaNickname)).toBeVisible();
    } finally {
      await closePlayers(players);
    }
  });
});
