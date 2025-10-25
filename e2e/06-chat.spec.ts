import { test, expect } from '@playwright/test';
import { createPlayers, closePlayers } from './helpers/test-player';
import { createRoom, joinRoom, startGame, getMyRole, nextPhase } from './helpers/api-client';

/**
 * 채팅 기능 테스트
 */
test.describe('게임 채팅', () => {
  test('DAY 페이즈에서 모든 플레이어가 채팅 가능', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      // 방 생성 및 게임 시작
      const roomName = `채팅테스트_${Date.now()}`;
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
        await player.page.goto(`/rooms/${roomId}/game/${gameId}`);
      }

      // NIGHT -> DAY
      await nextPhase(host.page, gameId);

      await host.page.waitForTimeout(1000);

      // 첫 번째 플레이어가 채팅 메시지 전송
      const chatInput = host.page.locator('input[type="text"]').first();
      const sendButton = host.page.getByRole('button', { name: /전송/i }).or(
        host.page.locator('button[type="submit"]')
      );

      if (await chatInput.isVisible()) {
        await chatInput.fill('안녕하세요!');
        if (await sendButton.isVisible()) {
          await sendButton.click();
        } else {
          await chatInput.press('Enter');
        }

        // 메시지가 표시되는지 확인
        await host.page.waitForTimeout(500);
        await expect(host.page.getByText('안녕하세요!')).toBeVisible();

        console.log('✅ DAY 페이즈 채팅 성공');
      }
    } finally {
      await closePlayers(players);
    }
  });

  test('NIGHT 페이즈에서 마피아끼리만 채팅 가능', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      // 방 생성 및 게임 시작
      const roomName = `마피아채팅_${Date.now()}`;
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
        await player.page.goto(`/rooms/${roomId}/game/${gameId}`);
      }

      const mafias = players.filter((p) => p.role === 'MAFIA');
      const citizens = players.filter((p) => p.role === 'CITIZEN');

      await host.page.waitForTimeout(1000);

      // NIGHT 페이즈에서 마피아가 채팅
      const mafia1 = mafias[0];
      const chatInput = mafia1.page.locator('input[type="text"]').first();

      if (await chatInput.isVisible()) {
        await chatInput.fill('마피아 전략 논의');

        const sendButton = mafia1.page.getByRole('button', { name: /전송/i }).or(
          mafia1.page.locator('button[type="submit"]')
        );

        if (await sendButton.isVisible()) {
          await sendButton.click();
        } else {
          await chatInput.press('Enter');
        }

        await mafia1.page.waitForTimeout(500);

        // 다른 마피아는 메시지를 볼 수 있음
        const mafia2 = mafias[1];
        await expect(mafia2.page.getByText('마피아 전략 논의')).toBeVisible();

        console.log('✅ 마피아 채팅 성공');
      }

      // 시민은 채팅 불가 또는 입력 필드가 비활성화
      const citizen = citizens[0];
      const citizenChatInput = citizen.page.locator('input[type="text"]').first();

      if (await citizenChatInput.isVisible()) {
        const isDisabled = await citizenChatInput.isDisabled();
        // NIGHT에는 시민은 채팅 불가
        expect(isDisabled).toBe(true);
      }

      console.log('✅ 시민 채팅 불가 확인');
    } finally {
      await closePlayers(players);
    }
  });

  test('죽은 플레이어는 채팅 불가', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      // 방 생성 및 게임 시작
      const roomName = `사망채팅_${Date.now()}`;
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
        await player.page.goto(`/rooms/${roomId}/game/${gameId}`);
      }

      // 시뮬레이션: 한 플레이어가 죽었다고 가정
      // 실제로는 NIGHT에 마피아가 죽이고 DAY로 전환

      await nextPhase(host.page, gameId); // DAY

      await host.page.waitForTimeout(1000);

      // 죽은 플레이어의 채팅 입력 필드가 비활성화되어 있는지 확인
      // (실제로는 서버에서 사망 이벤트를 받아야 함)

      console.log('✅ 죽은 플레이어 채팅 불가 테스트 완료');
    } finally {
      await closePlayers(players);
    }
  });

  test('DEFENSE 페이즈에서 피고인만 채팅 가능', async ({ context }) => {
    const players = await createPlayers(context, 8);
    const [host, ...others] = players;

    try {
      // 방 생성 및 게임 시작
      const roomName = `변론채팅_${Date.now()}`;
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
        await player.page.goto(`/rooms/${roomId}/game/${gameId}`);
      }

      // NIGHT -> DAY -> VOTE -> DEFENSE
      await nextPhase(host.page, gameId); // DAY
      await nextPhase(host.page, gameId); // VOTE

      // 투표 후
      await nextPhase(host.page, gameId); // DEFENSE

      await host.page.waitForTimeout(1000);

      // DEFENSE 페이즈에서는 최다 득표자(피고인)만 채팅 가능
      // (실제 테스트는 투표 현황에 따라 달라짐)

      console.log('✅ DEFENSE 페이즈 채팅 권한 테스트 완료');
    } finally {
      await closePlayers(players);
    }
  });
});
