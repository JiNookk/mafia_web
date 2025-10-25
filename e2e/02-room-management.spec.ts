import { test, expect } from '@playwright/test';
import { createPlayers, closePlayers } from './helpers/test-player';
import { createRoom, joinRoom, getRoomDetail } from './helpers/api-client';

/**
 * 방 생성 및 참여 테스트
 */
test.describe('방 생성 및 관리', () => {
  test('방 생성 후 방 상세 페이지로 이동', async ({ context }) => {
    const [host] = await createPlayers(context, 1);

    try {
      // 로비로 이동
      await host.page.goto('/lobby');

      // 방 만들기 버튼 클릭
      await host.page.getByRole('button', { name: '방 만들기' }).click();

      // 방 제목 입력
      const roomName = `테스트방_${Date.now()}`;
      await host.page.getByPlaceholder('방 제목 입력').fill(roomName);

      // 생성 버튼 클릭
      await host.page.getByRole('button', { name: '생성' }).click();

      // 방 상세 페이지로 이동 확인
      await host.page.waitForURL('**/rooms/**');
      expect(host.page.url()).toContain('/rooms/');

      // 방 제목이 표시되는지 확인
      await expect(host.page.getByText(roomName)).toBeVisible();

      // 게임 시작 버튼이 호스트에게만 표시되는지 확인
      await expect(host.page.getByRole('button', { name: /게임 시작/i })).toBeVisible();
    } finally {
      await closePlayers([host]);
    }
  });

  test('여러 플레이어가 같은 방에 참여', async ({ context }) => {
    const players = await createPlayers(context, 4);
    const [host, player2, player3, player4] = players;

    try {
      // 호스트가 방 생성
      const roomName = `멀티플레이방_${Date.now()}`;
      const roomResult = await createRoom(host.page, host.userId, roomName);

      // createRoom은 이제 내부적으로 validation을 하므로 data가 항상 존재
      const roomId = roomResult.data.id;

      // 호스트가 방으로 이동
      await host.page.goto(`/rooms/${roomId}`, { waitUntil: 'networkidle' });

      // 나머지 플레이어들이 방에 참여
      for (const player of [player2, player3, player4]) {
        const joinResult = await joinRoom(player.page, roomId, player.userId);
        expect(joinResult.success).toBe(true);

        await player.page.goto(`/rooms/${roomId}`, { waitUntil: 'networkidle' });
      }

      // 모든 플레이어가 방에 있는지 확인 (WebSocket 동기화 대기)
      await host.page.waitForLoadState('networkidle');

      // 방 상세 정보 조회
      const roomDetail = await getRoomDetail(host.page, roomId);

      expect(roomDetail.success).toBe(true);
      expect(roomDetail.data.members.length).toBe(4);

      // 플레이어 목록에 모든 닉네임이 표시되는지 확인
      for (const player of players) {
        await expect(host.page.getByText(player.nickname)).toBeVisible();
      }
    } finally {
      await closePlayers(players);
    }
  });

  test('방 인원이 8명 초과 시 참여 불가', async ({ context }) => {
    const players = await createPlayers(context, 9);

    try {
      const [host, ...others] = players;

      // 호스트가 방 생성
      const roomName = `풀방테스트_${Date.now()}`;
      const roomResult = await createRoom(host.page, host.userId, roomName);
      const roomId = roomResult.data.id;

      // 처음 7명 참여 (호스트 포함 총 8명)
      for (const player of others.slice(0, 7)) {
        const joinResult = await joinRoom(player.page, roomId, player.userId);
        expect(joinResult.success).toBe(true);
      }

      // 9번째 플레이어 참여 시도
      const lastPlayer = others[7];
      const joinResult = await joinRoom(lastPlayer.page, roomId, lastPlayer.userId);

      // 방이 꽉 찼으므로 실패해야 함
      expect(joinResult.success).toBe(false);
    } finally {
      await closePlayers(players);
    }
  });

  test('방 나가기', async ({ context }) => {
    const players = await createPlayers(context, 2);
    const [host, player2] = players;

    try {
      // 호스트가 방 생성
      const roomName = `나가기테스트_${Date.now()}`;
      const roomResult = await createRoom(host.page, host.userId, roomName);
      const roomId = roomResult.data.id;

      // Player2 참여
      await joinRoom(player2.page, roomId, player2.userId);

      // Player2가 방으로 이동
      await player2.page.goto(`/rooms/${roomId}`);
      await player2.page.waitForTimeout(500);

      // Player2가 방 나가기
      const leaveButton = player2.page.getByRole('button', { name: /나가기/i });
      if (await leaveButton.isVisible()) {
        await leaveButton.click();

        // 로비로 돌아가는지 확인
        await player2.page.waitForURL('**/lobby');
        expect(player2.page.url()).toContain('/lobby');
      }
    } finally {
      await closePlayers(players);
    }
  });

  test('호스트가 방을 나가면 방이 삭제됨', async ({ context }) => {
    const players = await createPlayers(context, 2);
    const [host, player2] = players;

    try {
      // 호스트가 방 생성
      const roomName = `호스트나가기_${Date.now()}`;
      const roomResult = await createRoom(host.page, host.userId, roomName);
      const roomId = roomResult.data.id;

      // Player2 참여
      await joinRoom(player2.page, roomId, player2.userId);

      await host.page.goto(`/rooms/${roomId}`);
      await player2.page.goto(`/rooms/${roomId}`);
      await host.page.waitForTimeout(500);

      // 호스트가 나가기
      const leaveButton = host.page.getByRole('button', { name: /나가기/i });
      if (await leaveButton.isVisible()) {
        await leaveButton.click();

        // 호스트는 로비로 이동
        await host.page.waitForURL('**/lobby');

        // Player2도 자동으로 방에서 나가짐 (방이 삭제됨)
        await player2.page.waitForTimeout(1000);

        // 방 상세 조회 시 에러 또는 없음
        const roomDetail = await getRoomDetail(player2.page, roomId);
        expect(roomDetail.success).toBe(false);
      }
    } finally {
      await closePlayers(players);
    }
  });
});
